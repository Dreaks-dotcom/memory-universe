import * as THREE from "three";
import { easeInOutCubic } from "../utils/easing.js";

// While the intro screen is open the camera drifts slowly around the universe,
// so it is alive behind the title. "Enter" flies from wherever it is to the home view.
const IDLE_RADIUS = 1380;
const IDLE_HEIGHT = 300;
const IDLE_SPEED = 0.035; // radians per second
const IDLE_TARGET = new THREE.Vector3(0, 20, 0); // keeps the galaxy in the middle, between title and button
const FLIGHT_END = new THREE.Vector3(0, 136, 720);
const TARGET_END = new THREE.Vector3(0, 0, 0);
const FLIGHT_DURATION = 5.1;
const CINEMATIC_LINE_DURATION = 2700;

export function setupIntro({ camera, controls, onComplete }) {
  const intro = document.querySelector("#intro");
  const button = document.querySelector("#enter-button");
  const cinematicLine = document.querySelector("#cinematic-line");
  const skipIntro = new URLSearchParams(window.location.search).has("skipIntro");
  const flightStart = new THREE.Vector3();
  const targetStart = new THREE.Vector3();

  let state = "idle"; // idle → flying → done
  let idleAngle = 0.35;
  let elapsed = 0;

  controls.enabled = false;
  placeIdleCamera();

  if (skipIntro) {
    finish();
    camera.position.copy(FLIGHT_END);
    controls.target.copy(TARGET_END);
    intro?.classList.add("is-hidden");
  } else {
    intro?.classList.add("is-ready");
  }

  button?.addEventListener("click", () => {
    if (state !== "idle") {
      return;
    }

    state = "flying";
    flightStart.copy(camera.position);
    targetStart.copy(controls.target);
    intro?.classList.add("is-hidden");
    cinematicLine?.classList.add("is-visible");

    window.setTimeout(() => {
      cinematicLine?.classList.remove("is-visible");
    }, CINEMATIC_LINE_DURATION);
  });

  function update(delta) {
    if (state === "idle") {
      idleAngle += delta * IDLE_SPEED;
      placeIdleCamera();
      return;
    }

    if (state !== "flying") {
      return;
    }

    elapsed += delta;
    const t = THREE.MathUtils.clamp(elapsed / FLIGHT_DURATION, 0, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(flightStart, FLIGHT_END, eased);
    controls.target.lerpVectors(targetStart, TARGET_END, eased);

    if (t >= 1) {
      finish();
    }
  }

  function placeIdleCamera() {
    camera.position.set(
      Math.sin(idleAngle) * IDLE_RADIUS,
      IDLE_HEIGHT,
      Math.cos(idleAngle) * IDLE_RADIUS,
    );
    controls.target.copy(IDLE_TARGET);
  }

  function finish() {
    state = "done";
    controls.enabled = true;
    onComplete?.();
  }

  return {
    update,
  };
}
