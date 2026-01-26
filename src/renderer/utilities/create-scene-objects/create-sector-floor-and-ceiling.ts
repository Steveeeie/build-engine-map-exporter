import { Mesh } from "three";
import type { Sector, Texture, Wall } from "../../../types";
import { buildToWorld } from "./coordinates";
import { createMaterial } from "./create-material";
import { isSkyTexture } from "./create-sky-sphere";
import { getZOfSlope } from "./get-z-of-slope";
import { getTextureSize } from "./get-texture-size";
import { calcArea } from "./calc-area";
import { createGeometry } from "./create-geometry";
import { triangulatePolygon } from "./triangulate-polygon";

/** Calculate UV coordinates for floor or ceiling at a point */
function calcFloorCeilUV(
  sector: Sector,
  walls: Wall[],
  x: number,
  y: number,
  isCeiling: boolean,
  texW: number,
  texH: number,
) {
  const stat = isCeiling ? sector.ceilingstat : sector.floorstat;
  const xpanning = isCeiling ? sector.ceilingxpanning : sector.floorxpanning;
  const ypanning = isCeiling ? sector.ceilingypanning : sector.floorypanning;
  const scaleCoef = stat & 8 ? 8.0 : 16.0;

  let tex = x;
  let tey = -y;

  // Align to first wall if flag set
  if (stat & 64) {
    const firstWall = walls[sector.wallptr];
    const secondWall = walls[firstWall?.point2];

    if (firstWall && secondWall) {
      const dx = secondWall.x - firstWall.x;
      const dy = secondWall.y - firstWall.y;
      const ang = Math.atan2(dy, dx) + Math.PI / 2;
      const cosang = Math.cos(ang);
      const sinang = Math.sin(ang);
      const rx = x - firstWall.x;
      const ry = firstWall.y - y;

      tex = rx * sinang + ry * cosang;
      tey = rx * cosang - ry * sinang;
    }
  }

  // Apply flip flags
  if (stat & 4) [tex, tey] = [tey, tex];
  if (stat & 16) tex = -tex;
  if (stat & 32) tey = -tey;

  return {
    u: tex / (scaleCoef * texW) + xpanning / 256.0,
    v: -tey / (scaleCoef * texH) - ypanning / 256.0,
  };
}

/** Generate floor and ceiling meshes for a sector */
export function createSectorFloorAndCeiling(
  sector: Sector,
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const meshes: Mesh[] = [];

  const polygon = collectPolygonLoops(sector, walls);

  if (polygon.length === 0) return meshes;

  const { flatVerts, holeIndices } = flattenPolygon(polygon);
  const triIndices = triangulatePolygon(flatVerts, holeIndices);

  if (triIndices.length === 0) return meshes;

  // Floor
  if (!(sector.floorstat & 1) && !isSkyTexture(sector.floorpicnum)) {
    const floor = createFloorOrCeilingMesh(
      sector,
      flatVerts,
      triIndices,
      false,
      walls,
      textures,
    );

    if (floor) meshes.push(floor);
  }

  // Ceiling
  if (!(sector.ceilingstat & 1) && !isSkyTexture(sector.ceilingpicnum)) {
    const ceiling = createFloorOrCeilingMesh(
      sector,
      flatVerts,
      triIndices,
      true,
      walls,
      textures,
    );

    if (ceiling) meshes.push(ceiling);
  }

  return meshes;
}

/** Collect all polygon loops (outer boundary and holes) for a sector */
function collectPolygonLoops(sector: Sector, walls: Wall[]) {
  const startWall = sector.wallptr;
  const numWalls = sector.wallnum;

  if (numWalls < 3) return [];

  const polygon: [number, number][][] = [];
  const visited = new Array(numWalls).fill(false);

  for (let i = 0; i < numWalls; i++) {
    if (visited[i]) continue;

    const ring = traceWallLoop(
      startWall + i,
      startWall,
      numWalls,
      walls,
      visited,
    );

    if (ring.length >= 3) {
      polygon.push(ring);
    }
  }

  // Filter degenerate polygons and sort by area (largest first)
  const validPolygons = polygon.filter((ring) => calcArea(ring) > 1);

  if (validPolygons.length > 1) {
    validPolygons.sort((a, b) => calcArea(b) - calcArea(a));
  }

  return validPolygons;
}

/** Trace a single wall loop starting from a given wall */
function traceWallLoop(
  startIdx: number,
  sectorStart: number,
  numWalls: number,
  walls: Wall[],
  visited: boolean[],
) {
  const ring: [number, number][] = [];
  let currIdx = startIdx;
  let safety = 0;

  do {
    if (currIdx < 0 || currIdx >= walls.length) break;

    const wall = walls[currIdx];
    ring.push([wall.x, wall.y]);

    const localIdx = currIdx - sectorStart;

    if (localIdx >= 0 && localIdx < numWalls) {
      visited[localIdx] = true;
    }

    currIdx = wall.point2;
    safety++;
  } while (currIdx !== startIdx && safety < numWalls + 2);

  return ring;
}

/** Flatten polygon loops into earcut format */
function flattenPolygon(polygon: [number, number][][]) {
  const flatVerts: number[] = [];
  const holeIndices: number[] = [];

  for (let i = 0; i < polygon.length; i++) {
    if (i > 0) {
      holeIndices.push(flatVerts.length / 2);
    }

    for (const [x, y] of polygon[i]) {
      flatVerts.push(x, y);
    }
  }

  return {
    flatVerts,
    holeIndices: holeIndices.length > 0 ? holeIndices : undefined,
  };
}

/** Create floor or ceiling surface from triangulated polygon */
function createFloorOrCeilingMesh(
  sector: Sector,
  flatVerts: number[],
  triIndices: number[],
  isCeiling: boolean,
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const picnum = isCeiling ? sector.ceilingpicnum : sector.floorpicnum;
  const textureSize = getTextureSize(textures, picnum);
  const numVerts = flatVerts.length / 2;

  // Build vertex and UV arrays
  const verts: { x: number; y: number; z: number }[] = [];
  const uvs: { u: number; v: number }[] = [];

  for (let i = 0; i < numVerts; i++) {
    const x = flatVerts[i * 2];
    const y = flatVerts[i * 2 + 1];
    const z = getZOfSlope(sector, walls, x, y, isCeiling);

    verts.push(buildToWorld(x, y, z));
    uvs.push(
      calcFloorCeilUV(
        sector,
        walls,
        x,
        y,
        isCeiling,
        textureSize.width,
        textureSize.height,
      ),
    );
  }

  // Build triangle data
  const positions: number[] = [];
  const uvData: number[] = [];

  for (let i = 0; i < triIndices.length; i += 3) {
    // Reverse winding for floors vs ceilings
    const [i0, i1, i2] = isCeiling
      ? [triIndices[i], triIndices[i + 1], triIndices[i + 2]]
      : [triIndices[i + 2], triIndices[i + 1], triIndices[i]];

    const v0 = verts[i0];
    const v1 = verts[i1];
    const v2 = verts[i2];
    const uv0 = uvs[i0];
    const uv1 = uvs[i1];
    const uv2 = uvs[i2];

    positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    uvData.push(uv0.u, uv0.v, uv1.u, uv1.v, uv2.u, uv2.v);
  }

  if (positions.length === 0) return null;

  const geometry = createGeometry(positions, uvData);
  const material = createMaterial(textures[picnum], picnum);

  return new Mesh(geometry, material);
}
