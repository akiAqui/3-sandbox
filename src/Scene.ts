import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, Constants } from './types';

export class Scene {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
    this.initScene();
    this.setupLights();
    this.createRiemannSpheres();
    this.setupEventListeners();
  }

  private initScene(): void {
    // シーンの初期化
    this.state.scene = new THREE.Scene();
    this.state.scene.background = new THREE.Color(0x000000);

    // カメラの設定
    this.state.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.state.camera.position.set(0, 0, 5);

    // レンダラーの設定
    this.state.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.state.renderer.setSize(window.innerWidth, window.innerHeight);
    this.state.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.state.renderer.domElement);

    // OrbitControlsの設定
    this.state.controls = new OrbitControls(
      this.state.camera,
      this.state.renderer.domElement
    );
    this.state.controls.enableDamping = true;
    this.state.controls.dampingFactor = 0.05;
  }

  private setupLights(): void {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.state.scene.add(ambientLight);

    // 指向性光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.state.scene.add(directionalLight);

    // 半球光源
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    this.state.scene.add(hemisphereLight);
  }

  private createRiemannSpheres(): void {
    const geometry = new THREE.SphereGeometry(
      Constants.SPHERE_RADIUS,
      32,
      32
    );

    // 元の球面（赤）
    const materialOriginal = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });

    // 変換後の球面（青）
    const materialTransformed = new THREE.MeshPhongMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });

    this.state.sphereOriginal = new THREE.Mesh(geometry, materialOriginal);
    this.state.sphereTransformed = new THREE.Mesh(geometry, materialTransformed);

    // 初期位置の設定
    this.state.sphereOriginal.position.x = -Constants.SPHERE_SEPARATION;
    this.state.sphereTransformed.position.x = Constants.SPHERE_SEPARATION;

    // グリッドヘルパーの追加（デバッグ用）
    if (process.env.NODE_ENV === 'development') {
      const gridHelper = new THREE.GridHelper(10, 10);
      gridHelper.rotation.x = Math.PI / 2;
      this.state.scene.add(gridHelper);
    }

    this.state.scene.add(this.state.sphereOriginal);
    this.state.scene.add(this.state.sphereTransformed);
  }

  public animate(): void {
    requestAnimationFrame(() => this.animate());
    this.state.controls.update();
    this.state.renderer.render(this.state.scene, this.state.camera);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  private onWindowResize(): void {
    this.state.camera.aspect = window.innerWidth / window.innerHeight;
    this.state.camera.updateProjectionMatrix();
    this.state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public getState(): AppState {
    return this.state;
  }

  public updateSpheresOpacity(opacity: number): void {
    (this.state.sphereOriginal.material as THREE.MeshPhongMaterial).opacity = opacity;
    (this.state.sphereTransformed.material as THREE.MeshPhongMaterial).opacity = opacity;
  }

  public updateSpheresColor(color: THREE.Color): void {
    (this.state.sphereOriginal.material as THREE.MeshPhongMaterial).color = color;
    (this.state.sphereTransformed.material as THREE.MeshPhongMaterial).color = color;
  }

  public resetSpheresColor(): void {
    (this.state.sphereOriginal.material as THREE.MeshPhongMaterial).color = new THREE.Color(0xff0000);
    (this.state.sphereTransformed.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x0000ff);
  }

  public dispose(): void {
    // リソースの解放
    this.state.renderer.dispose();
    this.state.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
