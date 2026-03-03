import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const EYE_HEIGHT = 1.65;
const PLAYER_RADIUS = 0.32;
const BASE_SPEED = 5.1;
const SPRINT_MULT = 1.55;
const JUMP_FORCE = 6.5;
const GRAVITY = 20;

export class PlayerController {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;

    this.position = new THREE.Vector3(0, 8, 8);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.keys = new Set();
    this.pointerLocked = false;
    this.walkTime = 0;

    this.viewModel = this.createViewModel();
    this.camera.add(this.viewModel);

    this._bindEvents();
  }

  createViewModel() {
    const group = new THREE.Group();
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.35, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.8 })
    );
    sleeve.position.set(0.32, -0.5, -0.65);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf0caa8, roughness: 0.85 })
    );
    hand.position.set(0.32, -0.72, -0.62);

    const tool = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.42, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x8d95a3, roughness: 0.55, metalness: 0.25 })
    );
    tool.position.set(0.42, -0.62, -0.86);
    tool.rotation.z = 0.22;

    group.add(sleeve, hand, tool);
    return group;
  }

  _bindEvents() {
    window.addEventListener("keydown", (e) => this.keys.add(e.code));
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0019;
      this.pitch -= e.movementY * 0.0019;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    });
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  update(dt) {
    const speed = BASE_SPEED * (this.keys.has("ShiftLeft") ? SPRINT_MULT : 1);
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));

    const desired = new THREE.Vector3();
    if (this.keys.has("KeyW")) desired.add(forward);
    if (this.keys.has("KeyS")) desired.sub(forward);
    if (this.keys.has("KeyD")) desired.add(right);
    if (this.keys.has("KeyA")) desired.sub(right);

    if (desired.lengthSq() > 0) {
      desired.normalize().multiplyScalar(speed);
      this.walkTime += dt * 8.2;
    }

    this.velocity.x = desired.x;
    this.velocity.z = desired.z;

    if (this.keys.has("Space") && this.onGround) {
      this.velocity.y = JUMP_FORCE;
      this.onGround = false;
    }

    this.velocity.y -= GRAVITY * dt;

    this.position.x += this.velocity.x * dt;
    this.resolveHorizontalCollision(true);

    this.position.z += this.velocity.z * dt;
    this.resolveHorizontalCollision(false);

    this.position.y += this.velocity.y * dt;
    this.resolveVerticalCollision();

    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");

    const bob = desired.lengthSq() > 0 ? Math.sin(this.walkTime) * 0.018 : 0;
    this.viewModel.position.set(0, bob, 0);
    this.viewModel.rotation.x = bob * 2;
  }

  resolveHorizontalCollision(onXMove) {
    const feetY = Math.floor(this.position.y + 0.1);
    const headY = Math.floor(this.position.y + 1.7);
    const offsets = [-PLAYER_RADIUS, PLAYER_RADIUS];

    for (const ox of offsets) {
      for (const oz of offsets) {
        const bx = Math.floor(this.position.x + ox + 0.5);
        const bz = Math.floor(this.position.z + oz + 0.5);
        if (this.world.hasBlock(bx, feetY, bz) || this.world.hasBlock(bx, headY, bz)) {
          if (onXMove) {
            if (this.velocity.x > 0) this.position.x = bx - 0.5 - PLAYER_RADIUS - 0.001;
            else if (this.velocity.x < 0) this.position.x = bx + 0.5 + PLAYER_RADIUS + 0.001;
            this.velocity.x = 0;
          } else {
            if (this.velocity.z > 0) this.position.z = bz - 0.5 - PLAYER_RADIUS - 0.001;
            else if (this.velocity.z < 0) this.position.z = bz + 0.5 + PLAYER_RADIUS + 0.001;
            this.velocity.z = 0;
          }
        }
      }
    }
  }

  resolveVerticalCollision() {
    const bx = Math.floor(this.position.x + 0.5);
    const bz = Math.floor(this.position.z + 0.5);

    if (this.velocity.y <= 0) {
      const belowY = Math.floor(this.position.y - 0.15);
      if (this.world.hasBlock(bx, belowY, bz)) {
        this.position.y = belowY + 1.001;
        this.velocity.y = 0;
        this.onGround = true;
        return;
      }
    }

    if (this.velocity.y > 0) {
      const aboveY = Math.floor(this.position.y + 1.8);
      if (this.world.hasBlock(bx, aboveY, bz)) {
        this.position.y = aboveY - 1.801;
        this.velocity.y = 0;
      }
    }

    this.onGround = false;
    if (this.position.y < -20) {
      this.position.set(0, 15, 0);
      this.velocity.set(0, 0, 0);
    }
  }
}
