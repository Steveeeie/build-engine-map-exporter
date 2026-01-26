import type { MapData } from "../../../types";

import {
  BackSide,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
} from "three";

function isSkyTexture(picnum: number) {
  return (picnum >= 80 && picnum <= 89) || (picnum >= 98 && picnum <= 99);
}

function findSkyPicnum(mapData: MapData) {
  // First try parallaxed ceilings with known sky textures
  for (const sector of mapData.sectors) {
    if ((sector.ceilingstat & 1) !== 0 && isSkyTexture(sector.ceilingpicnum)) {
      return sector.ceilingpicnum;
    }
  }

  // Fall back to any parallaxed ceiling
  for (const sector of mapData.sectors) {
    if ((sector.ceilingstat & 1) !== 0 && sector.ceilingpicnum > 0) {
      return sector.ceilingpicnum;
    }
  }

  return null;
}

/** Create sky sphere mesh from map data */
function createSkySphere(mapData: MapData) {
  const skyPicnum = findSkyPicnum(mapData);

  if (skyPicnum == null) return null;

  const skyTexture = mapData.textures[skyPicnum];

  if (!skyTexture) return null;

  const { width, height, data } = skyTexture;
  const aspectRatio = width / height;

  // Calculate tiling based on aspect ratio
  let repeatX = 2;
  if (aspectRatio >= 2) repeatX = 1;
  if (aspectRatio <= 0.5) repeatX = 4;

  // Texture
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.repeat.set(-repeatX, 1);
  texture.flipY = true;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  // Material
  const material = new MeshBasicMaterial({
    map: texture,
    side: BackSide,
  });

  // Mesh
  const geometry = new SphereGeometry(9000, 64, 32);
  const mesh = new Mesh(geometry, material);

  mesh.name = "sky-sphere";

  return mesh;
}

export { createSkySphere, isSkyTexture };
