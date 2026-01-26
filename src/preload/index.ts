// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

import type {
  ExportData,
  GRPImportResult,
  MapData,
  OutputFolderResult,
} from "../types";

export const electronAPI = {
  importGRP: (): Promise<GRPImportResult | null> =>
    ipcRenderer.invoke("import-grp"),

  selectOutputFolder: (): Promise<OutputFolderResult | null> =>
    ipcRenderer.invoke("select-output-folder"),

  loadMap: (mapFileName: string): Promise<MapData> =>
    ipcRenderer.invoke("load-map", mapFileName),

  exportMap: (exportData: ExportData): Promise<void> =>
    ipcRenderer.invoke("export-map", exportData),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
