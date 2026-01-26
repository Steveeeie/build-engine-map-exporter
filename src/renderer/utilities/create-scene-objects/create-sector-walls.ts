import { Mesh } from "three";
import type { Sector, Texture, Wall } from "../../../types";
import { buildToWorld, type Vertex } from "./coordinates";
import { createMaterial } from "./create-material";
import { getZOfSlope } from "./get-z-of-slope";
import { getTextureSize, type TextureSize } from "./get-texture-size";
import { createGeometry } from "./create-geometry";

/** Get next power of 2 greater than or equal to value */
function nextPow2(value: number) {
  let power = 1;

  while (power < value) power <<= 1;

  return power;
}

/** Calculate UV coordinates for a wall vertex */
function calcWallUV(
  wall: Wall,
  vertexZ: number,
  refZ: number,
  posX: number,
  texW: number,
  texH: number,
  dopancor: boolean,
) {
  const dist = wall.cstat & 8 ? (posX === 0 ? 1.0 : 0.0) : posX;
  const u = (dist * 8.0 * wall.xrepeat + wall.xpanning) / texW;

  let v = ((vertexZ - refZ) * wall.yrepeat) / (texH * 2048.0);

  if (wall.ypanning) {
    const pow2h = nextPow2(texH);
    let adjustedYpanning = wall.ypanning;

    if (dopancor) {
      const yoffs = Math.round((pow2h - texH) * (255.0 / pow2h));

      if (adjustedYpanning > 256 - yoffs) {
        adjustedYpanning -= yoffs;
      }
    }

    v += (pow2h * adjustedYpanning) / (256.0 * texH);
  }

  if (wall.cstat & 256) v = -v;

  return { u, v: -v };
}

/** Generate meshes for all walls in a sector */
export function createSectorWalls(
  sector: Sector,
  sectors: Sector[],
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const meshes: Mesh[] = [];
  const startWall = sector.wallptr;
  const numWalls = sector.wallnum;

  for (let i = 0; i < numWalls; i++) {
    const wallIdx = startWall + i;

    if (wallIdx >= walls.length) break;

    const wall = walls[wallIdx];
    const nextWall = walls[wall.point2];

    if (!nextWall) continue;

    if (wall.nextsector < 0) {
      const mesh = createSolidWall(wall, nextWall, sector, walls, textures);

      if (mesh) meshes.push(mesh);
    } else {
      meshes.push(
        ...createPortalWalls(
          wall,
          nextWall,
          sector,
          sectors[wall.nextsector],
          walls,
          textures,
        ),
      );
    }
  }

  return meshes;
}

