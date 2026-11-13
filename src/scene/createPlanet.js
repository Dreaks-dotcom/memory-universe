import * as THREE from "three";

export function createPlanet({
  radius = 4,
  color = "#f7c66a",
  ring = true,
  seed = 1,
} = {}) {
  const baseColor = new THREE.Color(color);
  const white = new THREE.Color("#ffffff");
  const visitedTint = baseColor.clone().lerp(new THREE.Color("#67707d"), 0.72);
  const visitedEmissive = baseColor.clone().multiplyScalar(0.16);
  const normalCoreColor = baseColor.clone().lerp(white, 0.22);
  const group = new THREE.Group();
  const coreRadius = radius * 0.48;
  const orbitSystems = [];
  const satellites = [];

  const hitMesh = createHitMesh(radius);
  const core = createCore(coreRadius, baseColor);
  const innerGlow = createGlow(radius * 1.45, baseColor, 0.2);
  const outerGlow = createGlow(radius * 3.2, baseColor, 0.055);

  group.add(hitMesh, outerGlow, innerGlow, core);

  const orbitCount = ring ? 2 + (seed % 2) : 1;

  for (let index = 0; index < orbitCount; index += 1) {
    const orbit = createOrbit({
      radiusX: radius * (2.2 + index * 0.62),
      radiusZ: radius * (1.45 + index * 0.42),
      color: baseColor,
      opacity: index === 0 ? 0.26 : 0.14,
      seed: seed + index * 11,
    });
    group.add(orbit.line);
    orbitSystems.push(orbit);
  }

  const satelliteCount = ring ? 2 + (seed % 3) : 1;

  for (let index = 0; index < satelliteCount; index += 1) {
    const satellite = createSatellite({
      radius,
      color: baseColor,
      seed: seed + index * 17,
      index,
    });
    group.add(satellite.mesh);
    satellites.push(satellite);
  }

  function update(delta, elapsed, state = {}) {
    const active = state.hovered || state.selected;
    const visited = state.visited;
    const boost = state.selected ? 1.85 : state.hovered ? 1.45 : 1;
    const glowScale = visited ? 0.28 : 1;

    core.rotation.y += delta * (0.24 + (seed % 7) * 0.012);
    core.material.color.lerp(visited ? visitedTint : normalCoreColor, 0.07);
    core.material.emissive.lerp(visited ? visitedEmissive : baseColor, 0.07);
    core.material.emissiveIntensity = THREE.MathUtils.lerp(
      core.material.emissiveIntensity,
      visited ? (active ? 0.28 : 0.12) : 1.15 * boost,
      0.08,
    );

    innerGlow.material.opacity = THREE.MathUtils.lerp(
      innerGlow.material.opacity,
      (active ? 0.34 : 0.2) * glowScale,
      0.08,
    );
    outerGlow.material.opacity = THREE.MathUtils.lerp(
      outerGlow.material.opacity,
      (active ? 0.12 : 0.055) * glowScale,
      0.08,
    );

    for (const orbit of orbitSystems) {
      orbit.line.rotation.z += delta * orbit.speed;
      orbit.line.material.opacity = THREE.MathUtils.lerp(
        orbit.line.material.opacity,
        (active ? orbit.activeOpacity : orbit.baseOpacity) * (visited ? 0.34 : 1),
        0.08,
      );
    }

    for (const satellite of satellites) {
      const angle = elapsed * satellite.speed + satellite.phase;
      satellite.mesh.position.set(
        Math.cos(angle) * satellite.radiusX,
        Math.sin(angle * 0.62) * satellite.height,
        Math.sin(angle) * satellite.radiusZ,
      );
      satellite.mesh.rotation.y += delta * 0.8;
      satellite.mesh.material.color.lerp(visited ? visitedTint : satellite.baseColor, 0.07);
      satellite.mesh.material.emissive.lerp(visited ? visitedEmissive : satellite.baseEmissive, 0.07);
      satellite.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        satellite.mesh.material.emissiveIntensity,
        visited ? (active ? 0.12 : 0.04) : active ? 0.52 : 0.22,
        0.08,
      );
    }
  }

  return {
    group,
    mesh: hitMesh,
    ring: orbitSystems[0]?.line ?? null,
    update,
  };
}

function createHitMesh(radius) {
  const geometry = new THREE.SphereGeometry(Math.max(radius * 3.0, 4.8), 16, 16);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

function createCore(radius, color) {
  const white = new THREE.Color("#ffffff");
  const geometry = new THREE.SphereGeometry(Math.max(radius, 0.46), 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color.clone().lerp(white, 0.22),
    emissive: color,
    emissiveIntensity: 1.15,
    roughness: 0.36,
    metalness: 0.04,
  });
  return new THREE.Mesh(geometry, material);
}

function createGlow(radius, color, opacity) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function createOrbit({ radiusX, radiusZ, color, opacity, seed }) {
  const points = [];
  const segments = 120;

  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.x = Math.PI * (0.24 + (seed % 9) * 0.018);
  line.rotation.y = Math.PI * ((seed % 13) * 0.012);

  return {
    line,
    speed: 0.035 + (seed % 7) * 0.004,
    baseOpacity: opacity,
    activeOpacity: Math.min(opacity * 2.4, 0.54),
  };
}

function createSatellite({ radius, color, seed, index }) {
  const satelliteRadius = Math.max(radius * (0.1 + index * 0.018), 0.2);
  const baseColor = color.clone().lerp(new THREE.Color("#ffffff"), 0.42);
  const baseEmissive = color.clone().multiplyScalar(0.36);
  const geometry = new THREE.SphereGeometry(satelliteRadius, 14, 14);
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: baseEmissive,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.06,
  });

  return {
    mesh: new THREE.Mesh(geometry, material),
    baseColor,
    baseEmissive,
    radiusX: radius * (2.35 + index * 0.58 + (seed % 5) * 0.05),
    radiusZ: radius * (1.55 + index * 0.36 + (seed % 7) * 0.04),
    height: radius * (0.24 + index * 0.06),
    speed: 0.48 + (seed % 7) * 0.045,
    phase: seed * 0.61,
  };
}
