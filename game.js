import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const FIELD = { width: 86, depth: 130, line: 0.25, goalWidth: 24, goalDepth: 6 };
const PLAYER_SPEED = 22;
const AI_SPEED = 17;
const BALL_RADIUS = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1221);
scene.fog = new THREE.Fog(0x0b1221, 120, 210);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 70, 82);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xb8c8ff, 0x0e121a, 0.68);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.15);
sun.position.set(40, 68, 32);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
scene.add(sun);

const pitch = new THREE.Mesh(
  new THREE.PlaneGeometry(FIELD.width, FIELD.depth),
  new THREE.MeshStandardMaterial({ color: 0x236d31, roughness: 0.9, metalness: 0.06 })
);
pitch.rotation.x = -Math.PI / 2;
pitch.receiveShadow = true;
scene.add(pitch);

const stripe = new THREE.Mesh(
  new THREE.PlaneGeometry(FIELD.width * 0.98, FIELD.depth * 0.98),
  new THREE.MeshStandardMaterial({ color: 0x2b8039, roughness: 0.88 })
);
stripe.rotation.x = -Math.PI / 2;
stripe.position.y = 0.01;
scene.add(stripe);

const lineMat = new THREE.LineBasicMaterial({ color: 0xeef6ff });
const outline = [
  [-FIELD.width / 2, -FIELD.depth / 2],
  [FIELD.width / 2, -FIELD.depth / 2],
  [FIELD.width / 2, FIELD.depth / 2],
  [-FIELD.width / 2, FIELD.depth / 2],
  [-FIELD.width / 2, -FIELD.depth / 2],
].map(([x, z]) => new THREE.Vector3(x, 0.12, z));
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline), lineMat));
scene.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-FIELD.width / 2, 0.12, 0),
      new THREE.Vector3(FIELD.width / 2, 0.12, 0),
    ]),
    lineMat
  )
);
scene.add(
  new THREE.Mesh(
    new THREE.RingGeometry(11, 11.4, 48),
    new THREE.MeshBasicMaterial({ color: 0xf0f5ff, side: THREE.DoubleSide })
  )
);
scene.children.at(-1).rotation.x = -Math.PI / 2;
scene.children.at(-1).position.y = 0.11;

function createGoal(z) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.3 });
  const netMat = new THREE.MeshStandardMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide });

  const postGeom = new THREE.CylinderGeometry(0.35, 0.35, 4.2, 16);
  const crossbar = new THREE.CylinderGeometry(0.3, 0.3, FIELD.goalWidth, 16);

  const left = new THREE.Mesh(postGeom, postMat);
  const right = new THREE.Mesh(postGeom, postMat);
  const bar = new THREE.Mesh(crossbar, postMat);
  left.position.set(-FIELD.goalWidth / 2, 2.1, z);
  right.position.set(FIELD.goalWidth / 2, 2.1, z);
  bar.position.set(0, 4.1, z);
  bar.rotation.z = Math.PI / 2;

  const net = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.goalWidth, 4), netMat);
  net.position.set(0, 2.1, z + (z > 0 ? -FIELD.goalDepth : FIELD.goalDepth));

  [left, right, bar, net].forEach((m) => {
    m.castShadow = true;
    group.add(m);
  });
  scene.add(group);
}

createGoal(FIELD.depth / 2);
createGoal(-FIELD.depth / 2);

function createPlayer(color) {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.2, 2.1, 7, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.12 })
  );
  body.castShadow = true;
  body.position.y = 2.2;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf2d3b2, roughness: 0.7 })
  );
  head.position.y = 4.4;
  head.castShadow = true;

  const group = new THREE.Group();
  group.add(body, head);
  scene.add(group);
  return group;
}

const player = createPlayer(0x2888ff);
player.position.set(0, 0, 36);

const enemy = createPlayer(0xff4365);
enemy.position.set(0, 0, -34);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_RADIUS, 20, 20),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 })
);
ball.castShadow = true;
ball.position.set(0, BALL_RADIUS, 0);
scene.add(ball);

const ballVel = new THREE.Vector3(0, 0, 0);

const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Space") kick(20);
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") kick(34);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const msgEl = document.getElementById("message");

let score = { home: 0, away: 0 };
let timer = 90;
let gameOver = false;

function flash(text) {
  msgEl.textContent = text;
  msgEl.classList.add("show");
  setTimeout(() => msgEl.classList.remove("show"), 1500);
}

function resetPositions() {
  player.position.set(0, 0, 36);
  enemy.position.set(0, 0, -34);
  ball.position.set(0, BALL_RADIUS, 0);
  ballVel.set(0, 0, 0);
}

