import { Euler, Vector3 } from "three";
import type { MapHeader } from "../../../types";
import { SCALE } from "./coordinates";

/** Get player start position and rotation from map header */
function createPlayerStart(header: MapHeader) {
  // Position
  const positionX = header.posx * SCALE;
  const positionY = (-header.posz * SCALE) / 16.0;
  const positionZ = header.posy * SCALE;
  const position = new Vector3(positionX, positionY, positionZ);

  // Rotation
  const rotationX = 0;
  const rotationY = -(header.ang / 2048.0) * Math.PI * 2 - Math.PI / 2;
  const rotationZ = 0;
  const rotation = new Euler(rotationX, rotationY, rotationZ);

  return { position, rotation };
}

export { createPlayerStart };
