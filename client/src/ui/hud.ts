import type { ClientSettings } from '../state/settings';
import type { FurnaceJob, InventoryItem, MobState } from '@bloxcraft/shared';

export class Hud {
  private root: HTMLDivElement;
  private status: HTMLDivElement;
  private inventoryPanel: HTMLDivElement;
  private recipePanel: HTMLDivElement;
  private furnacePanel: HTMLDivElement;
  private inventoryContent: HTMLPreElement;
  private mobContent: HTMLPreElement;

  constructor(parent: HTMLElement, settings: ClientSettings) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;color:#fff;font-family:system-ui,sans-serif;';

    const top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:12px;left:12px;background:rgba(0,0,0,.45);padding:8px 10px;border-radius:8px';
    top.innerHTML = `<b>BloxCraft ${settings.mode.toUpperCase()}</b><br/>WASD • Shift • Space • E inventory • C craft • B furnace`;

    this.status = document.createElement('div');
    this.status.style.cssText = 'position:absolute;top:12px;right:12px;background:rgba(0,0,0,.45);padding:8px 10px;border-radius:8px';
    this.status.textContent = 'Connecting...';

    const crosshair = document.createElement('div');
    crosshair.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:24px;';
    crosshair.textContent = '+';

    this.inventoryPanel = document.createElement('div');
    this.inventoryPanel.style.cssText = 'position:absolute;left:20px;bottom:20px;background:rgba(0,0,0,.55);padding:10px;border-radius:8px;pointer-events:auto;display:none;min-width:240px;';
    this.inventoryPanel.innerHTML = '<b>Inventory</b>';
    this.inventoryContent = document.createElement('pre');
    this.inventoryContent.style.margin = '6px 0 0';
    this.inventoryPanel.append(this.inventoryContent);

    this.recipePanel = document.createElement('div');
    this.recipePanel.style.cssText = 'position:absolute;left:280px;bottom:20px;background:rgba(0,0,0,.55);padding:10px;border-radius:8px;pointer-events:auto;display:none;';
    this.recipePanel.innerHTML = '<b>Craft</b><br/><button data-r="planks">Planks</button> <button data-r="torch">Torch</button>';

    this.furnacePanel = document.createElement('div');
    this.furnacePanel.style.cssText = 'position:absolute;left:420px;bottom:20px;background:rgba(0,0,0,.55);padding:10px;border-radius:8px;pointer-events:auto;display:none;min-width:220px;';
    this.furnacePanel.innerHTML = '<b>Furnace</b><pre style="margin:6px 0 0;" id="furnace-jobs"></pre>';

    this.mobContent = document.createElement('pre');
    this.mobContent.style.cssText = 'position:absolute;right:12px;top:64px;background:rgba(0,0,0,.45);padding:8px;border-radius:8px;';
    this.mobContent.textContent = 'Mobs: 0';

    this.root.append(top, this.status, crosshair, this.inventoryPanel, this.recipePanel, this.furnacePanel, this.mobContent);
    parent.append(this.root);
  }

  onCraft(handler: (recipe: string) => void): void {
    this.recipePanel.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => handler((btn as HTMLButtonElement).dataset.r || ''));
    });
  }

  setStatus(text: string): void {
    this.status.textContent = text;
  }

  toggleInventory(show: boolean): void {
    this.inventoryPanel.style.display = show ? 'block' : 'none';
  }

  toggleCraft(show: boolean): void {
    this.recipePanel.style.display = show ? 'block' : 'none';
  }

  toggleFurnace(show: boolean): void {
    this.furnacePanel.style.display = show ? 'block' : 'none';
  }

  updateInventory(items: InventoryItem[]): void {
    this.inventoryContent.textContent = items.slice(0, 16).map((i) => `${i.id.padEnd(10)} x${i.count}`).join('\n');
  }

  updateFurnaces(jobs: FurnaceJob[]): void {
    const el = this.furnacePanel.querySelector('#furnace-jobs') as HTMLPreElement;
    el.textContent = jobs.map((j) => `${j.input}->${j.output} ${(j.progress * 100).toFixed(0)}%`).join('\n') || 'No active jobs';
  }

  updateMobs(mobs: MobState[]): void {
    this.mobContent.textContent = `Mobs: ${mobs.length}`;
  }
}
