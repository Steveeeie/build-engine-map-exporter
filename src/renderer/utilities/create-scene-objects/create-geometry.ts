import { BufferGeometry, Float32BufferAttribute } from "three";

/** Create a Three.js BufferGeometry from triangle data */
function createGeometry(positions: number[], uvs: number[]) {
  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

export { createGeometry };
