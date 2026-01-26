import type { Texture } from "../../../types";

export interface TextureSize {
  width: number;
  height: number;
}

const DEFAULT_TEXTURE_SIZE = 64;

/** Get texture dimensions, falling back to default if not found */
export function getTextureSize(
  textures: Record<number, Texture>,
  picnum: number,
) {
  const texture = textures[picnum];

  return texture
    ? { width: texture.width, height: texture.height }
    : { width: DEFAULT_TEXTURE_SIZE, height: DEFAULT_TEXTURE_SIZE };
}
