import type { Texture } from "../../../types";

import {
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from "three";

/** Create a material from texture data */
function createMaterial(textureData: Texture | undefined, picnum: number) {
  if (!textureData) {
    return new MeshBasicMaterial({
      color: 0x888888,
      side: DoubleSide,
    });
  }

  const { width, height, data } = textureData;

  // Texture
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.flipY = true;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  // Material
  const material = new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
    transparent: true,
    alphaTest: 0.5,
    name: `texture_${picnum}`,
  });

  return material;
}

export { createMaterial };
