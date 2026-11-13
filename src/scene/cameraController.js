import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { easeInOutCubic } from "../utils/easing.js";

const HOME_POSITION = new THREE.Vector3(0, 136, 720);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

export function createCameraController(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  const keys = new Set();
  const velocity = new THREE.Vector3();
  const desiredVelocity = new THREE.Vector3();
  const moveDirection = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  let homeFlight = null;

  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.panSpeed = 0.55;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.74;
  controls.minDistance = 24;
  controls.maxDistance = 2400;
  controls.target.set(0, 0, 0);

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    keys.add(key);

    if (controls.enabled && isMovementKey(key)) {
      event.preventDefault();
    }

    if (key === "h" && controls.enabled) {
      event.preventDefault();
      startHomeFlight();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  window.addEventListener("blur", () => {
    keys.clear();
    velocity.set(0, 0, 0);
    desiredVelocity.set(0, 0, 0);
  });

  function update(delta) {
    updateHomeFlight(delta);
    updateKeyboardMovement(delta);
    controls.update();
  }

  function updateKeyboardMovement(delta) {
    if (!controls.enabled || homeFlight) {
      velocity.multiplyScalar(Math.exp(-8 * delta));
      return;
    }

    moveDirection.set(0, 0, 0);
    camera.getWorldDirection(forward);
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    if (keys.has("w") || keys.has("arrowup")) {
      moveDirection.add(forward);
    }

    if (keys.has("s") || keys.has("arrowdown")) {
      moveDirection.sub(forward);
    }

    if (keys.has("d") || keys.has("arrowright")) {
      moveDirection.add(right);
    }

    if (keys.has("a") || keys.has("arrowleft")) {
      moveDirection.sub(right);
    }

    if (keys.has("e") || keys.has(" ")) {
      moveDirection.add(up);
    }

    if (keys.has("q")) {
      moveDirection.sub(up);
    }

    const speed = getMoveSpeed();

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      desiredVelocity.copy(moveDirection).multiplyScalar(speed);
    } else {
      desiredVelocity.set(0, 0, 0);
    }

    const responsiveness = desiredVelocity.lengthSq() > 0 ? 8.5 : 5.5;
    velocity.lerp(desiredVelocity, 1 - Math.exp(-responsiveness * delta));

    if (velocity.lengthSq() < 0.0001) {
      return;
    }

    const movement = velocity.clone().multiplyScalar(delta);
    camera.position.add(movement);
    controls.target.add(movement);
    keepInsideGalaxy();
  }

  function getMoveSpeed() {
    const baseSpeed = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.42, 105, 380);

    if (keys.has("shift")) {
      return baseSpeed * 2.25;
    }

    if (keys.has("alt")) {
      return baseSpeed * 0.36;
    }

    return baseSpeed;
  }

  function startHomeFlight() {
    homeFlight = {
      fromCamera: camera.position.clone(),
      fromTarget: controls.target.clone(),
      elapsed: 0,
      duration: 1.45,
    };
    velocity.set(0, 0, 0);
  }

  function updateHomeFlight(delta) {
    if (!homeFlight) {
      return;
    }

    homeFlight.elapsed += delta;
    const progress = THREE.MathUtils.clamp(homeFlight.elapsed / homeFlight.duration, 0, 1);
    const eased = easeInOutCubic(progress);

    camera.position.lerpVectors(homeFlight.fromCamera, HOME_POSITION, eased);
    controls.target.lerpVectors(homeFlight.fromTarget, HOME_TARGET, eased);

    if (progress >= 1) {
      homeFlight = null;
    }
  }

  function keepInsideGalaxy() {
    const maxDistance = 2600;

    if (camera.position.length() <= maxDistance) {
      return;
    }

    const correction = camera.position.clone().setLength(maxDistance).sub(camera.position);
    camera.position.add(correction);
    controls.target.add(correction);
    velocity.multiplyScalar(0.35);
  }

  return {
    controls,
    update,
    goHome: startHomeFlight,
  };
}


function isMovementKey(key) {
  return ["w", "a", "s", "d", "q", "e", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
    key,
  );
}
