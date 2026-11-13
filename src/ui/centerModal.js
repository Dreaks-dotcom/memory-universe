export function createCenterModal({ onClose } = {}) {
  const modal = document.querySelector("#center-modal");
  const message = document.querySelector(".center-message");
  const closeButton = document.querySelector("#center-close");
  const backdrop = document.querySelector(".center-modal__backdrop");
  const title = document.querySelector("#center-title");
  const text = document.querySelector("#center-text");

  let openState = false;

  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openState) {
      close();
    }
  });

  function open(memory) {
    if (!modal) {
      return;
    }

    openState = true;

    if (title) {
      title.textContent = memory.title;
    }

    if (text) {
      text.textContent = memory.text;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => message?.focus(), 80);
  }

  function close() {
    if (!modal || !openState) {
      return;
    }

    openState = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    onClose?.();
  }

  function isOpen() {
    return openState;
  }

  return {
    open,
    close,
    isOpen,
  };
}
