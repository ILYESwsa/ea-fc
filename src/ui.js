import { BLOCK_TYPES } from "./config.js";

export class UI {
  constructor() {
    this.statusEl = document.getElementById("status");
    this.hotbarEl = document.getElementById("hotbar");
    this.overlay = document.getElementById("start-overlay");
    this.startBtn = document.getElementById("start-btn");
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

  hideOverlay() {
    this.overlay.classList.add("hidden");
  }
}
