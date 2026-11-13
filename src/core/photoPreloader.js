import { loadFirstImage } from "../utils/images.js";

// Loads every memory photo before the universe opens, so photo moons are ready
// and cards open instantly. A few photos load at a time to stay gentle on phones.
// Missing photos are skipped. If it takes too long, the universe opens anyway and
// the remaining photos keep loading on demand.
const PARALLEL = 6;
const TIMEOUT = 30000; // ms

export function preloadPhotos(memories, { onProgress } = {}) {
  const items = memories.filter((memory) => memory.kind === "memory" && memory.imageCandidates.length > 0);
  const photos = new Map();
  let finished = 0;
  let nextIndex = 0;

  onProgress?.(0, items.length);

  const everything = new Promise((resolve) => {
    if (items.length === 0) {
      resolve();
      return;
    }

    function loadNext() {
      const memory = items[nextIndex];
      nextIndex += 1;

      if (!memory) {
        return;
      }

      loadFirstImage(memory.imageCandidates).then((image) => {
        if (image) {
          photos.set(memory.id, image);
        }

        finished += 1;
        onProgress?.(finished, items.length);

        if (finished === items.length) {
          resolve();
        } else {
          loadNext();
        }
      });
    }

    for (let slot = 0; slot < Math.min(PARALLEL, items.length); slot += 1) {
      loadNext();
    }
  });

  const timeout = new Promise((resolve) => window.setTimeout(resolve, TIMEOUT));

  return Promise.race([everything, timeout]).then(() => photos);
}
