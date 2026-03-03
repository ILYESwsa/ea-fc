import type { InventoryItem, PlayerState, ServerMessage } from '@bloxcraft/shared';
import { canCraft, RECIPES } from '@bloxcraft/shared';
import { createEngine } from '../engine/renderer';
import { SocketClient } from '../net/socket-client';
import { loadSettings, saveSettings } from '../state/settings';
import { WorldManager } from './world-manager';
import { Hud } from '../ui/hud';
import { generateLocalChunk } from './local-generator';
import { loadSinglePlayerSave, saveSinglePlayerSave } from './singleplayer-save';

function resolveSocketUrl(): string {
  const envUrl = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_WS_URL;
  if (envUrl) return envUrl;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8080`;
}

function chunkCoord(v: number): number {
  return Math.floor(v / 16);
}

function defaultSinglePlayerInventory(): InventoryItem[] {
  return [
    { id: 'wood', count: 32 },
    { id: 'stone', count: 64 },
    { id: 'torch', count: 16 }
  ];
}

function craftLocally(recipeId: string, inventory: InventoryItem[]): InventoryItem[] {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return inventory;
  if (!canCraft(recipeId, inventory)) return inventory;

  const next = inventory.map((item) => ({ ...item }));

  for (const ingredient of recipe.ingredients) {
    const slot = next.find((item) => item.id === ingredient.id);
    if (!slot) return inventory;
    slot.count -= ingredient.count;
  }

  const filtered = next.filter((item) => item.count > 0);
  const outputSlot = filtered.find((item) => item.id === recipe.output.id);
  if (outputSlot) outputSlot.count += recipe.output.count;
  else filtered.push({ id: recipe.output.id, count: recipe.output.count });

  return filtered;
}

export async function startGame(root: HTMLElement, multiplayer: boolean): Promise<void> {
  const settings = loadSettings();
  const engine = createEngine(root, settings);
  const hud = new Hud(root, settings);
  const world = new WorldManager(engine.scene);
  const socket = new SocketClient();

  let playerId = '';
  let yaw = 0;
  let pitch = 0;
  let position = { x: 0, y: 26, z: 0 };
  let myState: PlayerState | undefined;
  let singlePlayerInventory = defaultSinglePlayerInventory();
  const pressed = new Set<string>();
  let showInventory = false;
  let showCraft = false;
  let showFurnace = false;
  let connected = false;
  const localChunkSet = new Set<string>();

  if (!multiplayer) {
    const save = loadSinglePlayerSave();
    if (save) {
      position = save.position;
      yaw = save.yaw;
      pitch = save.pitch;
      singlePlayerInventory = save.inventory;
      settings.mode = save.mode;
      saveSettings(settings);
    }
  }

  window.addEventListener('keydown', (e) => {
    pressed.add(e.code);
    if (e.code === 'F5') {
      settings.mode = settings.mode === 'creative' ? 'survival' : 'creative';
      if (connected) socket.send({ type: 'set_mode', mode: settings.mode });
      if (!connected) {
        saveSinglePlayerSave({
          position,
          yaw,
          pitch,
          inventory: singlePlayerInventory,
          mode: settings.mode
        });
      }
      saveSettings(settings);
    }
    if (e.code === 'KeyE') {
      showInventory = !showInventory;
      hud.toggleInventory(showInventory);
    }
    if (e.code === 'KeyC') {
      showCraft = !showCraft;
      hud.toggleCraft(showCraft);
    }
    if (e.code === 'KeyB') {
      showFurnace = !showFurnace;
      if (showFurnace && connected) socket.send({ type: 'furnace_start', input: 'iron', fuel: 'coal' });
      hud.toggleFurnace(showFurnace);
    }
  });

  window.addEventListener('keyup', (e) => pressed.delete(e.code));
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== engine.renderer.domElement) return;
    yaw -= e.movementX * 0.002;
    pitch = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.002));
  });
  window.addEventListener('click', () => engine.renderer.domElement.requestPointerLock());
  window.addEventListener('beforeunload', () => {
    if (connected) return;
    saveSinglePlayerSave({
      position,
      yaw,
      pitch,
      inventory: singlePlayerInventory,
      mode: settings.mode
    });
  });

  hud.onCraft((recipe) => {
    if (connected) {
      socket.send({ type: 'craft', recipeId: recipe });
      return;
    }

    const crafted = craftLocally(recipe, singlePlayerInventory);
    if (crafted !== singlePlayerInventory) {
      singlePlayerInventory = crafted;
      hud.updateInventory(singlePlayerInventory);
      saveSinglePlayerSave({
        position,
        yaw,
        pitch,
        inventory: singlePlayerInventory,
        mode: settings.mode
      });
    }
  });

  socket.onMessage((message: ServerMessage) => {
    if (message.type === 'welcome') {
      connected = true;
      playerId = message.id;
      hud.setStatus(`Connected as ${playerId.slice(0, 8)}`);
      socket.send({ type: 'request_chunks', center: { x: 0, z: 0 }, radius: settings.renderDistance });
      socket.send({ type: 'set_mode', mode: settings.mode });
    }

    if (message.type === 'snapshot') {
      myState = message.snapshot.players[playerId];
      if (myState) {
        position = myState.position;
        hud.updateInventory(myState.inventory);
      }
      hud.setStatus(`Players ${Object.keys(message.snapshot.players).length} • Tick ${message.snapshot.tick}`);
      hud.updateMobs(message.snapshot.mobs);
      hud.updateFurnaces(message.snapshot.furnaces);
    }

    if (message.type === 'chunks') world.upsertChunks(message.chunks);
    if (message.type === 'chunk_unload') world.unloadChunks(message.chunks);
    if (message.type === 'mobs') hud.updateMobs(message.mobs);
    if (message.type === 'error') hud.setStatus(`Server error: ${message.message}`);
  });

  if (multiplayer) {
    const wsUrl = resolveSocketUrl();
    hud.setStatus(`Connecting to ${wsUrl} ...`);
    try {
      await socket.connect(wsUrl, `Player-${Math.floor(Math.random() * 9999)}`);
    } catch {
      hud.setStatus(`Multiplayer failed at ${wsUrl}. Falling back to Single Player.`);
      multiplayer = false;
      singlePlayerInventory = defaultSinglePlayerInventory();
    }
  }

  if (!multiplayer) {
    hud.setStatus('Single Player mode');
    hud.updateInventory(singlePlayerInventory);
    hud.updateMobs([]);
    hud.updateFurnaces([]);
  }

  let t = 0;
  let saveCooldown = 0;
  const tick = () => {
    t += 0.0015;
    saveCooldown += 1;
    const day = 0.5 + Math.sin(t) * 0.5;
    engine.sun.intensity = 0.15 + day * 1.2;
    engine.hemi.intensity = 0.2 + day * 0.6;

    if (connected) {
      socket.send({
        type: 'input',
        seq: performance.now(),
        keys: [...pressed],
        yaw,
        pitch
      });
    } else {
      const speed = pressed.has('ShiftLeft') ? 0.35 : 0.2;
      if (pressed.has('KeyW')) {
        position.x += Math.sin(yaw) * speed;
        position.z -= Math.cos(yaw) * speed;
      }
      if (pressed.has('KeyS')) {
        position.x -= Math.sin(yaw) * speed;
        position.z += Math.cos(yaw) * speed;
      }
      if (pressed.has('KeyA')) {
        position.x -= Math.cos(yaw) * speed;
        position.z -= Math.sin(yaw) * speed;
      }
      if (pressed.has('KeyD')) {
        position.x += Math.cos(yaw) * speed;
        position.z += Math.sin(yaw) * speed;
      }
      if (pressed.has('Space')) position.y += speed;

      const cx = chunkCoord(position.x);
      const cz = chunkCoord(position.z);
      const needed = [];
      for (let dx = -settings.renderDistance; dx <= settings.renderDistance; dx++) {
        for (let dz = -settings.renderDistance; dz <= settings.renderDistance; dz++) {
          const nx = cx + dx;
          const nz = cz + dz;
          const key = `${nx},${nz}`;
          if (localChunkSet.has(key)) continue;
          localChunkSet.add(key);
          const dist = Math.max(Math.abs(dx), Math.abs(dz));
          const lod: 0 | 1 | 2 = dist > 2 ? 2 : dist > 1 ? 1 : 0;
          needed.push(generateLocalChunk(nx, nz, lod));
        }
      }
      if (needed.length) world.upsertChunks(needed);

      if (saveCooldown >= 120) {
        saveCooldown = 0;
        saveSinglePlayerSave({
          position,
          yaw,
          pitch,
          inventory: singlePlayerInventory,
          mode: settings.mode
        });
      }
    }

    const camHeight = settings.mode === 'creative' ? 2.1 : 1.7;
    engine.camera.position.set(position.x, position.y + camHeight, position.z);
    engine.camera.rotation.set(pitch, yaw, 0, 'YXZ');
    engine.renderer.render(engine.scene, engine.camera);
    requestAnimationFrame(tick);
  };

  tick();
}
