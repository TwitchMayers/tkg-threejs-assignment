import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const ui = {
  viewport: document.getElementById('labViewport'),
  rInput: document.getElementById('rInput'),
  gInput: document.getElementById('gInput'),
  bInput: document.getElementById('bInput'),
  addPointBtn: document.getElementById('addPointBtn'),
  removePointBtn: document.getElementById('removePointBtn'),
  pointSelect: document.getElementById('pointSelect'),
  deltaTableBody: document.getElementById('deltaTableBody'),
  status: document.getElementById('labStatus'),
};

const REF_X = 0.95047;
const REF_Y = 1.0;
const REF_Z = 1.08883;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1000);
camera.position.set(160, 120, 170);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(ui.viewport.clientWidth, ui.viewport.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
ui.viewport.append(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 45, 0);

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode('translate');
transform.setSize(0.8);
transform.addEventListener('dragging-changed', (event) => {
  orbit.enabled = !event.value;
});
scene.add(transform);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
keyLight.position.set(170, 220, 120);
scene.add(keyLight);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const userPoints = [];
let nextPointId = 1;
let selectedPoint = null;
let pairLines = null;

const pointGeometry = new THREE.SphereGeometry(3.2, 24, 24);

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.style.color = isError ? '#b91c1c' : '#1d4ed8';
}

function srgbChannelToLinear(channel) {
  const value = channel / 255;
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return ((value + 0.055) / 1.055) ** 2.4;
}

function srgbToLab(r, g, b) {
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);

  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041;

  const fx = xyzPivot(x / REF_X);
  const fy = xyzPivot(y / REF_Y);
  const fz = xyzPivot(z / REF_Z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function xyzPivot(t) {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  if (t > epsilon) {
    return Math.cbrt(t);
  }
  return (kappa * t + 16) / 116;
}

function createAxisLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 72px Space Grotesk, Trebuchet MS, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(22, 11, 1);
  return sprite;
}

function createAxes() {
  const axisMaterialA = new THREE.LineBasicMaterial({ color: 0xef4444 });
  const axisMaterialL = new THREE.LineBasicMaterial({ color: 0x22c55e });
  const axisMaterialB = new THREE.LineBasicMaterial({ color: 0x3b82f6 });

  const axisA = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-128, 0, 0),
    new THREE.Vector3(128, 0, 0),
  ]);
  const axisL = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 100, 0),
  ]);
  const axisB = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -128),
    new THREE.Vector3(0, 0, 128),
  ]);

  scene.add(new THREE.Line(axisA, axisMaterialA));
  scene.add(new THREE.Line(axisL, axisMaterialL));
  scene.add(new THREE.Line(axisB, axisMaterialB));

  const labelL = createAxisLabel('L', '#22c55e');
  labelL.position.set(0, 108, 0);

  const labelA = createAxisLabel('a', '#ef4444');
  labelA.position.set(136, 0, 0);

  const labelB = createAxisLabel('b', '#3b82f6');
  labelB.position.set(0, 0, 136);

  scene.add(labelL, labelA, labelB);
}

