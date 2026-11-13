import * as THREE from "three";
import { createPlanet } from "./createPlanet.js";
import { hashString, mulberry32 } from "../utils/random.js";

const GOLDEN_ANGLE = 2.399963;

export function createGalaxy({ zones = [], memories = [], visitedIds = new Set() } = {}) {
  const group = new THREE.Group();
  const zoneMap = new Map(zones.map((zone) => [zone.id, zone]));
  const visitedMemoryIds = new Set(visitedIds);
  const bodies = [];
  const interactiveObjects = [];
  const dust = createDustBand();

  let hoveredBody = null;
  let selectedBody = null;

  group.add(dust);

  memories.forEach((memory, memoryIndex) => {
    const zone = zoneMap.get(memory.zoneId);

    if (!zone) {
      return;
    }

    const body =
      memory.kind === "center"
        ? createCenterBody({ memory, zone })
        : createMemoryBody({
            memory,
            zone,
            zoneIndex: getZoneLocalIndex(memories, memory),
            memoryIndex,
          });

    body.mesh.userData.body = body;
    body.group.userData.body = body;
    body.visited = visitedMemoryIds.has(memory.id);
    group.add(body.group);
    bodies.push(body);
    interactiveObjects.push(body.mesh);
  });

  for (const zone of zones) {
    const zoneBodies = bodies.filter((body) => body.zone.id === zone.id);

    if (!zone.isCenter && zoneBodies.length > 0) {
      group.add(createSystemNebula(zone, zoneBodies));
    }
  }

  function update(delta, elapsed) {
    dust.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    dust.rotation.y += delta * 0.018;

    for (const body of bodies) {
      body.group.position.y =
        body.basePosition.y + Math.sin(elapsed * body.floatSpeed + body.phase) * body.floatRange;

      body.group.scale.lerp(
        body === hoveredBody || body === selectedBody ? body.hoverScale : body.baseScale,
        0.08,
      );

      body.update(delta, elapsed, {
        hovered: body === hoveredBody,
        selected: body === selectedBody,
        visited: body.visited,
      });
    }
  }

  function setHovered(body) {
    hoveredBody = body;
  }

  function setSelected(body) {
    selectedBody = body;
  }

  function setVisited(memoryId, visited = true) {
    if (visited) {
      visitedMemoryIds.add(memoryId);
    } else {
      visitedMemoryIds.delete(memoryId);
    }

    const body = bodies.find((item) => item.memory.id === memoryId);

    if (body) {
      body.visited = visited;
    }
  }

  return {
    group,
    bodies,
    interactiveObjects,
    setHovered,
    setSelected,
    setVisited,
    update,
  };
}

function createMemoryBody({ memory, zone, zoneIndex, memoryIndex }) {
  const random = mulberry32(hashString(memory.id));
  const [minScale, maxScale] = zone.planetScale;
  const radius = THREE.MathUtils.lerp(minScale, maxScale, random());
  const planet = createPlanet({
    radius,
    color: zone.color,
    ring: random() > 0.18,
    seed: memoryIndex + 1,
  });
  const basePosition = getClusterPosition(zone, zoneIndex, memory.total, random);
  const baseScale = new THREE.Vector3(1, 1, 1);
  const hoverScale = new THREE.Vector3(1.22, 1.22, 1.22);

  planet.group.position.copy(basePosition);
  planet.group.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);

  return {
    group: planet.group,
    mesh: planet.mesh,
    memory,
    zone,
    basePosition,
    baseScale,
    hoverScale,
    radius,
    focusDistance: Math.max(radius * 18, 46),
    focusLift: Math.max(radius * 4.2, 10),
    phase: random() * Math.PI * 2,
    floatRange: 1.4 + random() * 2.8,
    floatSpeed: 0.38 + random() * 0.34,
    update: planet.update,
  };
}

