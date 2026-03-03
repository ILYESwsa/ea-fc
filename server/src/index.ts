import { createRealtimeServer } from './net/ws-server.js';
import { SaveStore } from './persistence/save-store.js';

const port = Number(process.env.PORT || 8080);
const store = new SaveStore('server-data/world-save.json');
const { state } = createRealtimeServer(port);

setInterval(() => {
  store.save(state.snapshot());
}, 5000);

console.log(`[bloxcraft-server] websocket server running on ws://localhost:${port}`);
