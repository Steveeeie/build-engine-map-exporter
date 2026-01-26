import { Mesh } from "three";
import type { Sector, Sprite, Texture, Wall } from "../../../types";
import { buildToWorld } from "./coordinates";
import { createMaterial } from "./create-material";
import { getZOfSlope } from "./get-z-of-slope";
import { getTextureSize, type TextureSize } from "./get-texture-size";
import { createGeometry } from "./create-geometry";

/** Generate meshes for all visible sprites */
export function createSpriteMeshes(
  sprites: Sprite[],
  sectors: Sector[],
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  return sprites
    .filter(isVisibleSprite)
    .map((sprite) => createSpriteMesh(sprite, sectors, walls, textures))
    .filter((mesh) => mesh !== null);
}

/** Check if a sprite should be rendered */
function isVisibleSprite(sprite: Sprite) {
  // Skip invisible sprites, very low picnums, and special sprites
  return (
    !(sprite.cstat & 0x8000) &&
    sprite.picnum > 10 &&
    sprite.picnum !== 614 &&
    sprite.picnum < 4096
  );
}

/** Create mesh for a single sprite */
function createSpriteMesh(
  sprite: Sprite,
  sectors: Sector[],
  walls: Wall[],
  textures: Record<number, Texture>,
) {
  const picnum = sprite.picnum;
  const textureSize = getTextureSize(textures, picnum);
  const textureData = textures[picnum];
  const alignment = (sprite.cstat >> 4) & 3;

  // 0 = face sprite, 1 = wall sprite, 2/3 = floor sprite
  if (alignment <= 1) {
    return createFaceOrWallSpriteMesh(sprite, textureSize, textureData, picnum);
  }

  return createFloorSpriteMesh(
    sprite,
    textureSize,
    textureData,
    picnum,
    alignment,
    sectors,
    walls,
  );
}

/** Create face sprite (billboard) or wall-aligned sprite */
function createFaceOrWallSpriteMesh(
  sprite: Sprite,
  textureSize: TextureSize,
  textureData: Texture | undefined,
  picnum: number,
) {
  const alignment = (sprite.cstat >> 4) & 3;
  const xSize = (textureSize.width * sprite.xrepeat) / 4.0;
  const ySize = (textureSize.height * sprite.yrepeat) / 4.0;
  const xOff = (sprite.xoffset * sprite.xrepeat) / 4.0;
  const yOff = (sprite.yoffset * sprite.yrepeat) / 4.0;
  const angle = (sprite.ang * Math.PI) / 1024.0;

  const px = Math.sin(angle);
  const py = -Math.cos(angle);

  // Wall sprites need slight offset to prevent z-fighting
  const wallOffset = alignment === 1 ? 2 : 0;
  const nx = -py * wallOffset;
  const ny = px * wallOffset;

  // Calculate corner positions
  const lx = sprite.x - (xSize / 2 - xOff) * px + nx;
  const ly = sprite.y - (xSize / 2 - xOff) * py + ny;
  const rx = sprite.x + (xSize / 2 + xOff) * px + nx;
  const ry = sprite.y + (xSize / 2 + xOff) * py + ny;
  const bot = sprite.z + (sprite.cstat & 128 ? ySize * 8 : 0) + yOff * 16;
  const top = bot - ySize * 16;

  const v0 = buildToWorld(lx, ly, bot);
  const v1 = buildToWorld(rx, ry, bot);
  const v2 = buildToWorld(rx, ry, top);
  const v3 = buildToWorld(lx, ly, top);

  // UV coordinates with flip flags
  const u0 = sprite.cstat & 4 ? 1 : 0;
  const u1 = sprite.cstat & 4 ? 0 : 1;
  const v0v = sprite.cstat & 8 ? 1 : 0;
  const v1v = sprite.cstat & 8 ? 0 : 1;

  // prettier-ignore
  const positions = [
    v0.x, v0.y, v0.z,
    v1.x, v1.y, v1.z,
    v2.x, v2.y, v2.z,
    v0.x, v0.y, v0.z,
    v2.x, v2.y, v2.z,
    v3.x, v3.y, v3.z,
  ];

  // prettier-ignore
  const uvs = [
    u0, v0v, u1, v0v, u1, v1v,
    u0, v0v, u1, v1v, u0, v1v,
  ];

  const geometry = createGeometry(positions, uvs);
  const material = createMaterial(textureData, picnum);

  return new Mesh(geometry, material);
}

/** Create floor-aligned sprite */
function createFloorSpriteMesh(
  sprite: Sprite,
  textureSize: TextureSize,
  textureData: Texture | undefined,
  picnum: number,
  alignment: number,
  sectors: Sector[],
  walls: Wall[],
) {
  const xSize = (textureSize.width * sprite.xrepeat) / 4.0;
  const ySize = (textureSize.height * sprite.yrepeat) / 4.0;
  const xOff = (sprite.xoffset * sprite.xrepeat) / 4.0;
  const yOff = (sprite.yoffset * sprite.yrepeat) / 4.0;
  const angle = (sprite.ang * Math.PI) / 1024.0 - Math.PI / 2;

  const corners: [number, number][] = [
    [-xSize / 2, -ySize / 2],
    [xSize / 2, -ySize / 2],
    [xSize / 2, ySize / 2],
    [-xSize / 2, ySize / 2],
  ];

  const cosAng = Math.cos(angle);
  const sinAng = Math.sin(angle);

  const verts = corners.map(([lx, ly]) => {
    const x = sprite.x + lx * cosAng - ly * sinAng + xOff;
    const y = sprite.y + lx * sinAng + ly * cosAng - yOff;

    // Slope-aligned sprites (alignment 3) follow the floor
    let baseZ = sprite.z;

    if (
      alignment === 3 &&
      sprite.sectnum >= 0 &&
      sprite.sectnum < sectors.length
    ) {
      baseZ = getZOfSlope(sectors[sprite.sectnum], walls, x, y, false);
    }

    // Offset to prevent z-fighting
    return buildToWorld(x, y, baseZ - 32);
  });

  // UV coordinates with flip flags
  const uvCorners: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  const uvs = uvCorners.flatMap(([u, v]) => [
    sprite.cstat & 4 ? 1 - u : u,
    sprite.cstat & 8 ? 1 - v : v,
  ]);

  // prettier-ignore
  const positions = [
    verts[0].x, verts[0].y, verts[0].z,
    verts[1].x, verts[1].y, verts[1].z,
    verts[2].x, verts[2].y, verts[2].z,
    verts[0].x, verts[0].y, verts[0].z,
    verts[2].x, verts[2].y, verts[2].z,
    verts[3].x, verts[3].y, verts[3].z,
  ];

  // prettier-ignore
  const uvData = [
    uvs[0], uvs[1], uvs[2], uvs[3], uvs[4], uvs[5],
    uvs[0], uvs[1], uvs[4], uvs[5], uvs[6], uvs[7],
  ];

  const geometry = createGeometry(positions, uvData);
  const material = createMaterial(textureData, picnum);

  return new Mesh(geometry, material);
}
