import type { CraftRecipe } from '../models/game.js';
import type { InventoryItem } from '../models/player.js';

export const RECIPES: CraftRecipe[] = [
  { id: 'planks', output: { id: 'planks', count: 4 }, ingredients: [{ id: 'wood', count: 1 }] },
  { id: 'stick', output: { id: 'stick', count: 4 }, ingredients: [{ id: 'planks', count: 2 }] },
  { id: 'torch', output: { id: 'torch', count: 4 }, ingredients: [{ id: 'coal', count: 1 }, { id: 'stick', count: 1 }] },
  { id: 'bread', output: { id: 'bread', count: 1 }, ingredients: [{ id: 'wheat', count: 3 }] }
];

export function canCraft(recipeId: string, inventory: InventoryItem[]): boolean {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  return recipe.ingredients.every((need) => (inventory.find((item) => item.id === need.id)?.count ?? 0) >= need.count);
}
