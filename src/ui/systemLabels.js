import * as THREE from "three";
import { smoothRange } from "../utils/easing.js";

// Small name tags that float above each system. They fade out when the camera
// is inside a system or very far away, and clicking one flies to that system.
const LIFT = 22; // distance above the highest planet
const NEAR_FADE = [90, 200]; // fully hidden → fully visible
const FAR_FADE = [2200, 1500]; // fully hidden → fully visible

export function createSystemLabels({ zones, bodies, camera, onSelect }) {
  const layer = document.createElement("div");
  const projected = new THREE.Vector3();

  layer.className = "system-labels";
  document.querySelector("#app")?.appendChild(layer);

  const labels = zones
    .filter((zone) => !zone.isCenter)
    .map((zone) => createLabel(zone, bodies.filter((body) => body.zone.id === zone.id)))
    .filter(Boolean);

  function createLabel(zone, zoneBodies) {
    if (zoneBodies.length === 0) {
      return null;
    }

    const center = new THREE.Vector3();
    let top = -Infinity;

    for (const body of zoneBodies) {
      center.add(body.basePosition);
      top = Math.max(top, body.basePosition.y);
    }

    center.divideScalar(zoneBodies.length);

    const element = document.createElement("button");
    element.type = "button";
    element.className = "system-label";
    element.textContent = zone.name;
    element.style.setProperty("--system-color", zone.color);
    element.addEventListener("click", () => onSelect?.(zone));
    layer.appendChild(element);

    return {
      element,
      center,
      anchor: new THREE.Vector3(center.x, top + LIFT, center.z),
    };
  }

  function update() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const label of labels) {
      projected.copy(label.anchor).project(camera);

      const onScreen = projected.z < 1 && Math.abs(projected.x) < 1.15 && Math.abs(projected.y) < 1.15;

      label.distance = camera.position.distanceTo(label.center);
      label.opacity = onScreen
        ? smoothRange(label.distance, ...NEAR_FADE) * smoothRange(label.distance, ...FAR_FADE)
        : 0;
      label.x = ((projected.x + 1) / 2) * width;
      label.y = ((1 - projected.y) / 2) * height;
    }

    hideOverlaps();

    for (const label of labels) {
      label.element.style.opacity = label.opacity.toFixed(3);
      label.element.style.transform = `translate(${label.x.toFixed(1)}px, ${label.y.toFixed(1)}px) translate(-50%, -100%)`;
      label.element.classList.toggle("is-interactive", label.opacity > 0.4);
    }
  }

  // When two labels collide on screen, the one nearer the camera wins.
  function hideOverlaps() {
    const placed = [];
    const byDistance = [...labels].sort((a, b) => a.distance - b.distance);

    for (const label of byDistance) {
      if (label.opacity === 0) {
        continue;
      }

      const box = {
        left: label.x - label.element.offsetWidth / 2,
        right: label.x + label.element.offsetWidth / 2,
        top: label.y - label.element.offsetHeight,
        bottom: label.y,
      };
      const overlaps = placed.some(
        (other) =>
          box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top,
      );

      if (overlaps) {
        label.opacity = 0;
      } else {
        placed.push(box);
      }
    }
  }

  function show() {
    layer.classList.add("is-visible");
  }

  return {
    update,
    show,
  };
}
