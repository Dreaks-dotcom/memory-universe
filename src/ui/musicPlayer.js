import { t } from "../content/i18n.js";

const VOLUME = 0.42;
const DUCKED_VOLUME = 0.16; // while a card is open, so the moment feels quieter
const FADE_IN = 2400;
const DUCK_FADE = 800;

export function createMusicPlayer({ playlist = [] } = {}) {
  const root = document.querySelector("#music-player");
  const toggle = document.querySelector("#music-toggle");
  const menuToggle = document.querySelector("#music-menu-toggle");
  const title = document.querySelector("#music-title");
  const menu = document.querySelector("#music-menu");
  const audio = new Audio();

  let currentIndex = 0;
  let ready = playlist.length > 0;
  let playing = false;
  let ducked = false;
  let fadeFrame = null;

  audio.loop = false;
  audio.volume = VOLUME;

  renderMenu();
  loadTrack(0);

  toggle?.addEventListener("click", () => {
    if (playing) {
      pause();
    } else {
      play();
    }
  });

  menuToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!menu?.classList.contains("is-open"));
  });

  // Pointerdown (not click) so it still fires when another control stops click propagation.
  window.addEventListener("pointerdown", (event) => {
    if (!root?.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  function setMenuOpen(open) {
    menu?.classList.toggle("is-open", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
  }

  audio.addEventListener("ended", () => {
    if (playlist.length === 0) {
      return;
    }

    loadTrack((currentIndex + 1) % playlist.length);
    play();
  });

  audio.addEventListener("error", () => {
    ready = false;
    playing = false;
    root?.classList.remove("is-playing");
    setTitle(t("music.missing"));
  });

  // With no songs configured the player stays hidden.
  function show() {
    if (playlist.length > 0) {
      root?.classList.add("is-visible");
    }
  }

  async function play() {
    if (playlist.length === 0) {
      return;
    }

    if (!ready) {
      show();
      setTitle(t("music.missing"));
      return;
    }

    show();

    try {
      audio.volume = 0;
      await audio.play();
      fadeTo(targetVolume(), FADE_IN);
      playing = true;
      root?.classList.add("is-playing");
      toggle?.setAttribute("aria-label", t("music.pause"));
    } catch {
      playing = false;
      root?.classList.remove("is-playing");
      setTitle(t("music.tapToStart"));
    }
  }

  // Lowers the music while a memory is open; restores it afterwards.
  function setDucked(value) {
    ducked = value;

    if (playing) {
      fadeTo(targetVolume(), DUCK_FADE);
    }
  }

  function targetVolume() {
    return ducked ? DUCKED_VOLUME : VOLUME;
  }

  function fadeTo(volume, duration) {
    const from = audio.volume;
    const start = performance.now();

    window.cancelAnimationFrame(fadeFrame);

    function step(now) {
      // Animation frames can be stamped slightly before `start`, so keep progress within 0–1.
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);

      audio.volume = Math.min(Math.max(from + (volume - from) * progress, 0), 1);

      if (progress < 1) {
        fadeFrame = window.requestAnimationFrame(step);
      }
    }

    fadeFrame = window.requestAnimationFrame(step);
  }

  function pause() {
    audio.pause();
    playing = false;
    root?.classList.remove("is-playing");
    toggle?.setAttribute("aria-label", t("music.play"));
  }

  function loadTrack(index) {
    if (playlist.length === 0) {
      ready = false;
      setTitle(t("music.empty"));
      return;
    }

    currentIndex = index;
    ready = true;
    audio.src = playlist[index].src;
    setTitle(playlist[index].title);
    markActiveTrack();
  }

  function renderMenu() {
    if (!menu) {
      return;
    }

    menu.replaceChildren();

    if (playlist.length === 0) {
      const empty = document.createElement("div");
      empty.className = "music-player__track";
      empty.textContent = t("music.noSongs");
      menu.appendChild(empty);
      return;
    }

    playlist.forEach((track, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "music-player__track";
      button.textContent = track.title;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const wasPlaying = playing;
        loadTrack(index);
        setMenuOpen(false);

        if (wasPlaying) {
          play();
        }
      });
      menu.appendChild(button);
    });

    markActiveTrack();
  }

  function markActiveTrack() {
    menu?.querySelectorAll(".music-player__track").forEach((item, index) => {
      item.classList.toggle("is-active", index === currentIndex);
    });
  }

  function setTitle(value) {
    if (title) {
      title.textContent = value;
    }
  }

  return {
    show,
    play,
    pause,
    setDucked,
  };
}
