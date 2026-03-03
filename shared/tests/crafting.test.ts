import { describe, expect, test } from 'vitest';
import { canCraft } from '../src/utils/crafting.js';

describe('crafting rules', () => {
  test('allows planks from wood', () => {
    expect(canCraft('planks', [{ id: 'wood', count: 1 }])).toBe(true);
  });

  test('blocks missing ingredient', () => {
    expect(canCraft('torch', [{ id: 'stick', count: 1 }])).toBe(false);
  });
});
