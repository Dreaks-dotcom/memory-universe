// Grows the memory card out of the round photo on its planet, and shrinks it back.
//
// `origin` is the photo moon on screen: { x, y, size } in CSS pixels. The card starts
// as a circle of that size at that spot and opens into its full shape.
const DURATION_IN = 680;
const DURATION_OUT = 460;
const EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_OUT = "cubic-bezier(0.55, 0, 0.75, 0.2)";

export function canMorph(origin) {
  return Boolean(origin) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function morphFromOrigin(element, origin) {
  return element.animate(getKeyframes(element, origin), {
    duration: DURATION_IN,
    easing: EASE_IN,
  }).finished;
}

export function morphToOrigin(element, origin) {
  return element.animate(getKeyframes(element, origin).reverse(), {
    duration: DURATION_OUT,
    easing: EASE_OUT,
    fill: "forwards",
  }).finished;
}

function getKeyframes(element, origin) {
  // Measure without any running animation so we get the card's resting box.
  element.getAnimations().forEach((animation) => animation.cancel());

  const box = element.getBoundingClientRect();
  const shortSide = Math.min(box.width, box.height);
  const scale = origin.size / shortSide;
  const dx = origin.x - (box.left + box.width / 2);
  const dy = origin.y - (box.top + box.height / 2);
  const startCircle = `circle(${(shortSide / 2).toFixed(1)}px at 50% 50%)`;

  return [
    {
      transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      clipPath: startCircle,
      opacity: 0.6,
    },
    {
      opacity: 1,
      offset: 0.25,
    },
    {
      transform: "translate(0, 0) scale(1)",
      clipPath: "circle(72% at 50% 50%)",
      opacity: 1,
    },
  ];
}
