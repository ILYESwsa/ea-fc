import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const EYE_HEIGHT = 1.65;
const PLAYER_RADIUS = 0.32;
const BASE_SPEED = 5.5;
const SPRINT_MULT = 1.7;
const JUMP_FORCE = 6.8;
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

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener("keydown", (e) => this.keys.add(e.code));
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0021;
      this.pitch -= e.movementY * 0.0021;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    });
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  update(dt) {
    const speed = BASE_SPEED * (this.keys.has("ShiftLeft") ? SPRINT_MULT : 1);
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const desired = new THREE.Vector3();
    if (this.keys.has("KeyW")) desired.add(forward);
    if (this.keys.has("KeyS")) desired.sub(forward);
    if (this.keys.has("KeyD")) desired.add(right);
    if (this.keys.has("KeyA")) desired.sub(right);

    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed);
    this.velocity.x = desired.x;
    this.velocity.z = desired.z;

    if (this.keys.has("Space") && this.onGround) {
      this.velocity.y = JUMP_FORCE;
      this.onGround = false;
    }

    this.velocity.y -= GRAVITY * dt;

    this.position.x += this.velocity.x * dt;
    this.resolveHorizontalCollision();

    this.position.z += this.velocity.z * dt;
    this.resolveHorizontalCollision();

    this.position.y += this.velocity.y * dt;
    this.resolveVerticalCollision();

    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  resolveHorizontalCollision() {
    const feetY = Math.floor(this.position.y + 0.1);
    const headY = Math.floor(this.position.y + 1.7);
    const samples = [
      [this.position.x + PLAYER_RADIUS, this.position.z],
      [this.position.x - PLAYER_RADIUS, this.position.z],
      [this.position.x, this.position.z + PLAYER_RADIUS],
      [this.position.x, this.position.z - PLAYER_RADIUS],
    ];

    for (const [sx, sz] of samples) {
      const bx = Math.round(sx);
      const bz = Math.round(sz);
      if (this.world.hasBlock(bx, feetY, bz) || this.world.hasBlock(bx, headY, bz)) {
        const dx = this.position.x - bx;
        const dz = this.position.z - bz;
        if (Math.abs(dx) > Math.abs(dz)) {
          this.position.x = bx + Math.sign(dx) * (0.5 + PLAYER_RADIUS + 0.001);
        } else {
          this.position.z = bz + Math.sign(dz) * (0.5 + PLAYER_RADIUS + 0.001);
        }
      }
    }
  }

  resolveVerticalCollision() {
    const bx = Math.round(this.position.x);
    const bz = Math.round(this.position.z);

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
