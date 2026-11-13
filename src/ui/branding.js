import { t, translatePage } from "../content/i18n.js";

// Fills the interface texts and the personal texts (names, intro lines) from the universe config.
export function applyBranding(universe) {
  const centerZone = universe.zones.find((zone) => zone.isCenter);

  translatePage();
  document.title = universe.title;
  document.querySelector("#app")?.setAttribute("aria-label", universe.title);

  setText(".intro__eyebrow", universe.intro.eyebrow);
  setText("#intro-title", universe.title);
  setText(".intro__subtitle", universe.intro.subtitle);
  setText("#enter-button", universe.intro.button);
  setText("#cinematic-line", universe.intro.line);
  setText("#memory-placeholder span", universe.title);
  setText("#system-title", centerZone?.name);
  setText("#zone-panel h2", centerZone?.name);
}

export function showLoadError(error, folder) {
  console.error(error);
  translatePage();
  setText("#intro-title", t("error.title"));
  setText(
    ".intro__subtitle",
    t("error.check", { folder, message: error?.message ?? t("error.unknown") }),
  );
  document.querySelector("#enter-button")?.setAttribute("hidden", "");
  document.querySelector("#intro")?.classList.add("is-ready");
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value ?? "";
  }
}
