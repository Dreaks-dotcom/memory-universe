import { canMorph, morphFromOrigin, morphToOrigin } from "./cardMorph.js";
import { onSwipe } from "./swipe.js";

// `getOrigin(memory)` returns where that memory's photo sits on screen ({ x, y, size }),
// so the card can grow out of it and shrink back into it.
export function createMemoryModal({ memories = [], onClose, onNavigate, getOrigin } = {}) {
  const modal = document.querySelector("#memory-modal");
  const scene = document.querySelector(".memory-modal__scene");
  const card = document.querySelector("#memory-card");
  const closeButton = document.querySelector("#memory-close");
  const prevButton = document.querySelector("#memory-prev");
  const nextButton = document.querySelector("#memory-next");
  const backdrop = document.querySelector(".memory-modal__backdrop");
  const image = document.querySelector("#memory-image");
  const photo = document.querySelector(".memory-card__photo");
  const placeholder = document.querySelector("#memory-placeholder");
  const title = document.querySelector("#memory-title");
  const text = document.querySelector("#memory-text");
  const position = document.querySelector("#memory-position");
  const details = document.querySelector("#memory-details");
  const gallery = memories.filter((memory) => memory.kind === "memory");

  let openState = false;
  let closing = false;
  let imageLoadToken = 0;
  let currentMemory = null;
  let typingTimer = null;
  let typingToken = 0;
  let typing = Promise.resolve();
  let finishTyping = null;

  closeButton?.addEventListener("click", () => close());
  backdrop?.addEventListener("click", () => close());
  prevButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    showRelativeMemory(-1);
  });
  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    showRelativeMemory(1);
  });
  card?.addEventListener("click", flip);
  // On touch screens: swipe left/right for the next/previous memory, swipe down to close.
  onSwipe(scene, {
    left: () => showRelativeMemory(1),
    right: () => showRelativeMemory(-1),
    down: () => close(),
  });
  window.addEventListener("keydown", (event) => {
    if (!openState) {
      return;
    }

    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showRelativeMemory(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showRelativeMemory(1);
    }
  });

  function open(memory) {
    if (!modal || !card) {
      return;
    }

    const origin = getOrigin?.(memory);

    openState = true;
    renderMemory(memory);

    scene?.classList.toggle("is-morphing", canMorph(origin));
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => scene?.focus(), 80);

    if (scene && canMorph(origin)) {
      morphFromOrigin(scene, origin).catch(() => {});
    }
  }

  async function close() {
    if (!modal || !openState) {
      return;
    }

    const origin = currentMemory ? getOrigin?.(currentMemory) : null;

    openState = false;
    closing = true;
    currentMemory = null;
    stopTyping();
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (scene && canMorph(origin)) {
      scene.classList.add("is-morphing");
      await morphToOrigin(scene, origin).catch(() => {});
    }

    closing = false;
    onClose?.();
  }

  function flip(event) {
    event?.stopPropagation();

    if (!card) {
      return;
    }

    const willShowBack = !card.classList.contains("is-flipped");
    card.classList.toggle("is-flipped");

    if (willShowBack) {
      typing = startTyping(currentMemory?.text || "");
    } else {
      stopTyping();
      setTextContent(text, currentMemory?.text || "");
    }
  }

  function isOpen() {
    return openState || closing;
  }

  // Flips the card to its note (if it isn't already) and resolves once the note is fully typed.
  function revealNote() {
    if (openState && card && !card.classList.contains("is-flipped")) {
      flip();
    }

    return typing;
  }

  return {
    open,
    close,
    closeForTravel,
    isOpen,
    revealNote,
  };

  function renderMemory(memory) {
    currentMemory = memory;
    card?.classList.remove("is-flipped");
    setTextContent(title, memory.title);
    stopTyping();
    setTextContent(text, memory.text);
    setTextContent(position, `${memory.title} · ${memory.number} / ${memory.total}`);
    setTextContent(details, [memory.date, memory.place].filter(Boolean).join(" · "));
    setImage(memory);
    updateStepButtons(memory);
  }

  function showRelativeMemory(direction) {
    if (!currentMemory) {
      return;
    }

    const siblings = getSiblingMemories(currentMemory);

    if (siblings.length <= 1) {
      return;
    }

    const currentIndex = siblings.findIndex((memory) => memory.id === currentMemory.id);
    const nextIndex = (currentIndex + direction + siblings.length) % siblings.length;
    const nextMemory = siblings[nextIndex];
    const accepted = onNavigate?.(nextMemory);

    if (accepted === false) {
      return;
    }

    closeForTravel();
  }

  function closeForTravel() {
    if (!modal || !openState) {
      return;
    }

    openState = false;
    currentMemory = null;
    stopTyping();
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function updateStepButtons(memory) {
    const siblings = getSiblingMemories(memory);
    const disabled = siblings.length <= 1;

    if (prevButton) {
      prevButton.disabled = disabled;
    }

    if (nextButton) {
      nextButton.disabled = disabled;
    }
  }

  function getSiblingMemories(memory) {
    return gallery.filter((item) => item.zoneId === memory.zoneId);
  }

  // Types the note out letter by letter; resolves when finished or interrupted.
  function startTyping(value) {
    stopTyping();

    const message = value || "";

    if (!text) {
      return Promise.resolve();
    }

    if (!message.trim()) {
      text.textContent = "";
      text.classList.remove("is-typing");
      return Promise.resolve();
    }

    return new Promise((resolve) => typeMessage(message, resolve));
  }

  function typeMessage(message, resolve) {
    finishTyping = resolve;

    const token = ++typingToken;
    const characters = Array.from(message);
    let index = 0;

    text.textContent = "";
    text.classList.add("is-typing");

    function typeNext() {
      if (token !== typingToken) {
        resolve();
        return;
      }

      text.textContent = characters.slice(0, index).join("");

      if (index >= characters.length) {
        typingTimer = null;
        text.classList.remove("is-typing");
        resolve();
        return;
      }

      const currentCharacter = characters[index];
      index += 1;
      typingTimer = window.setTimeout(typeNext, getTypeDelay(currentCharacter));
    }

    typeNext();
  }

  function stopTyping() {
    typingToken += 1;
    text?.classList.remove("is-typing");
    finishTyping?.();
    finishTyping = null;

    if (typingTimer) {
      window.clearTimeout(typingTimer);
      typingTimer = null;
    }
  }

  function setImage(memory) {
    if (!image || !placeholder) {
      return;
    }

    const token = ++imageLoadToken;
    const candidates = getImageCandidates(memory);
    let candidateIndex = 0;

    image.classList.remove("is-loaded");
    image.hidden = true;
    placeholder.hidden = false;
    image.alt = memory.title || "";
    setImageOrientation(null);

    if (!candidates.length) {
      image.removeAttribute("src");
      return;
    }

    image.onload = () => {
      if (token !== imageLoadToken) {
        return;
      }

      image.hidden = false;
      placeholder.hidden = true;
      setImageOrientation(getImageOrientation(image));
      image.classList.add("is-loaded");
    };

    image.onerror = () => {
      if (token !== imageLoadToken) {
        return;
      }

      image.hidden = true;
      placeholder.hidden = false;
      image.classList.remove("is-loaded");
      setImageOrientation(null);
      loadNextImage();
    };

    loadNextImage();

    function loadNextImage() {
      const nextImage = candidates[candidateIndex];
      candidateIndex += 1;

      if (!nextImage) {
        image.removeAttribute("src");
        return;
      }

      image.src = nextImage;
    }
  }

  function setImageOrientation(orientation) {
    const targetElements = [scene, card, photo].filter(Boolean);

    for (const element of targetElements) {
      element.classList.remove("is-landscape", "is-portrait");

      if (orientation) {
        element.classList.add(`is-${orientation}`);
      }
    }
  }
}

function setTextContent(element, value) {
  if (element) {
    element.textContent = value || "";
  }
}

function getImageCandidates(memory) {
  if (Array.isArray(memory?.imageCandidates)) {
    return memory.imageCandidates.filter(Boolean);
  }

  return memory?.image ? [memory.image] : [];
}

function getImageOrientation(image) {
  if (!image?.naturalWidth || !image?.naturalHeight) {
    return null;
  }

  return image.naturalWidth > image.naturalHeight ? "landscape" : "portrait";
}

function getTypeDelay(character) {
  if (character === "\n") {
    return 210;
  }

  if ([",", ".", "!", "?", ";", ":"].includes(character)) {
    return 135;
  }

  if (character === " ") {
    return 42;
  }

  return 58;
}
