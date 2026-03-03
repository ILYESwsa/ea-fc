import type * as THREE from 'three';
import type { ChunkData, ChunkCoord } from '@bloxcraft/shared';
import { ChunkMesh } from '../engine/chunk-mesh';

export class WorldManager {
  private scene: THREE.Scene;
  private chunks = new Map<string, ChunkMesh>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  upsertChunks(chunks: ChunkData[]): void {
    for (const chunk of chunks) {
      const key = `${chunk.coord.x},${chunk.coord.z}`;
      if (this.chunks.has(key)) continue;
      const chunkMesh = new ChunkMesh(chunk);
      this.chunks.set(key, chunkMesh);
      this.scene.add(chunkMesh.group);
    }
  }

  unloadChunks(coords: ChunkCoord[]): void {
    for (const coord of coords) {
      const key = `${coord.x},${coord.z}`;
      const chunk = this.chunks.get(key);
      if (!chunk) continue;
      chunk.dispose(this.scene);
      this.chunks.delete(key);
    }
  }
}
