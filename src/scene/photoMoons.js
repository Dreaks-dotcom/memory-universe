import * as THREE from "three";
import { smoothRange } from "../utils/easing.js";
import { loadFirstImage } from "../utils/images.js";

// Turns planets into small round photos ("photo moons") as the camera comes close,
// so the album is visible in the universe itself. Far away they stay points of light.
//
// Photos preloaded on the loading screen become textures right away; any others load
// when the camera first approaches. Each is reduced to a small round texture, so even
// large albums stay light on memory.
const LOAD_DISTANCE = 700; // start loading the photo within this distance
const FADE_DISTANCE = [360, 210]; // hidden → fully visible
const TEXTURE_SIZE = 256;
const SIZE_FACTOR = 5; // photo diameter relative to the planet radius
const VISITED_OPACITY = 0.55;

export function createPhotoMoons({ bodies, camera, photos = new Map() }) {
  const worldPosition = new THREE.Vector3();
  const moons = bodies
    .filter((body) => body.memory.kind === "memory" && body.memory.imageCandidates.length > 0)
    .map(createMoon);

  function createMoon(body) {
    const material = new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    const size = body.radius * SIZE_FACTOR;

    sprite.scale.set(size, size, 1);
    sprite.visible = false;
    body.photoSize = size;
    sprite.renderOrder = 2;
    body.group.add(sprite);

    const photo = photos.get(body.memory.id);

    if (photo) {
      material.map = createRoundTexture(photo);
      return { body, sprite, material, state: "ready" };
    }

    return { body, sprite, material, state: "idle" };
  }

  function update() {
    for (const moon of moons) {
      moon.body.group.getWorldPosition(worldPosition);

      const distance = camera.position.distanceTo(worldPosition);

      if (moon.state === "idle" && distance < LOAD_DISTANCE) {
        load(moon);
      }

      const visibility = moon.state === "ready" ? smoothRange(distance, ...FADE_DISTANCE) : 0;
      const opacity = visibility * (moon.body.visited ? VISITED_OPACITY : 1);

      moon.material.opacity = THREE.MathUtils.lerp(moon.material.opacity, opacity, 0.12);
      moon.sprite.visible = moon.material.opacity > 0.01;
    }
  }

  return {
    update,
  };
}

function load(moon) {
  moon.state = "loading";

  loadFirstImage(moon.body.memory.imageCandidates).then((image) => {
    if (!image) {
      moon.state = "missing";
      return;
    }

    moon.material.map = createRoundTexture(image);
    moon.material.needsUpdate = true;
    moon.state = "ready";
  });
}

// Center-crops the photo into a circle with a thin light rim.
function createRoundTexture(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const half = TEXTURE_SIZE / 2;
  const rim = 6;
  const side = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const sourceX = ((image.naturalWidth || image.width) - side) / 2;
  const sourceY = ((image.naturalHeight || image.height) - side) / 2;

  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  context.beginPath();
  context.arc(half, half, half - 1, 0, Math.PI * 2);
  context.fillStyle = "rgba(248, 243, 234, 0.9)";
  context.fill();

  context.save();
  context.beginPath();
  context.arc(half, half, half - rim, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, sourceX, sourceY, side, side, rim, rim, TEXTURE_SIZE - rim * 2, TEXTURE_SIZE - rim * 2);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}
