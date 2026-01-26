import path from "node:path";
import fs from "node:fs/promises";
import { dialog } from "electron";
import { parseGRP, getMapFileNames } from "../parsers/grp-reader";
import { loadTextures } from "../parsers/texture-extractor";

async function handleImportGRP() {
  const result = await dialog.showOpenDialog({
    title: "Select GRP File",
    filters: [{ name: "GRP Files", extensions: ["grp"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const buffer = await fs.readFile(filePath);
  const grpArchive = parseGRP(buffer);
  const textures = loadTextures(grpArchive);

  return {
    grpArchive,
    textures,
    grpFileName: path.basename(filePath),
    mapFileNames: getMapFileNames(grpArchive),
  };
}

export { handleImportGRP };
