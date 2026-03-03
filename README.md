# BloxCraft Production-Style Rebuild

This repository now follows a production-style monorepo architecture:

- `client/`: TypeScript + Three.js voxel client (chunk streaming, instancing, LOD, HUD, settings).
- `server/`: Node + WebSocket authoritative multiplayer server (2-10 players baseline).
- `shared/`: Shared protocol, models, and simulation utilities.

## Features implemented
- Multiplayer baseline over WebSocket.
- Chunk streaming with LOD and procedural biomes/caves.
- Survival/Creative modes.
- Inventory + Crafting + Furnace gameplay loop.
- Mobs simulation and day/night dynamics.
- Save/load baseline (server periodic snapshot + client settings persistence).


## Startup mode
On launch, the client now asks for **Single Player** or **Multiplayer**.
- Single Player: no server connection required, with local simulation and local save/load in browser storage.
- Multiplayer: connects to WebSocket server (`ws://<host>:8080` by default).

## Scripts
```bash
npm install
npm run dev
npm run build
npm run test
```

## Phase delivery
See `docs/ROADMAP.md`.

### Client WebSocket endpoint
By default the client connects to `ws://<current-host>:8080`.
Override with:

```bash
VITE_WS_URL=ws://localhost:8080 npm --workspace client run dev
```