function kick(power) {
  if (gameOver) return;
  const distance = player.position.distanceTo(ball.position);
  if (distance < 7) {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    ballVel.addScaledVector(dir, power);
    ballVel.y = 5;
  }
}

function clampToField(entity, radius = 0) {
  entity.position.x = THREE.MathUtils.clamp(entity.position.x, -FIELD.width / 2 + radius, FIELD.width / 2 - radius);
  entity.position.z = THREE.MathUtils.clamp(entity.position.z, -FIELD.depth / 2 + radius, FIELD.depth / 2 - radius);
}

const clock = new THREE.Clock();
let secondAccumulator = 0;

function update() {
  const dt = Math.min(clock.getDelta(), 0.033);

  if (!gameOver) {
    secondAccumulator += dt;
    if (secondAccumulator >= 1) {
      secondAccumulator -= 1;
      timer -= 1;
      timeEl.textContent = `${timer}`;
      if (timer <= 0) {
        gameOver = true;
        flash(score.home === score.away ? "Full Time: Draw" : score.home > score.away ? "Full Time: You Win" : "Full Time: AI Wins");
      }
    }
  }

  const move = new THREE.Vector3(
    Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")),
    0,
    Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp"))
  );

  if (move.lengthSq() > 0 && !gameOver) {
    move.normalize();
    player.position.addScaledVector(move, PLAYER_SPEED * dt);
    player.lookAt(player.position.x + move.x, 0, player.position.z + move.z);
  }

  // Simple AI movement: defend goal then chase ball.
  const target = ball.position.clone();
  if (ball.position.z > -10) {
    target.set(ball.position.x * 0.5, 0, -24);
  }
  const aiMove = target.sub(enemy.position);
  aiMove.y = 0;
  if (aiMove.lengthSq() > 0.2 && !gameOver) {
    aiMove.normalize();
    enemy.position.addScaledVector(aiMove, AI_SPEED * dt);
    enemy.lookAt(enemy.position.x + aiMove.x, 0, enemy.position.z + aiMove.z);
  }

  if (!gameOver && enemy.position.distanceTo(ball.position) < 6.2) {
    const aiShot = new THREE.Vector3(0, 0, 1).applyQuaternion(enemy.quaternion);
    ballVel.addScaledVector(aiShot, 18 * dt * 60);
    ballVel.y = 4;
  }

  clampToField(player, 2.5);
  clampToField(enemy, 2.5);

  if (!gameOver) {
    ballVel.y -= 20 * dt;
    ball.position.addScaledVector(ballVel, dt);

    if (ball.position.y < BALL_RADIUS) {
      ball.position.y = BALL_RADIUS;
      if (ballVel.y < 0) ballVel.y *= -0.34;
      ballVel.x *= 0.992;
      ballVel.z *= 0.992;
    }

    if (Math.abs(ball.position.x) > FIELD.width / 2 - BALL_RADIUS) {
      ball.position.x = THREE.MathUtils.clamp(ball.position.x, -FIELD.width / 2 + BALL_RADIUS, FIELD.width / 2 - BALL_RADIUS);
      ballVel.x *= -0.78;
    }

    // Goal checks.
    const inGoalWidth = Math.abs(ball.position.x) < FIELD.goalWidth / 2;
    if (inGoalWidth && ball.position.z < -FIELD.depth / 2 - 1) {
      score.home += 1;
      scoreEl.textContent = `${score.home} - ${score.away}`;
      flash("GOAL! You scored");
      resetPositions();
    } else if (inGoalWidth && ball.position.z > FIELD.depth / 2 + 1) {
      score.away += 1;
      scoreEl.textContent = `${score.home} - ${score.away}`;
      flash("Goal for AI");
      resetPositions();
    }

    // Keep play near field while letting ball go into goal area.
    if (Math.abs(ball.position.x) >= FIELD.width / 2 - BALL_RADIUS) ballVel.x *= 0.7;
    if (Math.abs(ball.position.z) > FIELD.depth / 2 + FIELD.goalDepth + 2) {
      ball.position.z = THREE.MathUtils.clamp(ball.position.z, -FIELD.depth / 2 - FIELD.goalDepth - 1, FIELD.depth / 2 + FIELD.goalDepth + 1);
      ballVel.z *= -0.7;
    }
  }

  // Dynamic chase camera.
  const camTarget = player.position.clone().add(new THREE.Vector3(0, 30, 42));
  camera.position.lerp(camTarget, 1 - Math.pow(0.00015, dt));
  camera.lookAt(player.position.x * 0.4, 1.2, player.position.z - 28);

  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

update();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
