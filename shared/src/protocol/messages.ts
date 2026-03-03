import type { ChunkCoord, ChunkData } from '../models/world.js';
import type { PlayerState } from '../models/player.js';
import type { MobState, WorldSnapshot } from '../models/game.js';

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'input'; seq: number; keys: string[]; yaw: number; pitch: number }
  | { type: 'request_chunks'; center: ChunkCoord; radius: number }
  | { type: 'block_place'; x: number; y: number; z: number; block: string }
  | { type: 'block_break'; x: number; y: number; z: number }
  | { type: 'set_mode'; mode: 'survival' | 'creative' }
  | { type: 'craft'; recipeId: string }
  | { type: 'furnace_start'; input: string; fuel: string };

export type ServerMessage =
  | { type: 'welcome'; id: string; snapshot: WorldSnapshot }
  | { type: 'player_joined'; player: PlayerState }
  | { type: 'player_left'; id: string }
  | { type: 'snapshot'; snapshot: WorldSnapshot }
  | { type: 'chunks'; chunks: ChunkData[] }
  | { type: 'chunk_unload'; chunks: ChunkCoord[] }
  | { type: 'mobs'; mobs: MobState[] }
  | { type: 'error'; message: string };
