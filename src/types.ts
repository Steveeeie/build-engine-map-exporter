export interface MapHeader {
  version: number;
  posx: number;
  posy: number;
  posz: number;
  ang: number;
  cursectnum: number;
}

export interface Sector {
  wallptr: number;
  wallnum: number;
  ceilingz: number;
  floorz: number;
  ceilingstat: number;
  floorstat: number;
  ceilingpicnum: number;
  ceilingheinum: number;
  ceilingshade: number;
  ceilingpal: number;
  ceilingxpanning: number;
  ceilingypanning: number;
  floorpicnum: number;
  floorheinum: number;
  floorshade: number;
  floorpal: number;
  floorxpanning: number;
  floorypanning: number;
  visibility: number;
  filler: number;
  lotag: number;
  hitag: number;
  extra: number;
}

export interface Wall {
  x: number;
  y: number;
  point2: number;
  nextwall: number;
  nextsector: number;
  cstat: number;
  picnum: number;
  overpicnum: number;
  shade: number;
  pal: number;
  xrepeat: number;
  yrepeat: number;
  xpanning: number;
  ypanning: number;
  lotag: number;
  hitag: number;
  extra: number;
}

export interface Sprite {
  x: number;
  y: number;
  z: number;
  cstat: number;
  picnum: number;
  shade: number;
  pal: number;
  clipdist: number;
  filler: number;
  xrepeat: number;
  yrepeat: number;
  xoffset: number;
  yoffset: number;
  sectnum: number;
  statnum: number;
  ang: number;
  owner: number;
  xvel: number;
  yvel: number;
  zvel: number;
  lotag: number;
  hitag: number;
  extra: number;
}

export interface Texture {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface MapData {
  header: MapHeader;
  sectors: Sector[];
  walls: Wall[];
  sprites: Sprite[];
  textures: Record<number, Texture>;
}

export interface GRPImportResult {
  grpFileName: string;
  mapFileNames: string[];
}

export interface OutputFolderResult {
  outputFolderPath: string;
}

export interface ExportData {
  outputFolder: string;
  mapName: string;
  objContent: string;
  mtlContent: string;
  picnums: number[];
}

export interface ElectronAPI {
  importGRP: () => Promise<GRPImportResult | null>;
  selectOutputFolder: () => Promise<OutputFolderResult | null>;
  loadMap: (mapFileName: string) => Promise<MapData>;
  exportMap: (exportData: ExportData) => Promise<void>;
}
