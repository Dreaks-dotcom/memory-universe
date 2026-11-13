import { hashString, mulberry32 } from "../utils/random.js";

// Gives each system a random, pale color (as if mixed with white), while keeping
// systems from landing on nearly the same tone.
//
// For every system a handful of random hues is drawn, seeded by its id, and the one
// farthest from the colors already picked wins ("best candidate" sampling). The result
// looks random but stays spread out. Systems are handled in config order, so adding a
// system later never changes the colors of the ones before it.
//
// Hues skip the warm gold reserved for the center star. Colors are made in OKLCH,
// where equal lightness really looks equally bright, so none of them shouts.

const RESERVED_HUES = [70, 118]; // gold/yellow, kept for the center star
const CANDIDATES = 12;
const LIGHTNESS = [0.85, 0.88];
const CHROMA = [0.06, 0.09];

export function pickSystemColors(ids) {
  const takenHues = [];

  return ids.map((id) => {
    const random = mulberry32(hashString(`color:${id}`));
    let bestHue = 0;
    let bestGap = -1;

    for (let attempt = 0; attempt < CANDIDATES; attempt += 1) {
      const hue = randomHue(random);
      const gap = takenHues.length === 0 ? 360 : Math.min(...takenHues.map((taken) => hueDistance(taken, hue)));

      if (gap > bestGap) {
        bestHue = hue;
        bestGap = gap;
      }
    }

    takenHues.push(bestHue);

    return oklchToHex(between(LIGHTNESS, random()), between(CHROMA, random()), bestHue);
  });
}

function randomHue(random) {
  const [skipFrom, skipTo] = RESERVED_HUES;

  return (skipTo + random() * (360 - (skipTo - skipFrom))) % 360;
}

function hueDistance(a, b) {
  const difference = Math.abs(a - b) % 360;

  return Math.min(difference, 360 - difference);
}

function between([min, max], t) {
  return min + (max - min) * t;
}

// OKLCH → sRGB hex. If a color falls outside what screens can show, its
// chroma is lowered until it fits.
function oklchToHex(lightness, chroma, hue) {
  let currentChroma = chroma;
  let rgb = oklchToLinearRgb(lightness, currentChroma, hue);

  while (rgb.some((channel) => channel < 0 || channel > 1) && currentChroma > 0) {
    currentChroma = Math.max(0, currentChroma - 0.005);
    rgb = oklchToLinearRgb(lightness, currentChroma, hue);
  }

  return `#${rgb.map((channel) => toHex(gammaEncode(channel))).join("")}`;
}

function oklchToLinearRgb(lightness, chroma, hue) {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function gammaEncode(channel) {
  const clamped = Math.min(Math.max(channel, 0), 1);

  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function toHex(channel) {
  return Math.round(channel * 255)
    .toString(16)
    .padStart(2, "0");
}