function createSrgbBoundaryPointCloud() {
  const positions = [];
  const colors = [];

  for (let r = 0; r <= 255; r += 5) {
    for (let g = 0; g <= 255; g += 5) {
      for (let b = 0; b <= 255; b += 5) {
        const onBoundary = r === 0 || r === 255 || g === 0 || g === 255 || b === 0 || b === 255;
        if (!onBoundary) {
          continue;
        }

        const lab = srgbToLab(r, g, b);
        positions.push(lab.a, lab.l, lab.b);
        colors.push(r / 255, g / 255, b / 255);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.65,
    opacity: 0.92,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
}

function clampLabPosition(position) {
  position.x = THREE.MathUtils.clamp(position.x, -128, 128);
  position.y = THREE.MathUtils.clamp(position.y, 0, 100);
  position.z = THREE.MathUtils.clamp(position.z, -128, 128);
}

function selectPoint(point) {
  selectedPoint = point;
  transform.detach();

  if (selectedPoint) {
    transform.attach(selectedPoint.mesh);
    ui.pointSelect.value = selectedPoint.id;
    setStatus(`Выбрана точка ${selectedPoint.label}`);
  } else {
    ui.pointSelect.value = '';
  }
}

function updatePointSelect() {
  const selectedId = selectedPoint?.id ?? '';
  ui.pointSelect.innerHTML = '<option value="">— не выбрана —</option>';

  for (const point of userPoints) {
    const option = document.createElement('option');
    option.value = point.id;
    option.textContent = `${point.label} rgb(${point.rgb.r}, ${point.rgb.g}, ${point.rgb.b})`;
    ui.pointSelect.append(option);
  }

  ui.pointSelect.value = selectedId;
}

function updatePairLinesAndTable() {
  if (pairLines) {
    scene.remove(pairLines);
    pairLines.geometry.dispose();
    pairLines.material.dispose();
    pairLines = null;
  }

  ui.deltaTableBody.innerHTML = '';

  if (userPoints.length < 2) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="2">Добавьте минимум 2 точки</td>';
    ui.deltaTableBody.append(row);
    return;
  }

  const positions = [];
  for (let i = 0; i < userPoints.length; i += 1) {
    for (let j = i + 1; j < userPoints.length; j += 1) {
      const a = userPoints[i];
      const b = userPoints[j];

      positions.push(a.mesh.position.x, a.mesh.position.y, a.mesh.position.z);
      positions.push(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);

      const deltaE = a.mesh.position.distanceTo(b.mesh.position);

      const row = document.createElement('tr');
      row.innerHTML = `<td>${a.label} - ${b.label}</td><td>${deltaE.toFixed(2)}</td>`;
      ui.deltaTableBody.append(row);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  pairLines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
  );
  scene.add(pairLines);
}

function addUserPoint() {
  if (userPoints.length >= 4) {
    setStatus('Можно добавить максимум 4 точки.', true);
    return;
  }

  const read = (input) => {
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      return 0;
    }
    return THREE.MathUtils.clamp(Math.round(value), 0, 255);
  };

  const r = read(ui.rInput);
  const g = read(ui.gInput);
  const b = read(ui.bInput);
  ui.rInput.value = String(r);
  ui.gInput.value = String(g);
  ui.bInput.value = String(b);

  const lab = srgbToLab(r, g, b);
  const id = `p-${nextPointId}`;
  const label = `P${nextPointId}`;
  nextPointId += 1;

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(r / 255, g / 255, b / 255),
    emissive: new THREE.Color(r / 255, g / 255, b / 255).multiplyScalar(0.08),
    roughness: 0.35,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(pointGeometry, material);
  mesh.position.set(lab.a, lab.l, lab.b);
  mesh.userData.pointId = id;

  scene.add(mesh);

  const point = {
    id,
    label,
    rgb: { r, g, b },
    mesh,
  };

  userPoints.push(point);
  updatePointSelect();
  updatePairLinesAndTable();
  selectPoint(point);
  setStatus(`Точка ${label} добавлена.`);
}

function removeSelectedPoint() {
  if (!selectedPoint) {
    setStatus('Сначала выберите точку для удаления.', true);
    return;
  }

  const idx = userPoints.findIndex((point) => point.id === selectedPoint.id);
  if (idx === -1) {
    return;
  }

  const [removed] = userPoints.splice(idx, 1);
  transform.detach();
  scene.remove(removed.mesh);
  removed.mesh.material.dispose();

  selectedPoint = null;
  updatePointSelect();
  updatePairLinesAndTable();
  setStatus('Точка удалена.');
}

function pickPointFromScene(event) {
  if (userPoints.length === 0) {
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(userPoints.map((point) => point.mesh), false);

  if (intersections.length === 0) {
    return;
  }

  const selectedId = intersections[0].object.userData.pointId;
  const point = userPoints.find((entry) => entry.id === selectedId);
  if (point) {
    selectPoint(point);
  }
}

ui.addPointBtn.addEventListener('click', addUserPoint);
ui.removePointBtn.addEventListener('click', removeSelectedPoint);
ui.pointSelect.addEventListener('change', () => {
  const point = userPoints.find((entry) => entry.id === ui.pointSelect.value);
  selectPoint(point ?? null);
});

transform.addEventListener('objectChange', () => {
  if (!selectedPoint) {
    return;
  }

  clampLabPosition(selectedPoint.mesh.position);
  updatePairLinesAndTable();
});

renderer.domElement.addEventListener('pointerdown', pickPointFromScene);

function onResize() {
  const width = ui.viewport.clientWidth;
  const height = ui.viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', onResize);
onResize();

createAxes();
createSrgbBoundaryPointCloud();

const helperGrid = new THREE.GridHelper(280, 28, 0x4b5563, 0x1f2937);
helperGrid.position.y = 0;
helperGrid.material.opacity = 0.26;
helperGrid.material.transparent = true;
scene.add(helperGrid);

setStatus('Добавьте до 4 точек sRGB и перемещайте их в пространстве CIELAB.');
updatePairLinesAndTable();

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}

animate();
