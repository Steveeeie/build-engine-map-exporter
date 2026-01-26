import { dialog } from "electron";

async function handleSelectOutputFolder() {
  const result = await dialog.showOpenDialog({
    title: "Select Output Folder",
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return { outputFolderPath: result.filePaths[0] };
}

export { handleSelectOutputFolder };
