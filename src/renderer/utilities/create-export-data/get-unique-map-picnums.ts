import type { MapData } from "@/types";

function getUniqueMapPicnums(mapData: MapData) {
  const usedPicnums = new Set<number>();

  for (const sector of mapData.sectors) {
    usedPicnums.add(sector.ceilingpicnum);
    usedPicnums.add(sector.floorpicnum);
  }

  for (const wall of mapData.walls) {
    usedPicnums.add(wall.picnum);

    if (wall.overpicnum) usedPicnums.add(wall.overpicnum);
  }

  for (const sprite of mapData.sprites) {
    usedPicnums.add(sprite.picnum);
  }

  return [...usedPicnums];
}

export { getUniqueMapPicnums };
