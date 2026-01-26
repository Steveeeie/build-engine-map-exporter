import type { Sector, Sprite, Wall } from "../../types";

export function parseMap(buffer: Uint8Array) {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );

  let offset = 0;

  const header = {
    version: view.getInt32(offset, true),
    posx: view.getInt32(offset + 4, true),
    posy: view.getInt32(offset + 8, true),
    posz: view.getInt32(offset + 12, true),
    ang: view.getInt16(offset + 16, true),
    cursectnum: view.getInt16(offset + 18, true),
  };

  offset += 20;

  if (header.version !== 7 && header.version !== 8 && header.version !== 9) {
    console.warn("Unknown map version:", header.version);
  }

  const numSectors = view.getInt16(offset, true);
  offset += 2;

  const sectors: Sector[] = [];
  for (let i = 0; i < numSectors; i++) {
    sectors.push(readSector(view, offset));
    offset += 40;
  }

  const numWalls = view.getInt16(offset, true);
  offset += 2;

  const walls: Wall[] = [];
  for (let i = 0; i < numWalls; i++) {
    walls.push(readWall(view, offset));
    offset += 32;
  }

  const numSprites = view.getInt16(offset, true);
  offset += 2;

  const sprites: Sprite[] = [];
  for (let i = 0; i < numSprites; i++) {
    sprites.push(readSprite(view, offset));
    offset += 44;
  }

  return { header, sectors, walls, sprites, textures: {} };
}

function readSector(view: DataView, offset: number) {
  return {
    wallptr: view.getInt16(offset, true),
    wallnum: view.getInt16(offset + 2, true),
    ceilingz: view.getInt32(offset + 4, true),
    floorz: view.getInt32(offset + 8, true),
    ceilingstat: view.getInt16(offset + 12, true),
    floorstat: view.getInt16(offset + 14, true),
    ceilingpicnum: view.getInt16(offset + 16, true),
    ceilingheinum: view.getInt16(offset + 18, true),
    ceilingshade: view.getInt8(offset + 20),
    ceilingpal: view.getUint8(offset + 21),
    ceilingxpanning: view.getUint8(offset + 22),
    ceilingypanning: view.getUint8(offset + 23),
    floorpicnum: view.getInt16(offset + 24, true),
    floorheinum: view.getInt16(offset + 26, true),
    floorshade: view.getInt8(offset + 28),
    floorpal: view.getUint8(offset + 29),
    floorxpanning: view.getUint8(offset + 30),
    floorypanning: view.getUint8(offset + 31),
    visibility: view.getUint8(offset + 32),
    filler: view.getUint8(offset + 33),
    lotag: view.getInt16(offset + 34, true),
    hitag: view.getInt16(offset + 36, true),
    extra: view.getInt16(offset + 38, true),
  };
}

function readWall(view: DataView, offset: number) {
  return {
    x: view.getInt32(offset, true),
    y: view.getInt32(offset + 4, true),
    point2: view.getInt16(offset + 8, true),
    nextwall: view.getInt16(offset + 10, true),
    nextsector: view.getInt16(offset + 12, true),
    cstat: view.getInt16(offset + 14, true),
    picnum: view.getInt16(offset + 16, true),
    overpicnum: view.getInt16(offset + 18, true),
    shade: view.getInt8(offset + 20),
    pal: view.getUint8(offset + 21),
    xrepeat: view.getUint8(offset + 22),
    yrepeat: view.getUint8(offset + 23),
    xpanning: view.getUint8(offset + 24),
    ypanning: view.getUint8(offset + 25),
    lotag: view.getInt16(offset + 26, true),
    hitag: view.getInt16(offset + 28, true),
    extra: view.getInt16(offset + 30, true),
  };
}

function readSprite(view: DataView, offset: number) {
  return {
    x: view.getInt32(offset, true),
    y: view.getInt32(offset + 4, true),
    z: view.getInt32(offset + 8, true),
    cstat: view.getInt16(offset + 12, true),
    picnum: view.getInt16(offset + 14, true),
    shade: view.getInt8(offset + 16),
    pal: view.getUint8(offset + 17),
    clipdist: view.getUint8(offset + 18),
    filler: view.getUint8(offset + 19),
    xrepeat: view.getUint8(offset + 20),
    yrepeat: view.getUint8(offset + 21),
    xoffset: view.getInt8(offset + 22),
    yoffset: view.getInt8(offset + 23),
    sectnum: view.getInt16(offset + 24, true),
    statnum: view.getInt16(offset + 26, true),
    ang: view.getInt16(offset + 28, true),
    owner: view.getInt16(offset + 30, true),
    xvel: view.getInt16(offset + 32, true),
    yvel: view.getInt16(offset + 34, true),
    zvel: view.getInt16(offset + 36, true),
    lotag: view.getInt16(offset + 38, true),
    hitag: view.getInt16(offset + 40, true),
    extra: view.getInt16(offset + 42, true),
  };
}
