export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// 0 at `from`, 1 at `to`, eased in between. Works in either direction (from > to fades in as value drops).
export function smoothRange(value, from, to) {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);

  return t * t * (3 - 2 * t);
}
