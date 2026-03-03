import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { BLOCK_TYPES, CHUNK_RADIUS, INTERACT_DISTANCE, SEA_LEVEL, WORLD_SIZE } from "./config.js";
import { PlayerController } from "./player.js";
import { UI } from "./ui.js";
import { World } from "./world.js";

const SAVE_KEY = "bloxcraft-save-v2";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 45, 130);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);

document.addEventListener("contextmenu", (e) => e.preventDefault());

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(30, 45, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);
const hemi = new THREE.HemisphereLight(0xdcefff, 0x8fb07f, 0.5);
scene.add(hemi);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD_SIZE * 1.8, WORLD_SIZE * 1.8),
  new THREE.MeshStandardMaterial({ color: 0x3d89d8, transparent: true, opacity: 0.54, roughness: 0.25, metalness: 0.06 })
);
water.rotation.x = -Math.PI / 2;
water.position.y = SEA_LEVEL + 0.35;
scene.add(water);

for (let i = 0; i < 12; i += 1) {
  const cloud = new THREE.Mesh(
    new THREE.BoxGeometry(6 + Math.random() * 8, 1.5 + Math.random() * 1.5, 3 + Math.random() * 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
  );
  cloud.position.set((Math.random() - 0.5) * WORLD_SIZE * 2.2, 22 + Math.random() * 10, (Math.random() - 0.5) * WORLD_SIZE * 2.2);
  scene.add(cloud);
}

const world = new World(scene);
const player = new PlayerController(camera, renderer.domElement, world, scene);
const ui = new UI();
ui.setStatus("Ready");
ui.setSurvival(100, 100);

let selectedSlot = 0;
let selectedBlockType = BLOCK_TYPES[selectedSlot].id;
let gameState = "menu";
let gameMode = "survival";
let loadingTotalChunks = 0;
let currentRenderRadius = CHUNK_RADIUS;
let dayTime = 0.22;
let hunger = 100;
let health = 100;
let inventoryOpen = false;
let saveTimer = 0;

function loadSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState() {
  const payload = {
    player: { x: player.position.x, y: player.position.y, z: player.position.z },
    selectedSlot,
    hunger,
    health,
    dayTime,
    gameMode
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

window.addEventListener("keydown", (e) => {
  if (gameState === "playing" && e.code.startsWith("Digit")) {
    const idx = Number(e.code.replace("Digit", "")) - 1;
    if (idx >= 0 && idx < BLOCK_TYPES.slice(0, 8).length) {
      selectedSlot = idx;
      selectedBlockType = BLOCK_TYPES[idx].id;
      ui.setSelected(idx);
    }
  }

  if (gameState === "playing" && e.code === "KeyE") {
    inventoryOpen = !inventoryOpen;
    ui.toggleInventory(inventoryOpen);
    ui.showCrosshair(!inventoryOpen);
  }

  if (gameState === "playing" && e.code === "F5") {
    player.toggleCameraMode();
  }
});

ui.startBtn.addEventListener("click", () => {
  const selectedRadius = Number(ui.renderDistanceSelect.value || CHUNK_RADIUS);
  gameMode = ui.gameModeSelect.value || "survival";
  ui.setMode(gameMode);
  currentRenderRadius = selectedRadius;

  const saved = loadSavedState();
  const startX = saved?.player?.x ?? 0;
  const startZ = saved?.player?.z ?? 0;

  world.enqueueInitialChunks(startX, startZ, selectedRadius);
  loadingTotalChunks = world.chunkQueue.length;

  if (saved) {
    selectedSlot = saved.selectedSlot ?? selectedSlot;
    selectedBlockType = BLOCK_TYPES[selectedSlot]?.id ?? selectedBlockType;
    hunger = saved.hunger ?? hunger;
    health = saved.health ?? health;
    dayTime = saved.dayTime ?? dayTime;
    gameMode = saved.gameMode ?? gameMode;
    ui.setMode(gameMode);
    ui.setSelected(selectedSlot);
  }

  gameState = "loading";
  ui.beginLoading();
  ui.setStatus(`Loading ${gameMode} world...`);
});

const raycaster = new THREE.Raycaster();
let targetInfo = null;
let targetRefreshTimer = 0;

const targetBox = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.03, 1.03, 1.03)),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
targetBox.visible = false;
scene.add(targetBox);

function updateDayNight(dt) {
  dayTime = (dayTime + dt * 0.007) % 1;
  const angle = dayTime * Math.PI * 2;
  const sunHeight = Math.sin(angle);

  sun.position.set(Math.cos(angle) * 55, Math.max(6, sunHeight * 55), Math.sin(angle) * 30);
  sun.intensity = THREE.MathUtils.clamp(0.2 + Math.max(0, sunHeight) * 1.1, 0.2, 1.3);
  hemi.intensity = THREE.MathUtils.clamp(0.18 + Math.max(0, sunHeight) * 0.6, 0.15, 0.8);

  const skyDay = new THREE.Color(0x87ceeb);
  const skyNight = new THREE.Color(0x0f1830);
  scene.background = skyNight.clone().lerp(skyDay, THREE.MathUtils.clamp((sunHeight + 0.35) / 1.35, 0, 1));
  scene.fog.color.copy(scene.background);
}

function updateTarget(force = false) {
  if (gameState !== "playing" || inventoryOpen) return;
  if (!force && targetRefreshTimer > 0) return;
  targetRefreshTimer = 0.08;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(world.getAllMeshes(), false);
  targetInfo = hits.length ? hits[0] : null;

  if (targetInfo && camera.position.distanceTo(targetInfo.point) <= INTERACT_DISTANCE) {
    targetBox.visible = true;
    targetBox.position.copy(targetInfo.object.position);
    ui.setTargeting(true);
  } else {
    targetBox.visible = false;
    ui.setTargeting(false);
  }
}

function tryBreakBlock() {
  if (!targetInfo) return;
  const p = targetInfo.object.position;
  const px = Math.round(p.x);
  const py = Math.round(p.y);
  const pz = Math.round(p.z);
  if (camera.position.distanceTo(targetInfo.point) > INTERACT_DISTANCE) return;
  world.removeBlock(px, py, pz);
  updateTarget(true);
}

function tryPlaceBlock() {
  if (!targetInfo) return;
  if (camera.position.distanceTo(targetInfo.point) > INTERACT_DISTANCE) return;

  const point = targetInfo.point.clone();
  const normal = targetInfo.face.normal.clone().transformDirection(targetInfo.object.matrixWorld);
  point.addScaledVector(normal, 0.51);

  const x = Math.round(point.x);
  const y = Math.round(point.y);
  const z = Math.round(point.z);

  const nearPlayer =
    Math.abs(x - player.position.x) < 1 &&
    Math.abs(y - (player.position.y + 0.9)) < 2 &&
    Math.abs(z - player.position.z) < 1;

  if (nearPlayer || world.hasBlock(x, y, z)) return;
  world.addBlock(x, y, z, selectedBlockType);
  updateTarget(true);
}

window.addEventListener("mousedown", (e) => {
  if (gameState !== "playing" || inventoryOpen) return;
  if (!player.pointerLocked) {
    player.lock();
    return;
  }
  updateTarget(true);
  if (e.button === 0) tryBreakBlock();
  if (e.button === 2) tryPlaceBlock();
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.033);

  if (gameState === "loading") {
    const done = world.processChunkQueue(2);
    const progress = world.getLoadingProgress();
    ui.updateLoading(progress, world.generatedChunks.size, loadingTotalChunks);
    if (done) {
      const saved = loadSavedState();
      if (saved?.player) player.position.set(saved.player.x, saved.player.y, saved.player.z);
      else {
        const groundHeight = world.getGroundHeight(0, 0);
        player.position.set(0, Math.max(groundHeight + 2, 9), 0);
      }
      ui.finishLoading();
      player.lock();
      gameState = "playing";
      ui.setStatus(`${gameMode} world loaded`);
    }
  }

  if (gameState === "playing") {
    if (!inventoryOpen) player.update(dt);

    world.ensureChunksAround(player.position.x, player.position.z, currentRenderRadius);
    world.processChunkQueue(1);

    targetRefreshTimer -= dt;
    updateTarget();

    updateDayNight(dt);

    if (gameMode === "survival") {
      hunger = Math.max(0, hunger - dt * 0.23);
      if (hunger <= 0) health = Math.max(0, health - dt * 0.9);
      else if (health < 100) health = Math.min(100, health + dt * 0.16);
    } else {
      hunger = 100;
      health = 100;
    }

    ui.setSurvival(health, hunger);
    ui.setStatus(
      `BloxCraft ${gameMode.toUpperCase()} • XYZ ${player.position.x.toFixed(1)} ${player.position.y.toFixed(1)} ${player.position.z.toFixed(1)} • ${selectedBlockType} • Chunks ${world.generatedChunks.size}`
    );

    saveTimer += dt;
    if (saveTimer > 5) {
      saveState();
      saveTimer = 0;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
