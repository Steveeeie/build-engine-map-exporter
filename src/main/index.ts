import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import type { ExportData, Texture } from "../types";
import type { GRPArchive } from "./parsers/grp-reader";
import { handleImportGRP } from "./ipc/handle-import-grp";
import { handleLoadMap } from "./ipc/handle-load-map";
import { handleSelectOutputFolder } from "./ipc/handle-select-output-folder";
import { handleExportMap } from "./ipc/handle-export-map";

let currentGRPArchive: GRPArchive | null = null;
let textures: Map<number, Texture> | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.setName("Build Map Exporter");

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: "Build Map Exporter",
    minWidth: 1280,
    minHeight: 768,
    width: 1280,
    height: 768,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

// IPC Handlers

ipcMain.handle("import-grp", async () => {
  const result = await handleImportGRP();

  if (result) {
    currentGRPArchive = result.grpArchive;
    textures = result.textures;

    return {
      grpFileName: result.grpFileName,
      mapFileNames: result.mapFileNames,
    };
  }

  return null;
});

ipcMain.handle("load-map", async (_event, mapFileName: string) => {
  if (!currentGRPArchive || !textures) {
    throw new Error("No GRP archive loaded");
  }

  return handleLoadMap({
    grpArchive: currentGRPArchive,
    textures,
    mapFileName,
  });
});

ipcMain.handle("select-output-folder", handleSelectOutputFolder);

ipcMain.handle("export-map", async (_event, exportData: ExportData) => {
  if (!textures) throw new Error("No textures loaded");

  return handleExportMap({ textures, exportData });
});

// App lifecycle

app.on("ready", () => {
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "License",
          click: () =>
            shell.openExternal(
              "https://github.com/Steveeeie/build-engine-map-exporter/blob/main/LICENSE",
            ),
        },
        { type: "separator" },
        {
          label: "Source Code - GitHub",
          click: () =>
            shell.openExternal(
              "https://github.com/Steveeeie/build-engine-map-exporter",
            ),
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
