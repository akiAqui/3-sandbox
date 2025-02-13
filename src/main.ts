import * as THREE from 'three';
import { Complex, complex } from 'mathjs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

// シーン、カメラ、レンダラーの作成
const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);

// メビウス変換のパラメータ
const params = {
  a: 1, b: 2, c: 3, d: 4,
};

// メビウス変換関数
function mobiusTransform(z: Complex, a: Complex, b: Complex, c: Complex, d: Complex): Complex {
  const denominator = c.mul(z).add(d);
  if (denominator.abs() < 1e-6) return complex(0, 0); // ゼロ除算回避
  return a.mul(z).add(b).div(denominator);
}

// メッシュの作成/?
const gridSize: number = 50;
const range: number = 5;
const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

function generateMesh(): void {
  geometry.dispose(); // 古いバッファを解放
  const vertices: number[] = [];
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      let x = (i / gridSize) * range;
      let y = (j / gridSize) * range;
      let z = complex(x, y);
      let w = mobiusTransform(complex(x, y), complex(params.a, 0), complex(params.b, 0), complex(params.c, 0), complex(params.d, 0));
      if (Number.isFinite(w.re) && Number.isFinite(w.im)) {
        vertices.push(w.re, w.im, w.abs());
      }
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  geometry.needsUpdate = true;
}

generateMesh();

const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x88ccff, side: THREE.DoubleSide, wireframe: true });
const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

const gui: GUI = new GUI();
gui.add(params, 'a', -10, 10).onChange(generateMesh);
gui.add(params, 'b', -10, 10).onChange(generateMesh);
gui.add(params, 'c', -10, 10).onChange(generateMesh);
gui.add(params, 'd', -10, 10).onChange(generateMesh);

gui.add(camera.position, 'z', 1, 20).name('Zoom');

function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', (event: Event): void => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

