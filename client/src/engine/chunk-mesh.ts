import * as THREE from 'three';
import type { ChunkData } from '@bloxcraft/shared';

const BLOCK_COLORS: Record<string, number> = {
  grass: 0x5ca34a,
  dirt: 0x885a3a,
  stone: 0x8f97a3,
  sand: 0xd7c37b,
  wood: 0xaf7c44,
  glass: 0xa5dff5,
  coal: 0x2b2d32,
  iron: 0xbec5d0
};

export class ChunkMesh {
  group = new THREE.Group();
  coordKey: string;

  constructor(chunk: ChunkData) {
    this.coordKey = `${chunk.coord.x},${chunk.coord.z}`;

    const byType = new Map<string, ChunkData['blocks']>();
    for (const block of chunk.blocks) {
      const list = byType.get(block.type) ?? [];
      list.push(block);
      byType.set(block.type, list);
    }

    const box = new THREE.BoxGeometry(1, 1, 1);
    for (const [type, blocks] of byType.entries()) {
      const mat = new THREE.MeshStandardMaterial({ color: BLOCK_COLORS[type] ?? 0xffffff, roughness: 0.95 });
      const mesh = new THREE.InstancedMesh(box, mat, blocks.length);
      const transform = new THREE.Matrix4();
      blocks.forEach((b, i) => {
        transform.makeTranslation(b.x, b.y, b.z);
        mesh.setMatrixAt(i, transform);
      });
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
