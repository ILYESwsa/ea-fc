import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { BLOCK_TYPES, INTERACT_DISTANCE, SEA_LEVEL, WORLD_SIZE } from "./config.js";
import { PlayerController } from "./player.js";
import { UI } from "./ui.js";
import { World } from "./world.js";

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
scene.add(new THREE.HemisphereLight(0xdcefff, 0x8fb07f, 0.5));

const world = new World(scene);
world.generate();

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD_SIZE * 1.8, WORLD_SIZE * 1.8),
  new THREE.MeshStandardMaterial({ color: 0x3d89d8, transparent: true, opacity: 0.54, roughness: 0.25, metalness: 0.06 })
);
water.rotation.x = -Math.PI / 2;
water.position.y = SEA_LEVEL + 0.35;
scene.add(water);

for (let i = 0; i < 10; i += 1) {
  const cloud = new THREE.Mesh(
    new THREE.BoxGeometry(6 + Math.random() * 8, 1.5 + Math.random() * 1.5, 3 + Math.random() * 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
  );
  cloud.position.set((Math.random() - 0.5) * WORLD_SIZE * 2, 22 + Math.random() * 10, (Math.random() - 0.5) * WORLD_SIZE * 2);
  scene.add(cloud);
}

const player = new PlayerController(camera, renderer.domElement, world);
const ui = new UI();
ui.setStatus("World ready");

const groundHeight = world.getGroundHeight(0, 8);
player.position.set(0, Math.max(groundHeight + 2, 9), 8);

let selectedBlockType = BLOCK_TYPES[0].id;
window.addEventListener("keydown", (e) => {
  if (e.code.startsWith("Digit")) {
    const idx = Number(e.code.replace("Digit", "")) - 1;
    if (idx >= 0 && idx < BLOCK_TYPES.length) {
      selectedBlockType = BLOCK_TYPES[idx].id;
      ui.setSelected(idx);
    }
  }
});

ui.startBtn.addEventListener("click", () => {
  ui.hideOverlay();
  player.lock();
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

function updateTarget(force = false) {
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
  player.update(dt);
  targetRefreshTimer -= dt;
  updateTarget();

  ui.setStatus(
    `BloxCraft • XYZ ${player.position.x.toFixed(1)} ${player.position.y.toFixed(1)} ${player.position.z.toFixed(1)} • Block ${selectedBlockType}`
  );

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
