import { getUniverseFolder, loadUniverse } from "./content/loadUniverse.js";
import { preloadPhotos } from "./core/photoPreloader.js";
import { applyBranding, showLoadError } from "./ui/branding.js";
import { createLoader } from "./ui/loader.js";
import { startUniverse } from "./app.js";

try {
  const universe = await loadUniverse();
  const loader = createLoader();

  applyBranding(universe);

  // All photos load behind the loading screen, so nothing pops in afterwards.
  const photos = await preloadPhotos(universe.memories, { onProgress: loader.setProgress });

  startUniverse(universe, { photos });
} catch (error) {
  showLoadError(error, getUniverseFolder());
}
