import type { InventoryItem } from '@bloxcraft/shared';

export interface SinglePlayerSave {
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  inventory: InventoryItem[];
  mode: 'survival' | 'creative';
}

const SINGLEPLAYER_SAVE_KEY = 'bloxcraft-singleplayer-save-v1';

export function loadSinglePlayerSave(): SinglePlayerSave | undefined {
  try {
    const raw = localStorage.getItem(SINGLEPLAYER_SAVE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as SinglePlayerSave;
  } catch {
    return undefined;
  }
}

export function saveSinglePlayerSave(save: SinglePlayerSave): void {
  localStorage.setItem(SINGLEPLAYER_SAVE_KEY, JSON.stringify(save));
}
