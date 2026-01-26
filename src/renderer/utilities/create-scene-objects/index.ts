import type { Mesh } from "three";
import type { MapData } from "../../../types";
import { createPlayerStart } from "./create-player-start";
import { createSkySphere } from "./create-sky-sphere";
import { createSectorFloorAndCeiling } from "./create-sector-floor-and-ceiling";
import { createSpriteMeshes } from "./create-sprite-meshes";
import { createSectorWalls } from "./create-sector-walls";

function createSceneObjects(mapData: MapData) {
  const { sectors, walls, sprites, textures, header } = mapData;

  // Sector meshes
  const sectorMeshes: Mesh[] = [];

  for (const sector of sectors) {
    sectorMeshes.push(...createSectorFloorAndCeiling(sector, walls, textures));
    sectorMeshes.push(...createSectorWalls(sector, sectors, walls, textures));
  }

  // Sprite meshes
  const spriteMeshes = createSpriteMeshes(sprites, sectors, walls, textures);

  // Sky Sphere mesh
  const skySphereMesh = createSkySphere(mapData);

  // Player Start position
  const playerStart = createPlayerStart(header);

  return { sectorMeshes, spriteMeshes, skySphereMesh, playerStart };
}

export { createSceneObjects };
