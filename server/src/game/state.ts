import { RECIPES, canCraft, type FurnaceJob, type InventoryItem, type MobState, type PlayerState, type WorldSnapshot } from '@bloxcraft/shared';

function addItem(inventory: InventoryItem[], id: string, count: number) {
  const item = inventory.find((slot) => slot.id === id);
  if (item) item.count += count;
  else inventory.push({ id, count });
}

function consumeItem(inventory: InventoryItem[], id: string, count: number) {
  const item = inventory.find((slot) => slot.id === id);
  if (!item || item.count < count) return false;
  item.count -= count;
  return true;
}

export class GameState {
  private tickCounter = 0;
  players = new Map<string, PlayerState>();
  mobs: MobState[] = [];
  furnaces: FurnaceJob[] = [];

  constructor() {
    this.seedMobs();
  }

  private seedMobs() {
    this.mobs = [
      { id: 'mob-z1', type: 'zombie', x: 6, y: 22, z: 6, hp: 20 },
      { id: 'mob-s1', type: 'sheep', x: -9, y: 22, z: 2, hp: 12 },
      { id: 'mob-c1', type: 'cow', x: 12, y: 22, z: -8, hp: 16 }
    ];
  }

  addPlayer(player: PlayerState) {
    this.players.set(player.id, player);
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  updateInput(id: string, keys: string[], yaw: number, pitch: number) {
    const p = this.players.get(id);
    if (!p) return;
    p.yaw = yaw;
    p.pitch = pitch;

    const speed = keys.includes('ShiftLeft') ? 0.34 : 0.22;
    const forward = { x: Math.sin(yaw), z: -Math.cos(yaw) };
    const right = { x: Math.cos(yaw), z: Math.sin(yaw) };

    let dx = 0;
    let dz = 0;
    if (keys.includes('KeyW')) { dx += forward.x; dz += forward.z; }
    if (keys.includes('KeyS')) { dx -= forward.x; dz -= forward.z; }
    if (keys.includes('KeyD')) { dx += right.x; dz += right.z; }
    if (keys.includes('KeyA')) { dx -= right.x; dz -= right.z; }

    const length = Math.hypot(dx, dz) || 1;
    p.position.x += (dx / length) * speed;
    p.position.z += (dz / length) * speed;

    if (p.mode === 'survival') {
      p.stats.hunger = Math.max(0, p.stats.hunger - 0.01);
      if (p.stats.hunger <= 0) p.stats.health = Math.max(0, p.stats.health - 0.02);
    }
  }

  setMode(id: string, mode: 'survival' | 'creative') {
    const p = this.players.get(id);
    if (!p) return;
    p.mode = mode;
    if (mode === 'creative') {
      p.stats.health = 100;
      p.stats.hunger = 100;
    }
  }

  craft(id: string, recipeId: string) {
    const p = this.players.get(id);
    if (!p) return;
    const recipe = RECIPES.find((r: { id: string }) => r.id === recipeId);
    if (!recipe) return;
    if (!canCraft(recipeId, p.inventory)) return;

    for (const ingredient of recipe.ingredients) consumeItem(p.inventory, ingredient.id, ingredient.count);
    addItem(p.inventory, recipe.output.id, recipe.output.count);
  }

  startFurnace(id: string, input: string, fuel: string) {
    const p = this.players.get(id);
    if (!p) return;
    if (!consumeItem(p.inventory, input, 1)) return;
    if (!consumeItem(p.inventory, fuel, 1)) return;

    this.furnaces.push({
      id: crypto.randomUUID(),
      input,
      fuel,
      output: input === 'iron' ? 'iron_ingot' : 'stone',
      progress: 0
    });
  }

  simulate() {
    this.tickCounter += 1;
    for (const mob of this.mobs) {
      mob.x += Math.sin((this.tickCounter + mob.x) * 0.01) * 0.02;
      mob.z += Math.cos((this.tickCounter + mob.z) * 0.012) * 0.02;
    }

    for (const furnace of this.furnaces) {
      furnace.progress = Math.min(1, furnace.progress + 0.01);
      if (furnace.progress >= 1) {
        for (const player of this.players.values()) addItem(player.inventory, furnace.output, 1);
        furnace.progress = 0;
      }
    }
  }

  snapshot(): WorldSnapshot {
    return {
      tick: this.tickCounter,
      players: Object.fromEntries([...this.players.entries()]),
      mobs: this.mobs,
      furnaces: this.furnaces
    };
  }
}
