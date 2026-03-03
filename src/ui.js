import { BLOCK_TYPES } from "./config.js";

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
    this.crosshair = document.getElementById("crosshair");
    this.selectedIndex = 0;
    this.slots = [];
    this.buildHotbar();
  }

  buildHotbar() {
    BLOCK_TYPES.forEach((type, i) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = type.symbol;
      if (i === 0) slot.classList.add("active");
      this.hotbarEl.append(slot);
      this.slots.push(slot);
    });
  }

  setSelected(index) {
    this.selectedIndex = index;
    this.slots.forEach((s, i) => s.classList.toggle("active", i === index));
  }

  setStatus(text) {
    this.statusEl.textContent = text;
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
