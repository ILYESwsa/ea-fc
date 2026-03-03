import { startGame } from './game-app';

function createMenu(container: HTMLElement, onSelect: (multiplayer: boolean) => void): void {
  const menu = document.createElement('div');
  menu.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:radial-gradient(circle at center,#1a2440,#0b1320);font-family:system-ui,sans-serif;';

  const card = document.createElement('div');
  card.style.cssText = 'background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);padding:20px;border-radius:12px;min-width:320px;color:white;text-align:center;';
  card.innerHTML = '<h2 style="margin-top:0">BloxCraft</h2><p>Choose mode</p>';

  const single = document.createElement('button');
  single.textContent = 'Single Player';
  single.style.cssText = 'width:100%;margin-bottom:10px;padding:10px;border-radius:8px;border:0;background:#3b82f6;color:white;font-weight:700;cursor:pointer;';

  const multi = document.createElement('button');
  multi.textContent = 'Multiplayer';
  multi.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:0;background:#334155;color:white;font-weight:700;cursor:pointer;';

  single.onclick = () => {
    menu.remove();
    onSelect(false);
  };

  multi.onclick = () => {
    menu.remove();
    onSelect(true);
  };

  card.append(single, multi);
  menu.append(card);
  container.append(menu);
}

export function bootstrapClient(): void {
  const app = document.getElementById('app');
  if (!app) return;

  createMenu(app, (multiplayer) => {
    startGame(app, multiplayer).catch((err) => {
      const pre = document.createElement('pre');
      pre.style.color = 'white';
      pre.textContent = `Failed to start client: ${String(err)}`;
      app.append(pre);
    });
  });
}
