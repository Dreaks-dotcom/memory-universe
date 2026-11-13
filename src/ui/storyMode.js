import { t } from "../content/i18n.js";

// "Play our story": visits every memory in config order on its own. The camera flies
// to each photo, the card opens, its note is typed out, then it moves on. At the end
// it flies to the center star. Any close or "Stop" ends it.
const LOOK_AT_PHOTO = 2200; // ms before the card flips to its note
const READ_NOTE = 2600; // ms to read a note after it is typed
const PHOTO_ONLY = 3600; // ms for a memory without a note

export function createStoryMode({ memories, showMemory, revealNote, showCenter, stopViewing, canStart }) {
  const root = document.querySelector("#story");
  const button = document.querySelector("#story-toggle");
  const label = document.querySelector("#story-label");
  const progress = document.querySelector("#story-progress");
  const steps = memories.filter((memory) => memory.kind === "memory");

  let playing = false;
  let run = 0;

  button?.addEventListener("click", (event) => {
    event.stopPropagation();

    if (playing) {
      stop();
    } else {
      play();
    }
  });

  render();

  async function play() {
    if (playing || steps.length === 0 || !canStart()) {
      return;
    }

    const id = (run += 1);
    const isCurrent = () => id === run;

    playing = true;

    for (const [index, memory] of steps.entries()) {
      render(index + 1);
      await showMemory(memory, isCurrent);

      if (!isCurrent()) {
        return;
      }

      if (memory.text) {
        await wait(LOOK_AT_PHOTO);

        if (!isCurrent()) {
          return;
        }

        await revealNote();
        await wait(READ_NOTE);
      } else {
        await wait(PHOTO_ONLY);
      }

      if (!isCurrent()) {
        return;
      }
    }

    await showCenter(isCurrent);
    finish();
  }

  function stop() {
    if (!playing) {
      return;
    }

    run += 1;
    finish();
    stopViewing();
  }

  function finish() {
    playing = false;
    render();
  }

  function render(step = 0) {
    root?.classList.toggle("is-playing", playing);
    root?.classList.toggle("is-hidden", steps.length === 0);
    setText(label, playing ? t("story.stop") : t("story.play"));
    setText(progress, playing && step ? `${step} / ${steps.length}` : "");
    root?.style.setProperty("--story-progress", playing && step ? String(step / steps.length) : "0");
  }

  function show() {
    root?.classList.add("is-visible");
  }

  return {
    show,
    stop,
    isPlaying: () => playing,
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}
