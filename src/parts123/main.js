import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const viewport = document.getElementById('viewport');

const ui = {
  dirLightIntensity: document.getElementById('dirLightIntensity'),
  ambientIntensity: document.getElementById('ambientIntensity'),
  pointLightColor: document.getElementById('pointLightColor'),
  texturedColor: document.getElementById('texturedColor'),
  status: document.getElementById('status'),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.Fog(0x0f172a, 22, 45);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
camera.position.set(11, 8, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.append(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.5, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, Number(ui.ambientIntensity.value));
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, Number(ui.dirLightIntensity.value));
directionalLight.position.set(9, 13, 8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(ui.pointLightColor.value, 1.2, 60);
pointLight.position.set(-8, 6, 3);
pointLight.castShadow = true;
scene.add(pointLight);

const hemisphere = new THREE.HemisphereLight(0x88ccee, 0x553311, 0.28);
scene.add(hemisphere);

const textureLoader = new THREE.TextureLoader();
const checkerTexture = textureLoader.load('/textures/checker.svg');
checkerTexture.wrapS = THREE.RepeatWrapping;
checkerTexture.wrapT = THREE.RepeatWrapping;
checkerTexture.repeat.set(2, 2);
checkerTexture.colorSpace = THREE.SRGBColorSpace;

function createPlaneGeometry() {
  const vertices = new Float32Array([
    -18, 0, -18,
    18, 0, -18,
    18, 0, 18,
    -18, 0, -18,
    18, 0, 18,
    -18, 0, 18,
  ]);

  const normals = new Float32Array([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ]);

  const uvs = new Float32Array([
    0, 0,
    6, 0,
    6, 6,
    0, 0,
    6, 6,
    0, 6,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

function createPyramidGeometry() {
  const vertices = new Float32Array([
    0, 2.2, 0, -1.3, 0, 1.3, 1.3, 0, 1.3,
    0, 2.2, 0, 1.3, 0, 1.3, 1.3, 0, -1.3,
    0, 2.2, 0, 1.3, 0, -1.3, -1.3, 0, -1.3,
    0, 2.2, 0, -1.3, 0, -1.3, -1.3, 0, 1.3,
    -1.3, 0, 1.3, -1.3, 0, -1.3, 1.3, 0, -1.3,
    -1.3, 0, 1.3, 1.3, 0, -1.3, 1.3, 0, 1.3,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const floor = new THREE.Mesh(
  createPlaneGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95, metalness: 0.03 }),
);
floor.receiveShadow = true;
scene.add(floor);

const texturedCube = new THREE.Mesh(
  new THREE.BoxGeometry(2.5, 2.5, 2.5),
  new THREE.MeshStandardMaterial({
    color: ui.texturedColor.value,
    map: checkerTexture,
    roughness: 0.65,
    metalness: 0.12,
  }),
);
texturedCube.position.set(-4.5, 1.25, -1);
texturedCube.castShadow = true;
texturedCube.receiveShadow = true;
scene.add(texturedCube);

const pyramid = new THREE.Mesh(
  createPyramidGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, metalness: 0.1 }),
);
pyramid.position.set(0.5, 0, -4.2);
pyramid.castShadow = true;
pyramid.receiveShadow = true;
scene.add(pyramid);

const torus = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.1, 0.34, 140, 24),
  new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.4, metalness: 0.45 }),
);
torus.position.set(4.4, 1.8, 2.8);
torus.castShadow = true;
torus.receiveShadow = true;
scene.add(torus);

const grid = new THREE.GridHelper(36, 36, 0x94a3b8, 0x334155);
grid.material.opacity = 0.22;
grid.material.transparent = true;
scene.add(grid);

ui.dirLightIntensity.addEventListener('input', () => {
  directionalLight.intensity = Number(ui.dirLightIntensity.value);
});

ui.ambientIntensity.addEventListener('input', () => {
  ambientLight.intensity = Number(ui.ambientIntensity.value);
});

ui.pointLightColor.addEventListener('input', () => {
  pointLight.color.set(ui.pointLightColor.value);
});

ui.texturedColor.addEventListener('input', () => {
  texturedCube.material.color.set(ui.texturedColor.value);
});

function handleResize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);
handleResize();

ui.status.textContent = 'Часть 1: сцена готова. Управляйте камерой мышью и параметрами света.';

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.003;
  torus.rotation.y += 0.004;

  orbit.update();
  renderer.render(scene, camera);
}

animate();
