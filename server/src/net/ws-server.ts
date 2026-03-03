import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientMessage, PlayerState, ServerMessage } from '@bloxcraft/shared';
import { GameState } from '../game/state.js';
import { generateChunk } from '../game/chunk-generator.js';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
}

function send(ws: WebSocket, msg: ServerMessage) {
  ws.send(JSON.stringify(msg));
}

export function createRealtimeServer(port = 8080) {
  const state = new GameState();
  const wss = new WebSocketServer({ port });
  const clients = new Map<string, ConnectedClient>();

  wss.on('connection', (ws) => {
    let clientId = '';

    ws.on('message', (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(String(raw)) as ClientMessage;
      } catch {
        send(ws, { type: 'error', message: 'Bad message format' });
        return;
      }

      if (message.type === 'join') {
        clientId = crypto.randomUUID();
        const player: PlayerState = {
          id: clientId,
          name: message.name,
          position: { x: 0, y: 24, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          yaw: 0,
          pitch: 0,
          mode: 'survival',
          stats: { health: 100, hunger: 100 },
          selectedSlot: 0,
          inventory: [
            { id: 'wood', count: 16 },
            { id: 'dirt', count: 32 },
            { id: 'stone', count: 16 }
          ]
        };

        state.addPlayer(player);
        clients.set(clientId, { id: clientId, ws });
        send(ws, { type: 'welcome', id: clientId, snapshot: state.snapshot() });
        for (const other of clients.values()) {
          if (other.id !== clientId) send(other.ws, { type: 'player_joined', player });
        }
        return;
      }

      if (!clientId) return;

      switch (message.type) {
        case 'input':
          state.updateInput(clientId, message.keys, message.yaw, message.pitch);
          break;
        case 'set_mode':
          state.setMode(clientId, message.mode);
          break;
        case 'request_chunks': {
          const chunks = [];
          for (let dx = -message.radius; dx <= message.radius; dx++) {
            for (let dz = -message.radius; dz <= message.radius; dz++) {
              const dist = Math.max(Math.abs(dx), Math.abs(dz));
              const lod = dist > 2 ? 2 : dist > 1 ? 1 : 0;
              chunks.push(generateChunk(message.center.x + dx, message.center.z + dz, lod));
            }
          }
          send(ws, { type: 'chunks', chunks });
          break;
        }
        case 'craft':
          state.craft(clientId, message.recipeId);
          break;
        case 'furnace_start':
          state.startFurnace(clientId, message.input, message.fuel);
          break;
        default:
          break;
      }
    });

    ws.on('close', () => {
      if (!clientId) return;
      state.removePlayer(clientId);
      clients.delete(clientId);
      for (const c of clients.values()) send(c.ws, { type: 'player_left', id: clientId });
    });
  });

  const interval = setInterval(() => {
    state.simulate();
    const snap = state.snapshot();
    for (const client of clients.values()) {
      send(client.ws, { type: 'snapshot', snapshot: snap });
      send(client.ws, { type: 'mobs', mobs: snap.mobs });
    }
  }, 50);

  wss.on('close', () => clearInterval(interval));

  return { wss, state };
}
