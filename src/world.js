import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { BLOCK_SIZE, BLOCK_TYPES, CHUNK_SIZE, MAX_HEIGHT, SEA_LEVEL } from "./config.js";

const key = (x, y, z) => `${x},${y},${z}`;
const chunkKey = (cx, cz) => `${cx},${cz}`;
const blockGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

const topGrass = new THREE.MeshStandardMaterial({ color: 0x69b84d, roughness: 0.95 });
const sideGrass = new THREE.MeshStandardMaterial({ color: 0x4d8f3c, roughness: 0.95 });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.98 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8d95a3, roughness: 0.9 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0xb07b45, roughness: 0.9 });
const sandMat = new THREE.MeshStandardMaterial({ color: 0xd8c57f, roughness: 0.9 });

function pseudoNoise(x, z) {
  const n = Math.sin(x * 0.16) * 0.5 + Math.cos(z * 0.2) * 0.28 + Math.sin((x + z) * 0.08) * 0.22;
  return (n + 1) * 0.5;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.blocks = new Map();
    this.meshList = [];
    this.generatedChunks = new Set();
    this.chunkQueue = [];
    this.materials = new Map(BLOCK_TYPES.map((t) => [t.id, new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.95 })]));
  }

  getMaterialFor(type) {
    if (type === "grass") return [sideGrass, sideGrass, topGrass, dirtMat, sideGrass, sideGrass];
    if (type === "dirt") return dirtMat;
    if (type === "stone") return stoneMat;
    if (type === "wood") return woodMat;
    if (type === "sand") return sandMat;
    return this.materials.get("dirt");
  }

  enqueueInitialChunks(centerX, centerZ, radius) {
    const centerChunkX = Math.floor(centerX / CHUNK_SIZE);
    const centerChunkZ = Math.floor(centerZ / CHUNK_SIZE);
    this.chunkQueue = [];

    for (let ring = 0; ring <= radius; ring += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        for (let dz = -ring; dz <= ring; dz += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
          const cx = centerChunkX + dx;
          const cz = centerChunkZ + dz;
          const ck = chunkKey(cx, cz);
          if (!this.generatedChunks.has(ck)) this.chunkQueue.push({ cx, cz });
        }
      }
    }
  }

  processChunkQueue(maxChunksPerFrame = 1) {
    let processed = 0;
    while (processed < maxChunksPerFrame && this.chunkQueue.length > 0) {
      const next = this.chunkQueue.shift();
      this.generateChunk(next.cx, next.cz);
      processed += 1;
    }
    return this.chunkQueue.length === 0;
  }

  getLoadingProgress() {
    const total = this.generatedChunks.size + this.chunkQueue.length;
    if (total === 0) return 0;
    return this.generatedChunks.size / total;
  }

  generateChunk(cx, cz) {
    const ck = chunkKey(cx, cz);
    if (this.generatedChunks.has(ck)) return;

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    for (let x = startX; x < startX + CHUNK_SIZE; x += 1) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z += 1) {
        const ridge = Math.sin((x - z) * 0.04) * 0.6;
        const h = Math.floor(2 + ridge + pseudoNoise(x, z) * MAX_HEIGHT);
        for (let y = 0; y <= h; y += 1) {
          let type = "dirt";
          if (y === h) type = h <= SEA_LEVEL + 1 ? "sand" : "grass";
          if (y < h - 3) type = "stone";
          this.addBlock(x, y, z, type);
        }

        if (Math.random() < 0.015 && h > SEA_LEVEL + 1) {
          const trunkHeight = 3 + Math.floor(Math.random() * 2);
          for (let i = 1; i <= trunkHeight; i += 1) this.addBlock(x, h + i, z, "wood");
          for (let lx = -2; lx <= 2; lx += 1) {
            for (let lz = -2; lz <= 2; lz += 1) {
              for (let ly = trunkHeight - 1; ly <= trunkHeight + 1; ly += 1) {
                const crown = Math.abs(lx) + Math.abs(lz) + Math.abs(ly - trunkHeight);
                if (crown <= 4) this.addBlock(x + lx, h + ly, z + lz, "grass");
              }
            }
          }
        }
      }
    }

    this.generatedChunks.add(ck);
  }

  addBlock(x, y, z, type) {
    const k = key(x, y, z);
    if (this.blocks.has(k)) return;

    const mesh = new THREE.Mesh(blockGeo, this.getMaterialFor(type));
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.userData = { x, y, z, type };
    this.scene.add(mesh);
    this.blocks.set(k, mesh);
    this.meshList.push(mesh);
  }

  removeBlock(x, y, z) {
    const k = key(x, y, z);
    const mesh = this.blocks.get(k);
    if (!mesh) return false;
    this.scene.remove(mesh);
    this.blocks.delete(k);
    const i = this.meshList.indexOf(mesh);
    if (i !== -1) this.meshList.splice(i, 1);
    return true;
  }

  hasBlock(x, y, z) {
    return this.blocks.has(key(x, y, z));
  }

  getAllMeshes() {
    return this.meshList;
  }

  getGroundHeight(x, z) {
    for (let y = MAX_HEIGHT + 14; y >= 0; y -= 1) {
      if (this.hasBlock(x, y, z)) return y;
    }
    return -1;
  }
}
