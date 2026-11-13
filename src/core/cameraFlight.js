import * as THREE from "three";
import { easeInOutQuint } from "../utils/easing.js";

// Smooth, slightly arcing camera flights between two views.
export function createCameraFlight(camera, controls) {
  const arc = new THREE.Vector3();
  let flight = null;

  function start({ toCamera, toTarget, duration, arcHeight = 0, onComplete }) {
    controls.enabled = false;
    flight = {
      fromCamera: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toCamera,
      toTarget,
      duration,
      arcHeight,
      elapsed: 0,
      onComplete,
    };
  }

  function update(delta) {
    if (!flight) {
      return;
    }

    flight.elapsed += delta;
    const progress = THREE.MathUtils.clamp(flight.elapsed / flight.duration, 0, 1);
    const eased = easeInOutQuint(progress);

    camera.position.lerpVectors(flight.fromCamera, flight.toCamera, eased);
    arc.set(0, Math.sin(progress * Math.PI) * flight.arcHeight, 0);
    camera.position.add(arc);
    controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
    camera.lookAt(controls.target);

    if (progress >= 1) {
      const complete = flight.onComplete;
      flight = null;
      complete?.();
    }
  }

  // Longer trips take longer, within [min, max] seconds.
  function durationTo(toCamera, min, max) {
    return THREE.MathUtils.clamp(camera.position.distanceTo(toCamera) / 520, min, max);
  }

  function isActive() {
    return flight !== null;
  }

  return {
    start,
    update,
    durationTo,
    isActive,
  };
}
