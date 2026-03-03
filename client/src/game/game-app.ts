import type { PlayerState, ServerMessage } from '@bloxcraft/shared';
import { createEngine } from '../engine/renderer';
import { SocketClient } from '../net/socket-client';
import { loadSettings, saveSettings } from '../state/settings';
import { WorldManager } from './world-manager';
import { Hud } from '../ui/hud';

export async function startGame(root: HTMLElement): Promise<void> {
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
  const pressed = new Set<string>();
  let showInventory = false;
  let showCraft = false;
  let showFurnace = false;

  window.addEventListener('keydown', (e) => {
    pressed.add(e.code);
    if (e.code === 'F5') {
      settings.mode = settings.mode === 'creative' ? 'survival' : 'creative';
      socket.send({ type: 'set_mode', mode: settings.mode });
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
      if (showFurnace) socket.send({ type: 'furnace_start', input: 'iron', fuel: 'coal' });
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

  hud.onCraft((recipe) => {
    socket.send({ type: 'craft', recipeId: recipe });
  });

  await socket.connect('ws://localhost:8080', `Player-${Math.floor(Math.random() * 9999)}`);

  socket.onMessage((message: ServerMessage) => {
    if (message.type === 'welcome') {
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
  });

  let t = 0;
  const tick = () => {
    t += 0.0015;
    const day = 0.5 + Math.sin(t) * 0.5;
    engine.sun.intensity = 0.15 + day * 1.2;
    engine.hemi.intensity = 0.2 + day * 0.6;

    socket.send({
      type: 'input',
      seq: performance.now(),
      keys: [...pressed],
      yaw,
      pitch
    });

    const camHeight = settings.mode === 'creative' ? 2.1 : 1.7;
    engine.camera.position.set(position.x, position.y + camHeight, position.z);
    engine.camera.rotation.set(pitch, yaw, 0, 'YXZ');
    engine.renderer.render(engine.scene, engine.camera);
    requestAnimationFrame(tick);
  };

  tick();
}
