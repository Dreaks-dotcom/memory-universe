// Phones and tablets get a lighter scene: fewer background stars and a lower
// render resolution, which keeps the animation smooth and the battery happier.
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 700;

export const isLightweightDevice = isTouchDevice || isSmallScreen;

export const STAR_COUNT = isLightweightDevice ? 45000 : 100000;

export function getPixelRatio() {
  return Math.min(window.devicePixelRatio, isLightweightDevice ? 1.5 : 2);
}
