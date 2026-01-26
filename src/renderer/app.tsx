import { useState } from "react";
import type { Scene } from "three";
import type { MapData } from "../types";
import { Button } from "./components/button";
import { Field } from "./components/field";
import { Group } from "./components/group";
import { Icon } from "./components/icon";
import { Maps } from "./components/maps";
import { Preview } from "./components/preview";
import { Sidebar } from "./components/sidebar";
import { Toast, type ToastVariant } from "./components/toast";
import { createExportData } from "./utilities/create-export-data";
import "./global.css";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

function App() {
  const [grpName, setGrpName] = useState<string | null>(null);
  const [mapNames, setMapNames] = useState<string[]>([]);
  const [selectedMapName, setSelectedMapName] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [outputFolder, setOutputFolder] = useState<string | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function handleImportGRP() {
    try {
      const result = await window.electronAPI.importGRP();

      setToast({ message: "Importing GRP...", variant: "info" });

      if (result) {
        setGrpName(result.grpFileName);
        setMapNames(result.mapFileNames);
        setSelectedMapName(null);
        setMapData(null);
        setToast({ message: "GRP imported successfully", variant: "success" });
      } else {
        setToast(null);
      }
    } catch {
      setToast({ message: "Failed to import GRP", variant: "error" });
    }
  }

  async function handleSelectMap(mapName: string) {
    setSelectedMapName(mapName);

    const result = await window.electronAPI.loadMap(mapName);

    setMapData(result);
  }

  async function handleSelectOutputFolder() {
    const result = await window.electronAPI.selectOutputFolder();

    if (result) {
      setOutputFolder(result.outputFolderPath);
    }
  }

  async function handleExport() {
    if (!scene || !mapData || !selectedMapName || !outputFolder) return;

    setToast({ message: "Exporting...", variant: "info" });

    try {
      const exportData = createExportData({
        scene,
        mapData,
        mapName: selectedMapName,
        outputFolder,
      });

      await window.electronAPI.exportMap(exportData);

      setToast({ message: "Export complete", variant: "success" });
    } catch {
      setToast({ message: "Export failed", variant: "error" });
    }
  }

  const hasImportedGRP = grpName !== null;
  const hasSelectedMap = selectedMapName !== null;
  const hasOutputFolder = outputFolder !== null;
  const hasCompletedSteps = hasImportedGRP && hasSelectedMap && hasOutputFolder;

  return (
    <>
      <Sidebar>
        <Sidebar.Section>
          <Sidebar.Heading>
            <Icon name="one" /> Import .GRP
          </Sidebar.Heading>

          <Group>
            <Field placeholder="No .GRP File Imported" value={grpName ?? ""} />

            <Button onClick={handleImportGRP}>
              <Icon name="import" size="small" /> Browse
            </Button>
          </Group>
        </Sidebar.Section>

        <Sidebar.Section fill scroll disabled={!hasImportedGRP}>
          <Sidebar.Heading>
            <Icon name="two" /> Select Map
          </Sidebar.Heading>

          <Maps>
            {mapNames.map((mapName) => (
              <Maps.Item
                key={mapName}
                selected={selectedMapName === mapName}
                onClick={() => handleSelectMap(mapName)}
              >
                {mapName}
              </Maps.Item>
            ))}
          </Maps>
        </Sidebar.Section>

        <Sidebar.Section disabled={!hasSelectedMap}>
          <Sidebar.Heading>
            <Icon name="three" /> Choose Output Folder
          </Sidebar.Heading>

          <Group>
            <Field placeholder="No Folder Choosen" value={outputFolder ?? ""} />

            <Button onClick={handleSelectOutputFolder}>
              <Icon name="folder" /> Browse
            </Button>
          </Group>
        </Sidebar.Section>

        <Sidebar.Section disabled={!hasCompletedSteps}>
          <Button variant="primary" size="large" fill onClick={handleExport}>
            Export <Icon name="export" />
          </Button>
        </Sidebar.Section>
      </Sidebar>

      <Preview mapData={mapData} onSceneReady={setScene} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export { App };
