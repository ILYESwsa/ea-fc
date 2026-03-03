import type { ChunkData } from '@bloxcraft/shared';

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 48;

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
  return Math.max(4, Math.min(WORLD_HEIGHT - 1, Math.floor(18 + n1 + n2 + n3)));
}

function isCave(wx: number, y: number, wz: number): boolean {
  const caveNoise = Math.sin(wx * 0.17) + Math.cos(wz * 0.19) + Math.sin(y * 0.3);
  return y < 28 && caveNoise > 1.8;
}

export function generateChunk(cx: number, cz: number, lod: 0 | 1 | 2 = 0): ChunkData {
  const blocks: ChunkData['blocks'] = [];
  const biome = biomeAt(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
  const sampleStep = lod === 0 ? 1 : lod === 1 ? 2 : 4;

  for (let lx = 0; lx < CHUNK_SIZE; lx += sampleStep) {
    for (let lz = 0; lz < CHUNK_SIZE; lz += sampleStep) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const topY = terrainHeight(wx, wz);

      for (let y = 0; y <= topY; y += sampleStep) {
        if (isCave(wx, y, wz)) continue;

        let type = 'stone';
        if (y > topY - 1) {
          if (biome === 'desert') type = 'sand';
          else if (biome === 'snow') type = 'glass';
          else type = 'grass';
        } else if (y > topY - 4) {
          type = biome === 'desert' ? 'sand' : 'dirt';
        } else if (y < 9 && Math.random() < 0.03) {
          type = 'coal';
        } else if (y < 7 && Math.random() < 0.01) {
          type = 'iron';
        }

        blocks.push({ x: wx, y, z: wz, type });
      }
    }
  }

  return { coord: { x: cx, z: cz }, blocks, biome, lod };
}
