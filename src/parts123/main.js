import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const viewport = document.getElementById('viewport');
const dropHint = document.getElementById('dropHint');

const ui = {
  dirLightIntensity: document.getElementById('dirLightIntensity'),
  ambientIntensity: document.getElementById('ambientIntensity'),
  pointLightColor: document.getElementById('pointLightColor'),
  texturedColor: document.getElementById('texturedColor'),
  modelInput: document.getElementById('modelInput'),
  objectList: document.getElementById('objectList'),
  status: document.getElementById('status'),
  posX: document.getElementById('posX'),
  posY: document.getElementById('posY'),
  posZ: document.getElementById('posZ'),
  rotX: document.getElementById('rotX'),
  rotY: document.getElementById('rotY'),
  rotZ: document.getElementById('rotZ'),
  scaleX: document.getElementById('scaleX'),
  scaleY: document.getElementById('scaleY'),
  scaleZ: document.getElementById('scaleZ'),
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

const transform = new TransformControls(camera, renderer.domElement);
transform.setSize(0.8);
transform.addEventListener('dragging-changed', (event) => {
  orbit.enabled = !event.value;
});
scene.add(transform);

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

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(36, 36, 40, 40),
  new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95, metalness: 0.03 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

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

const glslMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      float wave = sin(position.y * 6.0 + uTime * 3.0) * 0.18;
      vec3 displaced = position + normal * wave;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vec3 c1 = vec3(0.16, 0.80, 0.95);
      vec3 c2 = vec3(0.98, 0.44, 0.20);
      float stripes = 0.5 + 0.5 * sin(vUv.y * 42.0 + vWave * 11.0);
      vec3 color = mix(c1, c2, stripes);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const glslSphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 64, 64), glslMaterial);
glslSphere.position.set(0, 2.2, 0.3);
glslSphere.castShadow = true;
glslSphere.receiveShadow = true;
scene.add(glslSphere);

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

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

const uploadedModels = [];
let nextModelId = 1;
let selectedModel = null;
let syncingTransformInputs = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.style.color = isError ? '#b91c1c' : '#1d4ed8';
}

function updateObjectList() {
  const previousValue = ui.objectList.value;
  ui.objectList.innerHTML = '<option value="">— выберите объект —</option>';

  for (const model of uploadedModels) {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    ui.objectList.append(option);
  }

  if (uploadedModels.some((model) => model.id === previousValue)) {
    ui.objectList.value = previousValue;
  } else {
    ui.objectList.value = selectedModel?.userData.modelId ?? '';
  }
}

function findModelById(id) {
  return uploadedModels.find((model) => model.id === id);
}

function updateTransformInputsFromSelection() {
  if (!selectedModel) {
    const ids = ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ', 'scaleX', 'scaleY', 'scaleZ'];
    for (const id of ids) {
      ui[id].value = '';
    }
    return;
  }

  syncingTransformInputs = true;
  ui.posX.value = selectedModel.position.x.toFixed(2);
  ui.posY.value = selectedModel.position.y.toFixed(2);
  ui.posZ.value = selectedModel.position.z.toFixed(2);

  ui.rotX.value = THREE.MathUtils.radToDeg(selectedModel.rotation.x).toFixed(1);
  ui.rotY.value = THREE.MathUtils.radToDeg(selectedModel.rotation.y).toFixed(1);
  ui.rotZ.value = THREE.MathUtils.radToDeg(selectedModel.rotation.z).toFixed(1);

  ui.scaleX.value = selectedModel.scale.x.toFixed(2);
  ui.scaleY.value = selectedModel.scale.y.toFixed(2);
  ui.scaleZ.value = selectedModel.scale.z.toFixed(2);
  syncingTransformInputs = false;
}

function setSelectedModel(model) {
  selectedModel = model;
  transform.detach();

  if (selectedModel) {
    transform.attach(selectedModel);
    ui.objectList.value = selectedModel.userData.modelId;
    setStatus(`Выбрана модель: ${selectedModel.userData.displayName}`);
  } else {
    ui.objectList.value = '';
  }

  updateTransformInputsFromSelection();
}

function applyTransformInputs() {
  if (!selectedModel || syncingTransformInputs) {
    return;
  }

  const parse = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  selectedModel.position.set(
    parse(ui.posX.value, selectedModel.position.x),
    parse(ui.posY.value, selectedModel.position.y),
    parse(ui.posZ.value, selectedModel.position.z),
  );

  selectedModel.rotation.set(
    THREE.MathUtils.degToRad(parse(ui.rotX.value, THREE.MathUtils.radToDeg(selectedModel.rotation.x))),
    THREE.MathUtils.degToRad(parse(ui.rotY.value, THREE.MathUtils.radToDeg(selectedModel.rotation.y))),
    THREE.MathUtils.degToRad(parse(ui.rotZ.value, THREE.MathUtils.radToDeg(selectedModel.rotation.z))),
  );

  selectedModel.scale.set(
    Math.max(0.1, parse(ui.scaleX.value, selectedModel.scale.x)),
    Math.max(0.1, parse(ui.scaleY.value, selectedModel.scale.y)),
    Math.max(0.1, parse(ui.scaleZ.value, selectedModel.scale.z)),
  );
}

