import { BLOCK_TYPES, ITEM_TYPES } from "./config.js";

export class UI {
  constructor() {
    this.statusEl = document.getElementById("status");
    this.hotbarEl = document.getElementById("hotbar");
    this.overlay = document.getElementById("start-overlay");
    this.menuCard = document.getElementById("menu-card");
    this.loadingCard = document.getElementById("loading-card");
    this.loadingBar = document.getElementById("loading-bar");
    this.loadingText = document.getElementById("loading-text");
    this.startBtn = document.getElementById("start-btn");
    this.renderDistanceSelect = document.getElementById("render-distance");
    this.gameModeSelect = document.getElementById("game-mode");
    this.crosshair = document.getElementById("crosshair");

    this.healthFill = document.getElementById("health-fill");
    this.hungerFill = document.getElementById("hunger-fill");
    this.survivalBars = document.getElementById("survival-bars");
    this.inventoryPanel = document.getElementById("inventory");
    this.inventoryGrid = document.getElementById("inventory-grid");

    this.selectedIndex = 0;
    this.slots = [];
    this.buildHotbar();
    this.buildInventory();
  }

  buildHotbar() {
    BLOCK_TYPES.slice(0, 8).forEach((type, i) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.innerHTML = `${type.symbol}<small>∞</small>`;
      if (i === 0) slot.classList.add("active");
      this.hotbarEl.append(slot);
      this.slots.push(slot);
    });
  }

  buildInventory() {
    this.inventoryGrid.innerHTML = "";
    ITEM_TYPES.forEach((type) => {
      const item = document.createElement("div");
      item.className = "inv-slot";
      item.textContent = `${type.id.toUpperCase()} (${type.symbol})`;
      this.inventoryGrid.append(item);
    });
  }

  toggleInventory(show) {
    this.inventoryPanel.classList.toggle("hidden", !show);
  }

  setMode(mode) {
    this.survivalBars.classList.toggle("hidden", mode === "creative");
  }

  setSelected(index) {
    this.selectedIndex = index;
    this.slots.forEach((s, i) => s.classList.toggle("active", i === index));
  }

  setStatus(text) {
    this.statusEl.textContent = text;
  }

  setSurvival(health, hunger) {
    this.healthFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
    this.hungerFill.style.width = `${Math.max(0, Math.min(100, hunger))}%`;
  }

  setTargeting(active) {
    this.crosshair.classList.toggle("targeting", active);
  }

  showCrosshair(show) {
    this.crosshair.classList.toggle("visible", show);
  }

  beginLoading() {
    this.menuCard.classList.add("hidden");
    this.loadingCard.classList.remove("hidden");
  }

  updateLoading(progress, loaded, total) {
    this.loadingBar.style.width = `${Math.floor(progress * 100)}%`;
    this.loadingText.textContent = `Generating chunks ${loaded}/${total}`;
  }

  finishLoading() {
    this.overlay.classList.add("hidden");
    this.showCrosshair(true);
  }
}
