import { t } from "../content/i18n.js";

// Bottom-right "?" button with a small card explaining the controls.
// Touch screens get gestures, everything else gets mouse and keyboard.
const MOUSE_AND_KEYBOARD = [
  ["help.drag", "help.look"],
  ["help.scroll", "help.zoom"],
  ["help.clickPhoto", "help.open"],
  ["help.clickCard", "help.flip"],
  ["W A S D", "help.fly"],
  ["Q / E", "help.upDown"],
  ["Shift", "help.faster"],
  ["H", "help.home"],
  ["← →", "help.nextPrev"],
  ["Esc", "help.close"],
];

const TOUCH = [
  ["help.drag", "help.look"],
  ["help.pinch", "help.zoom"],
  ["help.tapPhoto", "help.open"],
  ["help.tapCard", "help.flip"],
  ["‹ ›", "help.nextPrev"],
];

export function createHelpCard() {
  const root = document.querySelector("#help");
  const toggle = document.querySelector("#help-toggle");
  const card = document.querySelector("#help-card");
  const list = document.querySelector("#help-list");
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  renderList(isTouch ? TOUCH : MOUSE_AND_KEYBOARD);

  toggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!card?.classList.contains("is-open"));
  });

  // Pointerdown (not click) so it still fires when another control stops click propagation.
  window.addEventListener("pointerdown", (event) => {
    if (!root?.contains(event.target)) {
      setOpen(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  function renderList(rows) {
    list?.replaceChildren(
      ...rows.flatMap(([input, action]) => {
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        const key = document.createElement("kbd");

        key.textContent = input.startsWith("help.") ? t(input) : input;
        term.append(key);
        description.textContent = t(action);

        return [term, description];
      }),
    );
  }

  function setOpen(open) {
    card?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  }

  function show() {
    root?.classList.add("is-visible");
  }

  return {
    show,
  };
}