function normalizeAndPlaceModel(root, index) {
  root.traverse((child) => {
    if (!child.isMesh) {
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        if (material && 'envMapIntensity' in material) {
          material.envMapIntensity = 1.1;
        }
      });
    } else if (child.material && 'envMapIntensity' in child.material) {
      child.material.envMapIntensity = 1.1;
    }
  });

  const initialBox = new THREE.Box3().setFromObject(root);
  const size = initialBox.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 1e-4);
  const targetSize = 3.4;
  root.scale.multiplyScalar(targetSize / maxAxis);

  const shiftedBox = new THREE.Box3().setFromObject(root);
  const center = shiftedBox.getCenter(new THREE.Vector3());
  root.position.sub(center);

  const adjusted = new THREE.Box3().setFromObject(root);
  const minY = adjusted.min.y;
  root.position.y -= minY;

  const col = index % 3;
  const row = Math.floor(index / 3);
  root.position.x += -3 + col * 3;
  root.position.z += 3 + row * 3;
}

function registerModel(root, displayName) {
  const id = `model-${nextModelId++}`;
  root.userData.modelId = id;
  root.userData.displayName = displayName;

  normalizeAndPlaceModel(root, uploadedModels.length);
  scene.add(root);
  uploadedModels.push({ id, name: displayName, root });

  updateObjectList();
  setSelectedModel(root);
  setStatus(`Модель загружена: ${displayName}`);
}

async function loadFile(file) {
  if (!file) {
    return;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['obj', 'glb'].includes(extension)) {
    setStatus('Поддерживаются только .obj и .glb', true);
    return;
  }

  try {
    if (extension === 'obj') {
      const text = await file.text();
      const object = objLoader.parse(text);
      registerModel(object, file.name);
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    gltfLoader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        registerModel(gltf.scene, file.name);
      },
      (error) => {
        setStatus(`Ошибка чтения GLB: ${error?.message ?? 'неизвестно'}`, true);
      },
    );
  } catch (error) {
    setStatus(`Не удалось загрузить файл: ${error.message}`, true);
  }
}

function handleDropZone() {
  let dragCounter = 0;

  window.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragCounter += 1;
    dropHint.classList.add('visible');
  });

  window.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  window.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragCounter -= 1;
    if (dragCounter <= 0) {
      dropHint.classList.remove('visible');
      dragCounter = 0;
    }
  });

  window.addEventListener('drop', (event) => {
    event.preventDefault();
    dragCounter = 0;
    dropHint.classList.remove('visible');

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      loadFile(file);
    }
  });
}

function selectModelFromClick(event) {
  if (uploadedModels.length === 0) {
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const roots = uploadedModels.map((model) => model.root);
  const intersections = raycaster.intersectObjects(roots, true);

  if (intersections.length === 0) {
    return;
  }

  let current = intersections[0].object;
  while (current && !current.userData.modelId) {
    current = current.parent;
  }

  if (current?.userData.modelId) {
    const model = findModelById(current.userData.modelId);
    if (model) {
      setSelectedModel(model.root);
    }
  }
}

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

ui.modelInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    await loadFile(file);
  }
  ui.modelInput.value = '';
});

ui.objectList.addEventListener('change', () => {
  const model = findModelById(ui.objectList.value);
  setSelectedModel(model ? model.root : null);
});

for (const button of document.querySelectorAll('[data-transform-mode]')) {
  button.addEventListener('click', () => {
    transform.setMode(button.dataset.transformMode);
  });
}

const transformInputs = [
  ui.posX,
  ui.posY,
  ui.posZ,
  ui.rotX,
  ui.rotY,
  ui.rotZ,
  ui.scaleX,
  ui.scaleY,
  ui.scaleZ,
];

for (const input of transformInputs) {
  input.addEventListener('input', applyTransformInputs);
}

transform.addEventListener('objectChange', () => {
  updateTransformInputsFromSelection();
});

renderer.domElement.addEventListener('pointerdown', selectModelFromClick);

function handleResize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);
handleDropZone();
handleResize();

setStatus('Загрузите .obj или .glb модель, затем выберите объект для трансформации.');

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  glslMaterial.uniforms.uTime.value = elapsed;

  torus.rotation.x += 0.003;
  torus.rotation.y += 0.004;

  orbit.update();
  renderer.render(scene, camera);
}

animate();
