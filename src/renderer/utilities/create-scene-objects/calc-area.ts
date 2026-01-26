/**
 * Calculate signed area of a polygon ring.
 * Positive = counter-clockwise, negative = clockwise.
 */
function calcArea(ring: [number, number][]) {
  let area = 0;

  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1];
  }

  return Math.abs(area / 2.0);
}

export { calcArea };
