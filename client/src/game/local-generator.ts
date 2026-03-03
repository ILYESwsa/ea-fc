import type { ChunkData } from '@bloxcraft/shared';

const CHUNK_SIZE = 16;

function biomeAt(wx: number, wz: number): ChunkData['biome'] {
  const v = Math.sin(wx * 0.004) + Math.cos(wz * 0.005);
  if (v > 1) return 'snow';
  if (v > 0.2) return 'forest';
  if (v < -0.7) return 'desert';
  return 'plains';
}

function terrainHeight(wx: number, wz: number): number {
  const n1 = Math.sin(wx * 0.07) * 4;
  const n2 = Math.cos(wz * 0.08) * 3;
  const n3 = Math.sin((wx + wz) * 0.03) * 5;
  return Math.max(4, Math.min(40, Math.floor(18 + n1 + n2 + n3)));
}

export function generateLocalChunk(cx: number, cz: number, lod: 0 | 1 | 2 = 0): ChunkData {
  const blocks: ChunkData['blocks'] = [];
  const biome = biomeAt(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
  const step = lod === 0 ? 1 : lod === 1 ? 2 : 4;

  for (let lx = 0; lx < CHUNK_SIZE; lx += step) {
    for (let lz = 0; lz < CHUNK_SIZE; lz += step) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const top = terrainHeight(wx, wz);
      for (let y = 0; y <= top; y += step) {
        let type = 'stone';
        if (y >= top) type = biome === 'desert' ? 'sand' : 'grass';
        else if (y > top - 4) type = biome === 'desert' ? 'sand' : 'dirt';
        blocks.push({ x: wx, y, z: wz, type });
      }
    }
  }

  return { coord: { x: cx, z: cz }, blocks, lod, biome };
}
