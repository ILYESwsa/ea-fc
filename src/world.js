import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { BLOCK_SIZE, BLOCK_TYPES, MAX_HEIGHT, SEA_LEVEL, WORLD_SIZE } from "./config.js";

const key = (x, y, z) => `${x},${y},${z}`;
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

  generate() {
    const half = Math.floor(WORLD_SIZE / 2);
    for (let x = -half; x < half; x += 1) {
      for (let z = -half; z < half; z += 1) {
        const ridge = Math.sin((x - z) * 0.04) * 0.6;
        const h = Math.floor(2 + ridge + pseudoNoise(x, z) * MAX_HEIGHT);
        for (let y = 0; y <= h; y += 1) {
          let type = "dirt";
          if (y === h) type = h <= SEA_LEVEL + 1 ? "sand" : "grass";
          if (y < h - 3) type = "stone";
          this.addBlock(x, y, z, type);
        }

        if (Math.random() < 0.018 && h > SEA_LEVEL + 1) {
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
