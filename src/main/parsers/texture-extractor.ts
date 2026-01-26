import { extractFile, hasFile, type GRPArchive } from "./grp-reader";

export interface Texture {
  width: number;
  height: number;
  data: Uint8Array;
}

function generateDefaultPalette() {
  const palette = new Uint8Array(768);

  for (let i = 0; i < 256; i++) {
    palette[i * 3 + 0] = i;
    palette[i * 3 + 1] = i;
    palette[i * 3 + 2] = i;
  }

  return palette;
}

function loadPalette(archive: GRPArchive) {
  if (!hasFile(archive, "PALETTE.DAT")) {
    return generateDefaultPalette();
  }

  const paletteData = extractFile(archive, "PALETTE.DAT");

  if (paletteData.length >= 768) {
    const palette = new Uint8Array(768);

    // Build uses 6-bit color (0-63), scale to 8-bit
    for (let i = 0; i < 768; i++) {
      palette[i] = Math.floor((paletteData[i] * 255) / 63);
    }

    return palette;
  }

  return generateDefaultPalette();
}

function parseArtFile(data: Uint8Array) {
  if (data.length < 16) return null;

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8; // skip version and numtiles

  const localtilestart = view.getInt32(offset, true);
  offset += 4;

  const localtileend = view.getInt32(offset, true);
  offset += 4;

  const numTiles = localtileend - localtilestart + 1;

  if (
    numTiles <= 0 ||
    numTiles > 4096 ||
    localtilestart < 0 ||
    localtileend >= 10000
  ) {
    return null;
  }

  const tilesizx = new Int16Array(numTiles);
  const tilesizy = new Int16Array(numTiles);

  for (let i = 0; i < numTiles; i++) {
    tilesizx[i] = view.getInt16(offset, true);
    offset += 2;
  }

  for (let i = 0; i < numTiles; i++) {
    tilesizy[i] = view.getInt16(offset, true);
    offset += 2;
  }

  offset += numTiles * 4; // skip picanm

  const tiledata: (Uint8Array | null)[] = [];

  for (let i = 0; i < numTiles; i++) {
    const width = tilesizx[i];
    const height = tilesizy[i];

    if (width <= 0 || height <= 0 || width > 1024 || height > 1024) {
      tiledata.push(null);
      continue;
    }

    const dataSize = width * height;

    if (offset + dataSize > data.length) {
      tiledata.push(null);
      break;
    }

    const pixels = new Uint8Array(dataSize);

    for (let j = 0; j < dataSize; j++) {
      pixels[j] = data[offset + j];
    }

    tiledata.push(pixels);
    offset += dataSize;
  }

  return { localtilestart, localtileend, tilesizx, tilesizy, tiledata };
}

// Pixels are column-major palette indices, index 255 = transparent
function tileToRGBA(
  palette: Uint8Array,
  pixels: Uint8Array,
  width: number,
  height: number,
) {
  const rgba = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = x * height + y;
      const dstIndex = (y * width + x) * 4;
      const colorIndex = pixels[srcIndex];

      if (colorIndex === 255) {
        rgba[dstIndex + 0] = 0;
        rgba[dstIndex + 1] = 0;
        rgba[dstIndex + 2] = 0;
        rgba[dstIndex + 3] = 0;
      } else {
        rgba[dstIndex + 0] = palette[colorIndex * 3 + 0];
        rgba[dstIndex + 1] = palette[colorIndex * 3 + 1];
        rgba[dstIndex + 2] = palette[colorIndex * 3 + 2];
        rgba[dstIndex + 3] = 255;
      }
    }
  }

  return rgba;
}

export function loadTextures(archive: GRPArchive) {
  const palette = loadPalette(archive);
  const textures = new Map<number, Texture>();

  for (let i = 0; i < 20; i++) {
    const filename = `TILES${String(i).padStart(3, "0")}.ART`;

    if (!hasFile(archive, filename)) continue;

    const artData = extractFile(archive, filename);
    if (!artData) continue;

    const art = parseArtFile(artData);
    if (!art) continue;

    for (let j = 0; j < art.tiledata.length; j++) {
      const pixels = art.tiledata[j];
      if (!pixels) continue;

      const width = art.tilesizx[j];
      const height = art.tilesizy[j];
      const tileNum = art.localtilestart + j;

      textures.set(tileNum, {
        width,
        height,
        data: tileToRGBA(palette, pixels, width, height),
      });
    }
  }

  if (textures.size === 0) {
    return null;
  }

  return textures;
}
