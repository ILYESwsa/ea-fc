import type { PlayerState } from './player.js';

export interface MobState {
  id: string;
  type: 'zombie' | 'sheep' | 'cow';
  x: number;
  y: number;
  z: number;
  hp: number;
}

export interface FurnaceJob {
  id: string;
  input: string;
  fuel: string;
  output: string;
  progress: number;
}

export interface CraftRecipe {
  id: string;
  output: { id: string; count: number };
  ingredients: Array<{ id: string; count: number }>;
}

export interface WorldSnapshot {
  tick: number;
  players: Record<string, PlayerState>;
  mobs: MobState[];
  furnaces: FurnaceJob[];
}
