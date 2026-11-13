// Detects horizontal and downward swipes on an element (touch and pen only).
// A swipe swallows the click that some browsers fire right after it, so the
// gesture never also counts as a tap.
const MIN_DISTANCE = 60; // px
const MAX_DURATION = 700; // ms

export function onSwipe(element, { left, right, down } = {}) {
  if (!element) {
    return;
  }

  let start = null;

  element.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }

    start = { x: event.clientX, y: event.clientY, time: performance.now() };
  });

  element.addEventListener("pointerup", (event) => {
    if (!start) {
      return;
    }

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const quick = performance.now() - start.time < MAX_DURATION;
    let handler = null;

    start = null;

    if (!quick) {
      return;
    }

    if (Math.abs(dx) > MIN_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      handler = dx < 0 ? left : right;
    } else if (dy > MIN_DISTANCE && dy > Math.abs(dx)) {
      handler = down;
    }

    if (handler) {
      swallowNextClick(element);
      handler();
    }
  });

  element.addEventListener("pointercancel", () => {
    start = null;
  });
}

function swallowNextClick(element) {
  const block = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  element.addEventListener("click", block, { capture: true, once: true });
  window.setTimeout(() => element.removeEventListener("click", block, { capture: true }), 400);
}
