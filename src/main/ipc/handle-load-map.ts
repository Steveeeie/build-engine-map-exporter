import type { Texture } from "../../types";
import { extractFile, type GRPArchive } from "../parsers/grp-reader";
import { parseMap } from "../parsers/map-parser";

interface HandleLoadMapParams {
  grpArchive: GRPArchive;
  textures: Map<number, Texture>;
  mapFileName: string;
}

function handleLoadMap({ grpArchive, textures, mapFileName }: HandleLoadMapParams) {
  const mapBytes = extractFile(grpArchive, mapFileName);
  const mapData = parseMap(mapBytes);

  mapData.textures = Object.fromEntries(textures);

  return mapData;
}

export { handleLoadMap };
