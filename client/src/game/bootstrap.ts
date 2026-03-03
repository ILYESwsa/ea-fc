import { startGame } from './game-app';

export function bootstrapClient(): void {
  const app = document.getElementById('app');
  if (!app) return;
  startGame(app).catch((err) => {
    const pre = document.createElement('pre');
    pre.style.color = 'white';
    pre.textContent = `Failed to start client: ${String(err)}`;
    app.append(pre);
  });
}