/** Generate geometry for a solid (non-portal) wall */
function createSolidWall(
  wall: Wall,
  nextWall: Wall,
  sector: Sector,
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const z0f = getZOfSlope(sector, walls, wall.x, wall.y, false);
  const z1f = getZOfSlope(sector, walls, nextWall.x, nextWall.y, false);
  const z0c = getZOfSlope(sector, walls, wall.x, wall.y, true);
  const z1c = getZOfSlope(sector, walls, nextWall.x, nextWall.y, true);

  const v0 = buildToWorld(wall.x, wall.y, z0f);
  const v1 = buildToWorld(nextWall.x, nextWall.y, z1f);
  const v2 = buildToWorld(nextWall.x, nextWall.y, z1c);
  const v3 = buildToWorld(wall.x, wall.y, z0c);

  const picnum = wall.picnum;
  const refZ = wall.cstat & 4 ? sector.floorz : sector.ceilingz;
  const dopancor = !(wall.cstat & 4);
  const textureSize = getTextureSize(textures, picnum);

  const uv0 = calcWallUV(
    wall,
    z0f,
    refZ,
    0,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv1 = calcWallUV(
    wall,
    z1f,
    refZ,
    1,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv2 = calcWallUV(
    wall,
    z1c,
    refZ,
    1,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv3 = calcWallUV(
    wall,
    z0c,
    refZ,
    0,
    textureSize.width,
    textureSize.height,
    dopancor,
  );

  return createQuadMesh(
    v0,
    v1,
    v2,
    v3,
    uv0,
    uv1,
    uv2,
    uv3,
    textures[picnum],
    picnum,
  );
}

/** Generate geometry for portal walls (upper and lower portions) */
function createPortalWalls(
  wall: Wall,
  nextWall: Wall,
  sector: Sector,
  nextSector: Sector,
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const surfaces = [];

  const pF = (sector.floorstat & 1) !== 0 && (nextSector.floorstat & 1) !== 0;
  const pC =
    (sector.ceilingstat & 1) !== 0 && (nextSector.ceilingstat & 1) !== 0;

  // Floor heights at wall endpoints
  const z0 = getZOfSlope(sector, walls, wall.x, wall.y, false);
  const z1 = getZOfSlope(sector, walls, nextWall.x, nextWall.y, false);
  const nz0 = getZOfSlope(nextSector, walls, wall.x, wall.y, false);
  const nz1 = getZOfSlope(nextSector, walls, nextWall.x, nextWall.y, false);

  // Lower wall (step up)
  if (!pF && (z0 > nz0 || z1 > nz1)) {
    const surface = createLowerWall(
      wall,
      nextWall,
      sector,
      nextSector,
      z0,
      z1,
      nz0,
      nz1,
      walls,
      textures,
    );

    if (surface) surfaces.push(surface);
  }

  // Ceiling heights at wall endpoints
  const cz0 = getZOfSlope(sector, walls, wall.x, wall.y, true);
  const cz1 = getZOfSlope(sector, walls, nextWall.x, nextWall.y, true);
  const ncz0 = getZOfSlope(nextSector, walls, wall.x, wall.y, true);
  const ncz1 = getZOfSlope(nextSector, walls, nextWall.x, nextWall.y, true);

  // Upper wall (step down from ceiling)
  if (!pC && (ncz0 > cz0 || ncz1 > cz1)) {
    const surface = createUpperWall(
      wall,
      nextWall,
      sector,
      nextSector,
      cz0,
      cz1,
      ncz0,
      ncz1,
      textures,
    );

    if (surface) surfaces.push(surface);
  }

  return surfaces;
}

/** Create lower wall segment between sectors */
function createLowerWall(
  wall: Wall,
  nextWall: Wall,
  sector: Sector,
  nextSector: Sector,
  z0: number,
  z1: number,
  nz0: number,
  nz1: number,
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  // Use neighbor wall's texture if flag set
  let refWall = wall;
  let picnum = wall.picnum;

  if ((wall.cstat & 2) !== 0 && wall.nextwall >= 0) {
    refWall = walls[wall.nextwall];
    picnum = refWall.picnum;
  }

  const uvWall = {
    ...wall,
    xpanning: refWall.xpanning,
    ypanning: refWall.ypanning,
    cstat: (wall.cstat & ~256) | (refWall.cstat & 256),
  };

  const refZ = (refWall.cstat & 4) !== 0 ? sector.ceilingz : nextSector.floorz;
  const dopancor = (refWall.cstat & 4) === 0;
  const textureSize = getTextureSize(textures, picnum);

  const bot0 = z0;
  const bot1 = z1;
  const top0 = Math.min(z0, nz0);
  const top1 = Math.min(z1, nz1);

  return createWallQuad(
    wall,
    nextWall,
    bot0,
    bot1,
    top0,
    top1,
    uvWall,
    refZ,
    dopancor,
    textures[picnum],
    textureSize,
    picnum,
  );
}

/** Create upper wall segment between sectors */
function createUpperWall(
  wall: Wall,
  nextWall: Wall,
  sector: Sector,
  nextSector: Sector,
  cz0: number,
  cz1: number,
  ncz0: number,
  ncz1: number,
  textures: Record<number, Texture>,
) {
  const refZ = (wall.cstat & 4) !== 0 ? sector.ceilingz : nextSector.ceilingz;
  const dopancor = (wall.cstat & 4) !== 0;
  const picnum = wall.picnum;
  const textureSize = getTextureSize(textures, picnum);

  const bot0 = Math.max(cz0, ncz0);
  const bot1 = Math.max(cz1, ncz1);
  const top0 = cz0;
  const top1 = cz1;

  return createWallQuad(
    wall,
    nextWall,
    bot0,
    bot1,
    top0,
    top1,
    wall,
    refZ,
    dopancor,
    textures[picnum],
    textureSize,
    picnum,
  );
}

/** Create wall quad geometry with UV mapping */
function createWallQuad(
  wall: Wall,
  nextWall: Wall,
  bot0: number,
  bot1: number,
  top0: number,
  top1: number,
  uvWall: Wall,
  refZ: number,
  dopancor: boolean,
  textureData: Texture | undefined,
  textureSize: TextureSize,
  picnum: number,
) {
  const v0 = buildToWorld(wall.x, wall.y, bot0);
  const v1 = buildToWorld(nextWall.x, nextWall.y, bot1);
  const v2 = buildToWorld(nextWall.x, nextWall.y, top1);
  const v3 = buildToWorld(wall.x, wall.y, top0);

  const uv0 = calcWallUV(
    uvWall,
    bot0,
    refZ,
    0,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv1 = calcWallUV(
    uvWall,
    bot1,
    refZ,
    1,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv2 = calcWallUV(
    uvWall,
    top1,
    refZ,
    1,
    textureSize.width,
    textureSize.height,
    dopancor,
  );
  const uv3 = calcWallUV(
    uvWall,
    top0,
    refZ,
    0,
    textureSize.width,
    textureSize.height,
    dopancor,
  );

  // Skip degenerate quads
  const leftDegen = bot0 === top0;
  const rightDegen = bot1 === top1;

  if (leftDegen && rightDegen) return null;

  return createQuadMesh(
    v0,
    v1,
    v2,
    v3,
    uv0,
    uv1,
    uv2,
    uv3,
    textureData,
    picnum,
    leftDegen,
    rightDegen,
  );
}

/** Create mesh from quad vertices and UVs */
function createQuadMesh(
  v0: Vertex,
  v1: Vertex,
  v2: Vertex,
  v3: Vertex,
  uv0: { u: number; v: number },
  uv1: { u: number; v: number },
  uv2: { u: number; v: number },
  uv3: { u: number; v: number },
  textureData: Texture | undefined,
  picnum: number,
  leftDegen = false,
  rightDegen = false,
) {
  const positions: number[] = [];
  const uvs: number[] = [];

  if (leftDegen) {
    // Triangle: v0, v1, v2
    positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    uvs.push(uv0.u, uv0.v, uv1.u, uv1.v, uv2.u, uv2.v);
  } else if (rightDegen) {
    // Triangle: v0, v1, v3
    positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v3.x, v3.y, v3.z);
    uvs.push(uv0.u, uv0.v, uv1.u, uv1.v, uv3.u, uv3.v);
  } else {
    // Two triangles for quad
    // prettier-ignore
    positions.push(
      v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z,
      v0.x, v0.y, v0.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z,
    );
    // prettier-ignore
    uvs.push(
      uv0.u, uv0.v, uv1.u, uv1.v, uv2.u, uv2.v,
      uv0.u, uv0.v, uv2.u, uv2.v, uv3.u, uv3.v,
    );
  }

  const geometry = createGeometry(positions, uvs);
  const material = createMaterial(textureData, picnum);

  return new Mesh(geometry, material);
}
