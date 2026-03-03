import * as THREE from 'three';
import type { ClientSettings } from '../state/settings';

export interface EngineContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
}

export function createEngine(root: HTMLElement, settings: ClientSettings): EngineContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 80, 360);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: settings.quality !== 'low', powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'high' ? 1.5 : 1.2));
  renderer.shadowMap.enabled = settings.showShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.append(renderer.domElement);

  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(40, 60, 20);
  sun.castShadow = settings.showShadows;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(0xdcefff, 0x85ab6d, 0.6);
  scene.add(hemi);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x3f84d3, transparent: true, opacity: 0.55 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 12;
  scene.add(water);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, sun, hemi };
}
