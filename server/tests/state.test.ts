import { describe, expect, test } from 'vitest';
import { GameState } from '../src/game/state.js';

describe('server game state', () => {
  test('switching to creative refills stats', () => {
    const state = new GameState();
    state.addPlayer({
      id: 'p1',
      name: 'tester',
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      mode: 'survival',
      stats: { health: 12, hunger: 2 },
      selectedSlot: 0,
      inventory: []
    });

    state.setMode('p1', 'creative');
    const p = state.snapshot().players.p1;
    expect(p.stats.health).toBe(100);
    expect(p.stats.hunger).toBe(100);
  });
});
