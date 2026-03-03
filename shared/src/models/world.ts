export type GameMode = 'survival' | 'creative';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ChunkCoord {
  x: number;
  z: number;
}

export interface BlockState {
  x: number;
  y: number;
  z: number;
  type: string;
}

export interface ChunkData {
  coord: ChunkCoord;
  blocks: BlockState[];
  lod: 0 | 1 | 2;
  biome: 'plains' | 'forest' | 'desert' | 'snow';
}
