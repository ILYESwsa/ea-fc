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

## Scripts
```bash
npm install
npm run dev
npm run build
npm run test
```

## Phase delivery
See `docs/ROADMAP.md`.
