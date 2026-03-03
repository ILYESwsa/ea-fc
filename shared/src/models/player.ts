import type { GameMode, Vec3 } from './world.js';

export interface PlayerStats {
  health: number;
  hunger: number;
}

export interface InventoryItem {
  id: string;
  count: number;
}

export interface PlayerState {
  id: string;
  name: string;
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
  mode: GameMode;
  stats: PlayerStats;
  selectedSlot: number;
  inventory: InventoryItem[];
}
