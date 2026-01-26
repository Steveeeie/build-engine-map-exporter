import path from "node:path";
import fs from "node:fs/promises";
import { PNG } from "pngjs";
import type { ExportData, Texture } from "../../types";

interface HandleExportMapParams {
  textures: Map<number, Texture>;
  exportData: ExportData;
}

async function handleExportMap({ textures, exportData }: HandleExportMapParams) {
  const { outputFolder, mapName, objContent, mtlContent, picnums } = exportData;
  const baseName = mapName.replace(/\.map$/i, "");

  // Write OBJ file
  await fs.writeFile(path.join(outputFolder, `${baseName}.obj`), objContent);

  // Write MTL file
  await fs.writeFile(path.join(outputFolder, `${baseName}.mtl`), mtlContent);

  // Write texture PNG files
  for (const picnum of picnums) {
    const texture = textures.get(picnum);

    if (!texture) continue;

    const png = new PNG({
      width: texture.width,
      height: texture.height,
      filterType: -1,
      deflateLevel: 0,
    });

    png.data.set(texture.data);

    await fs.writeFile(
      path.join(outputFolder, `texture_${picnum}.png`),
      PNG.sync.write(png),
    );
  }

}

export { handleExportMap };
