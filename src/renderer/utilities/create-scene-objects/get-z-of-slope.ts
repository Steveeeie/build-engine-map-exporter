import type { Sector, Wall } from "../../../types";

/** Get the Z coordinate at a point on a sloped floor or ceiling */
export function getZOfSlope(
  sector: Sector,
  walls: Wall[],
  px: number,
  py: number,
  isCeiling: boolean,
) {
  const heinum = isCeiling ? sector.ceilingheinum : sector.floorheinum;
  const stat = isCeiling ? sector.ceilingstat : sector.floorstat;
  const z = isCeiling ? sector.ceilingz : sector.floorz;

  // Not sloped or no slope value
  if ((stat & 2) === 0 || heinum === 0) return z;

  // Get the first wall to determine slope direction
  if (sector.wallptr < 0 || sector.wallptr >= walls.length) return z;

  const wal = walls[sector.wallptr];

  if (wal.point2 < 0 || wal.point2 >= walls.length) return z;

  const wal2 = walls[wal.point2];
  const dx = wal2.x - wal.x;
  const dy = wal2.y - wal.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) return z;

  const len = Math.sqrt(lengthSq);
  const perpDist = dx * (py - wal.y) - dy * (px - wal.x);

  return z + Math.floor((heinum * perpDist) / (len * 32) / 8);
}
