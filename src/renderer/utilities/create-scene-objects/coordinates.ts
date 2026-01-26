export interface Vertex {
  x: number;
  y: number;
  z: number;
}

const SCALE = 1.0 / 1024.0;

/** Convert BUILD coordinates to Three.js world coordinates */
function buildToWorld(x: number, y: number, z: number) {
  return {
    x: x * SCALE,
    y: (-z * SCALE) / 16.0,
    z: y * SCALE,
  };
}

export { buildToWorld, SCALE };
