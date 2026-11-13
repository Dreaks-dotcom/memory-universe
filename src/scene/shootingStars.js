import * as THREE from "three";

// Now and then a faint shooting star crosses the view. Rare on purpose.
const MIN_GAP = 7; // seconds between shooting stars
const MAX_GAP = 16;
const LIFETIME = 1.1; // seconds a streak is visible
const SPEED = 950; // world units per second
const TAIL = 140; // streak length in world units
const DISTANCE = 900; // how far in front of the camera they appear

export function createShootingStars({ camera }) {
  const group = new THREE.Group();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const streaks = [];

  let countdown = randomBetween(3, MAX_GAP);

  function spawn() {
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();
    up.crossVectors(right, forward).normalize();

    const start = camera.position
      .clone()
      .addScaledVector(forward, DISTANCE)
      .addScaledVector(right, randomBetween(-700, 700))
      .addScaledVector(up, randomBetween(100, 500));

    // Mostly sideways and downwards, like a real meteor across the sky.
    const direction = right
      .clone()
      .multiplyScalar(Math.random() < 0.5 ? -1 : 1)
      .addScaledVector(up, -randomBetween(0.25, 0.6))
      .normalize();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array([1, 0.97, 0.9, 1, 1, 0.97, 0.9, 0]), 4),
    );

    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    group.add(line);
    streaks.push({ line, head: start, direction, age: 0 });
  }

  function update(delta) {
    countdown -= delta;

    if (countdown <= 0) {
      spawn();
      countdown = randomBetween(MIN_GAP, MAX_GAP);
    }

    for (let index = streaks.length - 1; index >= 0; index -= 1) {
      const streak = streaks[index];
      streak.age += delta;
      streak.head.addScaledVector(streak.direction, SPEED * delta);

      const life = streak.age / LIFETIME;
      const tail = streak.head.clone().addScaledVector(streak.direction, -TAIL * Math.min(life * 3, 1));
      const positions = streak.line.geometry.attributes.position;

      positions.setXYZ(0, streak.head.x, streak.head.y, streak.head.z);
      positions.setXYZ(1, tail.x, tail.y, tail.z);
      positions.needsUpdate = true;
      streak.line.geometry.computeBoundingSphere();
      streak.line.material.opacity = Math.sin(Math.min(life, 1) * Math.PI);

      if (life >= 1) {
        group.remove(streak.line);
        streak.line.geometry.dispose();
        streak.line.material.dispose();
        streaks.splice(index, 1);
      }
    }
  }

  return {
    group,
    update,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
