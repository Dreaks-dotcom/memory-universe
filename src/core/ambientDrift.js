// When nobody has touched anything for a while, the camera starts circling slowly
// around what it is looking at, like a living screensaver. Any input stops it.
const IDLE_AFTER = 25000; // ms without input
const SPEED = 0.045; // radians per second at full speed
const EASE_IN = 4; // seconds to reach full speed
const WAKE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"];

export function createAmbientDrift({ camera, controls, canDrift }) {
  let lastInput = performance.now();
  let drifting = 0; // seconds spent drifting, for the ease-in

  for (const type of WAKE_EVENTS) {
    window.addEventListener(
      type,
      () => {
        lastInput = performance.now();
        drifting = 0;
      },
      { passive: true },
    );
  }

  function update(delta) {
    if (performance.now() - lastInput < IDLE_AFTER || !canDrift()) {
      drifting = 0;
      return;
    }

    drifting += delta;

    const angle = SPEED * Math.min(drifting / EASE_IN, 1) * delta;
    const offset = camera.position.clone().sub(controls.target);

    offset.applyAxisAngle(camera.up, angle);
    camera.position.copy(controls.target).add(offset);
  }

  return {
    update,
  };
}
