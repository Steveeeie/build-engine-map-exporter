import { useEffect, useRef } from "react";
import { PerspectiveCamera, WebGLRenderer, Scene } from "three";
import type { MapData } from "../../../types";
import { createSceneObjects } from "../../utilities/create-scene-objects";
import { Icon } from "../icon";
import { FlyControls } from "./fly-controls";
import styles from "./preview.module.css";

interface PreviewProps {
  mapData: MapData | null;
  onSceneReady: (scene: Scene | null) => void;
}

function Preview({ mapData, onSceneReady }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !mapData) {
      return;
    }

    const canvas = canvasRef.current;
    const container = canvas.parentElement!;

    // Scene Objects
    const { sectorMeshes, spriteMeshes, skySphereMesh, playerStart } =
      createSceneObjects(mapData);

    // Renderer
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Camera
    const camera = new PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      10000,
    );

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);
    camera.position.copy(playerStart.position);
    camera.rotation.copy(playerStart.rotation);

    // Controls
    const controls = new FlyControls(canvas, camera);

    // Scene
    const scene = new Scene();

    // Skybox
    if (skySphereMesh) {
      scene.add(skySphereMesh);
    }

    // Sectors
    sectorMeshes.forEach((mesh) => scene.add(mesh));

    // Sprites
    spriteMeshes.forEach((mesh) => scene.add(mesh));

    // Pass scene to parent for export
    onSceneReady(scene);

    function animate() {
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      controls.dispose();
      onSceneReady?.(null);
    };
  }, [mapData, onSceneReady]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.preview} />

      {mapData && (
        <div className={styles.controls}>
          <div className={styles.control}>
            <Icon size="tiny" name="move" />
            <strong>Forward / Back:</strong> Scroll
          </div>

          <div className={styles.control}>
            <Icon size="tiny" name="rotate" />
            <strong>Rotate:</strong> Click & Drag
          </div>
        </div>
      )}
    </div>
  );
}

export { Preview };
