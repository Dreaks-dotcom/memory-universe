import { t } from "../content/i18n.js";

// Top-left "where am I" pill: the current system's color, name and progress.
// It opens a menu with "back to center", every system, and resetting progress.
export function createSystemNavigator({
  zones = [],
  memories = [],
  getVisitedIds = () => new Set(),
  onSelect,
  onHome,
  onResetVisited,
} = {}) {
  const root = document.querySelector("#system-navigator");
  const toggle = document.querySelector("#system-menu-toggle");
  const title = document.querySelector("#system-title");
  const progress = document.querySelector("#system-progress");
  const menu = document.querySelector("#system-menu");
  const centerZone = zones.find((zone) => zone.isCenter) || zones[0];

  let activeZoneId = centerZone?.id || "";
  let confirmingReset = false;

  render();

  toggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!menu?.classList.contains("is-open"));
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

  function show() {
    root?.classList.add("is-visible");
  }

  function setActive(zoneId) {
    activeZoneId = zoneId;
    render();
  }

  function refresh() {
    render();
  }

  function setOpen(open) {
    if (!open) {
      confirmingReset = false;
      renderMenu();
    }

    menu?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  }

  function render() {
    const zone = zones.find((item) => item.id === activeZoneId) ?? centerZone;

    if (title) {
      title.textContent = zone?.name ?? "";
    }

    if (progress) {
      progress.textContent = zone ? getProgressLabel(zone) : "";
    }

    root?.style.setProperty("--system-color", zone?.color ?? "var(--accent)");
    renderMenu();
  }

  function renderMenu() {
    if (!menu) {
      return;
    }

    menu.replaceChildren(
      createItem({
        label: centerZone?.name ?? t("nav.home"),
        detail: t("nav.home"),
        color: centerZone?.color,
        active: activeZoneId === centerZone?.id,
        onClick: () => {
          if (onHome?.() !== false) {
            setActive(centerZone.id);
            setOpen(false);
          }
        },
      }),
      createDivider(),
      ...zones
        .filter((zone) => !zone.isCenter)
        .map((zone) =>
          createItem({
            label: zone.name,
            detail: getProgressLabel(zone),
            color: zone.color,
            active: zone.id === activeZoneId,
            onClick: () => {
              if (onSelect?.(zone) !== false) {
                setActive(zone.id);
                setOpen(false);
              }
            },
          }),
        ),
      createDivider(),
      createResetRow(),
    );
  }

  function createItem({ label, detail, color, active, onClick }) {
    const button = document.createElement("button");
    const name = document.createElement("span");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "system-navigator__item";
    button.classList.toggle("is-active", Boolean(active));
    button.style.setProperty("--item-color", color ?? "var(--accent)");
    name.textContent = label;
    meta.className = "system-navigator__item-detail";
    meta.textContent = detail;
    button.append(name, meta);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });

    return button;
  }

  function createDivider() {
    const divider = document.createElement("div");
    divider.className = "system-navigator__divider";

    return divider;
  }

  // "Reset visited" turns into an inline "are you sure?" before doing anything.
  function createResetRow() {
    const row = document.createElement("div");
    row.className = "system-navigator__reset";

    if (!confirmingReset) {
      row.append(
        createTextButton(t("nav.reset"), () => {
          confirmingReset = true;
          renderMenu();
        }),
      );

      return row;
    }

    const question = document.createElement("span");
    question.textContent = t("nav.resetQuestion");
    row.append(
      question,
      createTextButton(t("nav.no"), () => {
        confirmingReset = false;
        renderMenu();
      }),
      createTextButton(
        t("nav.yes"),
        () => {
          onResetVisited?.();
          confirmingReset = false;
          render();
        },
        true,
      ),
    );

    return row;
  }

  function createTextButton(label, onClick, emphasized = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "system-navigator__text-button";
    button.classList.toggle("is-emphasized", emphasized);
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });

    return button;
  }

  function getProgressLabel(zone) {
    const visitedIds = getVisitedIds();
    const zoneMemories = memories.filter(
      (memory) => memory.kind === "memory" && (zone.isCenter || memory.zoneId === zone.id),
    );
    const visitedCount = zoneMemories.filter((memory) => visitedIds.has(memory.id)).length;

    return `${visitedCount}/${zoneMemories.length}`;
  }

  return {
    show,
    setActive,
    refresh,
  };
}
