// Loads the first image that exists from a list of candidate paths
// (e.g. 01.jpg, 01.jpeg, 01.png …). Resolves with the image, or null if none load.
export function loadFirstImage(candidates) {
  return new Promise((resolve) => {
    const image = new Image();
    let index = 0;

    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = next;
    next();

    function next() {
      const candidate = candidates[index];
      index += 1;

      if (candidate) {
        image.src = candidate;
      } else {
        resolve(null);
      }
    }
  });
}
