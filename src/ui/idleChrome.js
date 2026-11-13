// Fades the floating controls out after a few seconds without input, so the
// universe has the whole screen. Any movement, tap or key brings them back.
const IDLE_DELAY = 3200;
const WAKE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"];
const KEEP_AWAKE = [
  ".system-navigator:hover",
  ".music-player:hover",
  ".help:hover",
  ".system-navigator__menu.is-open",
  ".music-player__menu.is-open",
  ".help__card.is-open",
].join(", ");

export function createIdleChrome() {
  let timer = null;

  function wake() {
    document.body.classList.remove("is-idle");
    window.clearTimeout(timer);
    timer = window.setTimeout(sleep, IDLE_DELAY);
  }

  function sleep() {
    if (document.querySelector(KEEP_AWAKE)) {
      timer = window.setTimeout(sleep, IDLE_DELAY);
      return;
    }

    document.body.classList.add("is-idle");
  }

  function start() {
    for (const type of WAKE_EVENTS) {
      window.addEventListener(type, wake, { passive: true });
    }

    wake();
  }

  return {
    start,
  };
}
