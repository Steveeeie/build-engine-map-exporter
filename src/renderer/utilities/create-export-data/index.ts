import { Group, type Scene } from "three";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import type { MapData } from "../../../types";
import { generateMTL } from "./generate-mtl";
import { getUniqueMapPicnums } from "./get-unique-map-picnums";

interface CreateExportDataParams {
  mapData: MapData;
  mapName: string;
  outputFolder: string;
  scene: Scene;
}

function createExportData({
  mapData,
  mapName,
  outputFolder,
  scene,
}: CreateExportDataParams) {
  const fileName = mapName.replace(/\.map$/i, "");
  const exportGroup = new Group();

  exportGroup.name = fileName;

  // Group all exportable meshes
  scene.traverse((obj) => {
    if (obj.type === "Mesh" && obj.name !== "sky-sphere") {
      exportGroup.add(obj.clone());
    }
  });

  // Generate OBJ content from group
  const exporter = new OBJExporter();
  const rawObjContent = exporter.parse(exportGroup);

  // Remove individual object declarations and consolidate into single object
  const filteredLines = rawObjContent
    .split("\n")
    .filter((line) => !line.startsWith("o "));

  const objContent = `mtllib ${fileName}.mtl\no ${fileName}\n${filteredLines.join("\n")}`;

  // Get picnums used in map (used to export only used textures later)
  const picnums = getUniqueMapPicnums(mapData);

  // Generate MTL content
  const mtlContent = generateMTL(picnums);

  return {
    mapName,
    mtlContent,
    objContent,
    outputFolder,
    picnums,
  };
}

export { createExportData };
