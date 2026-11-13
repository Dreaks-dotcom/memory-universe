// Loads a universe folder (config + photos + music) and turns it into the
// zones and memories the scene works with.
//
// The folder defaults to "universe". Another folder can be opened with
// ?universe=<folder-name>, e.g. ?universe=my-universe for a private copy.

import { setLanguage, t } from "./i18n.js";
import { pickSystemColors } from "./systemColors.js";

const DEFAULT_FOLDER = "universe";
const FOLDER_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

const SYSTEM_DEFAULTS = {
  planetScale: [1.5, 2.6],
};

export function getUniverseFolder() {
  const requested = new URLSearchParams(window.location.search).get("universe");

  return requested && FOLDER_PATTERN.test(requested) ? requested : DEFAULT_FOLDER;
}

export async function loadUniverse(folder = getUniverseFolder()) {
  const module = await import(`../../${folder}/config.js`);

  return buildUniverse(module.default ?? {}, folder);
}

function buildUniverse(config, folder) {
  setLanguage(config.language);

  const center = { name: t("defaults.centerName"), color: "#ffe3a1", message: "", ...config.center };
  const configSystems = config.systems ?? [];
  // Systems without their own "color" get random pale colors that keep apart from each other.
  const uncolored = configSystems.filter((system) => !system.color);
  const autoColors = new Map(
    pickSystemColors(uncolored.map((system) => system.id)).map((color, index) => [uncolored[index], color]),
  );
  const systems = configSystems.map((system, index) => normalizeSystem(system, index, autoColors.get(system)));
  const centerZone = {
    id: "center",
    name: center.name,
    color: center.color,
    isCenter: true,
    center: [0, 0, 0],
    planetScale: [9, 9],
  };
  const zones = [...systems.map(({ entries, ...zone }) => zone), centerZone];
  const memories = [
    ...systems.flatMap((system) => buildSystemMemories(system, folder)),
    {
      id: "center",
      zoneId: centerZone.id,
      title: center.name,
      text: center.message,
      number: 1,
      total: 1,
      kind: "center",
      imageCandidates: [],
    },
  ];
  const title = config.title ?? t("defaults.title");

  return {
    folder,
    title,
    intro: {
      eyebrow: "",
      subtitle: "",
      button: t("defaults.enter"),
      line: "",
      ...config.intro,
    },
    zones,
    memories,
    playlist: (config.music ?? []).map((track) => ({
      title: track.title ?? track.file,
      src: `${folder}/music/${encodeURIComponent(track.file)}`,
    })),
    storageKey: config.storageKey ?? `memory-universe:${folder}:visited-memories`,
  };
}

function normalizeSystem(system, index, autoColor) {
  if (!system.id || !FOLDER_PATTERN.test(system.id)) {
    throw new Error(t("error.systemId", { number: index + 1 }));
  }

  return {
    ...SYSTEM_DEFAULTS,
    ...system,
    name: system.name ?? system.id,
    color: system.color ?? autoColor,
    center: system.position ?? getAutoPosition(index),
    entries: (system.memories ?? []).map(normalizeEntry),
  };
}

function normalizeEntry(entry) {
  return typeof entry === "string" ? { photo: entry, text: "" } : { text: "", ...entry };
}

function buildSystemMemories(system, folder) {
  return system.entries.map((entry, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      id: `${system.id}-${number}`,
      zoneId: system.id,
      title: system.name,
      text: (entry.text ?? "").trim(),
      date: entry.date ?? "",
      place: entry.place ?? "",
      number: index + 1,
      total: system.entries.length,
      kind: "memory",
      imageCandidates: getImageCandidates(`${folder}/photos/${system.id}`, entry.photo),
    };
  });
}

// "01.jpg" → that exact file. "01" → try 01.jpg, 01.jpeg, 01.png, …
function getImageCandidates(directory, photo) {
  if (!photo) {
    return [];
  }

  const path = `${directory}/${photo.split("/").map(encodeURIComponent).join("/")}`;

  return /\.[a-z0-9]+$/i.test(photo)
    ? [path]
    : IMAGE_EXTENSIONS.map((extension) => `${path}.${extension}`);
}

// Places systems without an explicit position on a sunflower spiral around the
// center, which stays evenly spaced for any number of systems.
function getAutoPosition(index) {
  const angle = index * 2.399963 + 0.6;
  const radius = 280 + 80 * Math.sqrt(index);
  const height = Math.sin(index * 1.7) * 90;

  return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
}
