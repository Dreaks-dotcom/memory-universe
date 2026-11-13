import * as THREE from "three";
import { mulberry32 } from "../utils/random.js";

export function createStars({ radius = 2400, count = 100000 } = {}) {
  const group = new THREE.Group();
  const random = mulberry32(19770517);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const star = createGalaxyStar(radius, random);

    positions[i] = star.x;
    positions[i + 1] = star.y;
    positions[i + 2] = star.z;

    color.copy(star.color);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
    sizes[index] = star.size;
    alphas[index] = star.alpha;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
  geometry.computeBoundingSphere();

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
        float perspective = clamp(360.0 / -mvPosition.z, 0.35, 6.0);

        gl_PointSize = size * uPixelRatio * perspective;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float distanceToCenter = length(center);
        float softEdge = 1.0 - smoothstep(0.18, 0.5, distanceToCenter);
        float core = 1.0 - smoothstep(0.0, 0.14, distanceToCenter);

        if (softEdge <= 0.01) {
          discard;
        }

        vec3 glowColor = vColor * (0.74 + core * 0.95);
        gl_FragColor = vec4(glowColor, vAlpha * softEdge);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const starMap = new THREE.Points(geometry, material);
  group.add(starMap);

  function update(delta, elapsed) {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    group.rotation.y += delta * 0.0025;
    group.rotation.x = Math.sin(elapsed * 0.035) * 0.006;
  }

  return {
    group,
    update,
  };
}

function createGalaxyStar(radius, random) {
  const layer = random();

  if (layer < 0.78) {
    return createDiskStar(radius, random);
  }

  if (layer < 0.94) {
    return createHaloStar(radius, random);
  }

  return createNearFieldStar(radius, random);
}

function createDiskStar(radius, random) {
  const armCount = 4;
  const arm = Math.floor(random() * armCount);
  const distance = Math.pow(random(), 1.72) * radius * 0.86;
  const twist = distance * 0.0048;
  const armAngle = (arm / armCount) * Math.PI * 2;
  const angle = armAngle + twist + gaussian(random) * (0.12 + distance / radius * 0.12);
  const drift = gaussian(random) * (8 + distance * 0.018);
  const height = gaussian(random) * (7 + distance * 0.018);

  return {
    x: Math.cos(angle) * distance + Math.cos(angle + Math.PI * 0.5) * drift,
    y: height,
    z: Math.sin(angle) * distance + Math.sin(angle + Math.PI * 0.5) * drift,
    ...createStarAppearance(random, distance / radius, 0.94),
  };
}

function createHaloStar(radius, random) {
  const distance = radius * (0.26 + Math.pow(random(), 0.58) * 0.88);
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);

  return {
    x: distance * Math.sin(phi) * Math.cos(theta),
    y: distance * Math.sin(phi) * Math.sin(theta) * 0.72,
    z: distance * Math.cos(phi),
    ...createStarAppearance(random, distance / radius, 0.42),
  };
}

function createNearFieldStar(radius, random) {
  const distance = radius * (0.38 + random() * 0.62);
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);

  return {
    x: distance * Math.sin(phi) * Math.cos(theta),
    y: distance * Math.sin(phi) * Math.sin(theta),
    z: distance * Math.cos(phi),
    ...createStarAppearance(random, distance / radius, 1.15),
  };
}

function createStarAppearance(random, distanceRatio, layerBrightness) {
  const roll = random();
  const color = new THREE.Color();

  if (roll < 0.13) {
    color.setHSL(0.58 + random() * 0.05, 0.52, 0.66 + random() * 0.2);
  } else if (roll < 0.34) {
    color.setHSL(0.12 + random() * 0.04, 0.38, 0.72 + random() * 0.18);
  } else if (roll < 0.58) {
    color.setHSL(0.07 + random() * 0.04, 0.5, 0.64 + random() * 0.2);
  } else {
    color.setHSL(0.02 + random() * 0.04, 0.44, 0.58 + random() * 0.18);
  }

  const rareBright = random() > 0.985;
  const size = rareBright
    ? 3.0 + random() * 2.4
    : 0.75 + Math.pow(random(), 2.4) * 2.1;
  const centerBoost = 1.0 - Math.min(distanceRatio, 1) * 0.42;
  const alpha = THREE.MathUtils.clamp(
    (0.22 + Math.pow(random(), 1.9) * 0.58) * centerBoost * layerBrightness,
    0.08,
    rareBright ? 0.96 : 0.72,
  );

  return {
    color,
    size,
    alpha,
  };
}

function gaussian(random) {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}