function createCenterBody({ memory, zone }) {
  const group = new THREE.Group();
  const color = new THREE.Color(zone.color);
  const coreGeometry = new THREE.SphereGeometry(13, 64, 64);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color("#ffffff"), 0.22),
    emissive: color.clone().multiplyScalar(0.78),
    emissiveIntensity: 1.65,
    roughness: 0.28,
    metalness: 0.04,
  });
  const mesh = new THREE.Mesh(coreGeometry, coreMaterial);
  const coronaGeometry = new THREE.SphereGeometry(28, 48, 48);
  const coronaMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  const ring = createCenterHaloRing(color);

  group.add(corona, ring, mesh);

  return {
    group,
    mesh,
    memory,
    zone,
    basePosition: new THREE.Vector3(...zone.center),
    baseScale: new THREE.Vector3(1, 1, 1),
    hoverScale: new THREE.Vector3(1.18, 1.18, 1.18),
    focusDistance: 96,
    focusLift: 24,
    phase: 0,
    floatRange: 0.6,
    floatSpeed: 0.45,
    update(delta, elapsed, state = {}) {
      group.rotation.y += delta * 0.16;
      coreMaterial.emissiveIntensity = 1.65 + Math.sin(elapsed * 1.45) * 0.28;
      coronaMaterial.opacity = THREE.MathUtils.lerp(
        coronaMaterial.opacity,
        state.hovered || state.selected ? 0.3 : 0.16,
        0.08,
      );
      ring.rotation.z += delta * 0.012;
    },
  };
}

function createCenterHaloRing(color) {
  const group = new THREE.Group();
  const radii = [
    [42, 0.18],
    [58, 0.1],
  ];

  for (const [radius, opacity] of radii) {
    const geometry = new THREE.TorusGeometry(radius, 0.08, 8, 160);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);
  }

  return group;
}

// Planets of one system sit in a compact, slightly flattened sunflower spiral,
// so each system reads as one group from afar.
function getClusterPosition(zone, zoneIndex, count, random) {
  const radius = getClusterRadius(count);
  const angle = zoneIndex * GOLDEN_ANGLE + (random() - 0.5) * 0.5;
  const distance = Math.sqrt((zoneIndex + 0.5) / count) * radius;
  const vertical = (random() - 0.5) * radius * 0.45;

  return new THREE.Vector3(...zone.center).add(
    new THREE.Vector3(Math.cos(angle) * distance, vertical, Math.sin(angle) * distance),
  );
}

function getClusterRadius(count) {
  return Math.max(Math.sqrt(count) * 13, 26);
}

// A soft glow in the system's color behind its planets.
function createSystemNebula(zone, zoneBodies) {
  const center = new THREE.Vector3();

  for (const body of zoneBodies) {
    center.add(body.basePosition);
  }

  center.divideScalar(zoneBodies.length);

  const size = (getClusterRadius(zoneBodies.length) + 16) * 2.9;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getNebulaTexture(),
      color: zone.color,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  sprite.position.copy(center);
  sprite.scale.set(size, size, 1);

  return sprite;
}

let nebulaTexture = null;

function getNebulaTexture() {
  if (nebulaTexture) {
    return nebulaTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.22)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.05)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  nebulaTexture = new THREE.CanvasTexture(canvas);
  nebulaTexture.colorSpace = THREE.SRGBColorSpace;

  return nebulaTexture;
}

function getZoneLocalIndex(memories, memory) {
  let index = 0;

  for (const item of memories) {
    if (item.id === memory.id) {
      return index;
    }

    if (item.zoneId === memory.zoneId) {
      index += 1;
    }
  }

  return index;
}

function createDustBand() {
  const count = 2400;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = index * 0.046 + Math.random() * 0.8;
    const distance = 32 + Math.random() * 330;
    const armOffset = Math.sin(angle * 2.2) * 28;
    const height = (Math.random() - 0.5) * 24;

    positions[i] = Math.cos(angle) * distance + Math.cos(angle * 0.55) * armOffset;
    positions[i + 1] = height;
    positions[i + 2] = Math.sin(angle) * distance + Math.sin(angle * 0.55) * armOffset;

    color.setHSL(0.09 + Math.random() * 0.08, 0.5, 0.36 + Math.random() * 0.24);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
    sizes[index] = 1.4 + Math.random() * 2.8;
    alphas[index] = 0.08 + Math.random() * 0.24;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      attribute vec3 color;

      varying vec3 vColor;
      varying float vAlpha;

      uniform float uPixelRatio;

      void main() {
        vColor = color;
        vAlpha = alpha;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float perspective = clamp(260.0 / -mvPosition.z, 0.45, 4.5);

        gl_PointSize = size * uPixelRatio * perspective;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float glow = 1.0 - smoothstep(0.14, 0.5, dist);
        float core = 1.0 - smoothstep(0.0, 0.12, dist);

        if (glow <= 0.01) {
          discard;
        }

        gl_FragColor = vec4(vColor * (0.7 + core * 0.9), vAlpha * glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}
