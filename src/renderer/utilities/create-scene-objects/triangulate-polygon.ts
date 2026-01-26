import earcut from "earcut";

/** Triangulate a polygon with holes using earcut */
function triangulatePolygon(flatVerts: number[], holeIndices?: number[]) {
  const indices = tryEarcut(flatVerts, holeIndices);

  if (indices.length > 0) return indices;

  // Try reversing winding order if earcut fails
  const reversed: number[] = [];

  for (let i = flatVerts.length - 2; i >= 0; i -= 2) {
    reversed.push(flatVerts[i], flatVerts[i + 1]);
  }

  return tryEarcut(reversed);
}

/** Attempt triangulation with earcut, returns empty array on failure */
function tryEarcut(flatVerts: number[], holeIndices?: number[]) {
  try {
    return earcut(flatVerts, holeIndices);
  } catch {
    return [];
  }
}

export { triangulatePolygon };
