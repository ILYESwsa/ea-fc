import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { BLOCK_SIZE, BLOCK_TYPES, MAX_HEIGHT, SEA_LEVEL, WORLD_SIZE } from "./config.js";

const key = (x, y, z) => `${x},${y},${z}`;

const blockGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

function pseudoNoise(x, z) {
  const n = Math.sin(x * 0.18) * 0.45 + Math.cos(z * 0.22) * 0.35 + Math.sin((x + z) * 0.09) * 0.2;
  return (n + 1) * 0.5;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.blocks = new Map();
    this.materials = new Map(BLOCK_TYPES.map((t) => [t.id, new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.95 })]));
  }

  generate() {
    const half = Math.floor(WORLD_SIZE / 2);
    for (let x = -half; x < half; x += 1) {
      for (let z = -half; z < half; z += 1) {
        const h = Math.floor(2 + pseudoNoise(x, z) * MAX_HEIGHT);
        for (let y = 0; y <= h; y += 1) {
          let type = "dirt";
          if (y === h) type = h <= SEA_LEVEL + 1 ? "sand" : "grass";
          if (y < h - 3) type = "stone";
          this.addBlock(x, y, z, type);
        }

        if (Math.random() < 0.025 && h > SEA_LEVEL + 1) {
          const trunkHeight = 3 + Math.floor(Math.random() * 2);
          for (let i = 1; i <= trunkHeight; i += 1) {
            this.addBlock(x, h + i, z, "wood");
          }
          for (let lx = -2; lx <= 2; lx += 1) {
            for (let lz = -2; lz <= 2; lz += 1) {
              for (let ly = trunkHeight - 1; ly <= trunkHeight + 1; ly += 1) {
                if (Math.abs(lx) + Math.abs(lz) < 4) {
                  this.addBlock(x + lx, h + ly, z + lz, "grass");
                }
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

    const mesh = new THREE.Mesh(blockGeo, this.materials.get(type));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { x, y, z, type };
    this.scene.add(mesh);
    this.blocks.set(k, mesh);
  }

  removeBlock(x, y, z) {
    const k = key(x, y, z);
    const mesh = this.blocks.get(k);
    if (!mesh) return false;
    this.scene.remove(mesh);
    this.blocks.delete(k);
    return true;
  }

  hasBlock(x, y, z) {
    return this.blocks.has(key(x, y, z));
  }

  getAllMeshes() {
    return Array.from(this.blocks.values());
  }

  getGroundHeight(x, z) {
    for (let y = MAX_HEIGHT + 12; y >= 0; y -= 1) {
      if (this.hasBlock(x, y, z)) return y;
    }
    return -1;
  }
}
