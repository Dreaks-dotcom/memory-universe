import { t } from "../content/i18n.js";

// The loading screen: a softly breathing star with a thin progress line that
// fills as photos arrive. It disappears with the intro's "ready" state.
export function createLoader() {
  const root = document.querySelector("#loader");
  const label = document.querySelector("#loader-label");

  function setProgress(done, total) {
    const share = total === 0 ? 1 : done / total;
    const percent = Math.round(share * 100);

    root?.style.setProperty("--loaded", share.toFixed(3));
    root?.setAttribute("aria-valuenow", String(percent));

    if (label) {
      label.textContent = `${t("loading.label")} · ${percent}%`;
    }
  }

  return {
    setProgress,
  };
}
