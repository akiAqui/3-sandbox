import * as THREE from 'three';
import { AppState, TransformParams, Constants } from './types';
import { Scene } from './Scene';
import { GUIController } from './GUI';
import { AnimationController } from './Animation';
import { GridGenerator } from './GridGenerator';
import { ContourGenerator } from './ContourGenerator';
import { MoebiusTransform } from './MoebiusTransform';
import { StereoProjection } from './StereoProjection';

class Application {
  private state: AppState;
  private scene: Scene;
  private gui: GUIController;
  private animation: AnimationController;
  private moebiusTransform: MoebiusTransform;

  constructor() {
    // Initialize base parameters
    const params: TransformParams = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      gridSize: Constants.DEFAULT_GRID_SIZE,
      showContours: false,
      compareMode: true
    };

    // Initialize state with empty objects (will be filled by Scene)
    this.state = {
      scene: null!,
      camera: null!,
      renderer: null!,
      controls: null!,
      gui: null!,
      params,
      sphereOriginal: null!,
      sphereTransformed: null!,
      gridPoints: [],
      contourLines: [],
      isAnimating: false,
      error: null
    };

    // Initialize components
    this.scene = new Scene(this.state);
    this.gui = new GUIController(this.state, () => this.updateVisualization());
    this.animation = new AnimationController(this.state);
    this.moebiusTransform = new MoebiusTransform(params);

    // Start the application
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      window.addEventListener('resize', () => this.handleResize());
      await this.updateVisualization();
      this.animation.animate();
    } catch (error) {
      console.error('Initialization error:', error);
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async updateVisualization(): Promise<void> {
    try {
      // Clear previous error
      this.state.error = null;

      // Get current shape selection
      const shapeSelect = document.getElementById('shape-select') as HTMLSelectElement;
      const selectedShape = shapeSelect.value as any;

      // Generate original points
      const originalPoints = GridGenerator.generatePoints(selectedShape, this.state.params.gridSize);

      // Transform points
      const transformedPoints = originalPoints.map(p => {
        const complex = StereoProjection.projectToPlane(p);
        const transformed = this.moebiusTransform.transform(complex);
        return StereoProjection.projectToSphere(transformed);
      }).filter(p => p !== null) as THREE.Vector3[];

      // Update point visualizations
      this.updatePoints(originalPoints, transformedPoints);

      // Update contours if enabled
      if (this.state.params.showContours) {
        this.updateContours(originalPoints, transformedPoints);
      }

    } catch (error) {
      console.error('Visualization update error:', error);
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private updatePoints(originalPoints: THREE.Vector3[], transformedPoints: THREE.Vector3[]): void {
    // Clear existing points
    this.state.gridPoints.forEach(points => this.state.scene.remove(points));
    this.state.gridPoints = [];

    // Create point visualizations
    const colors = GridGenerator.generateColors(originalPoints.length);
    
    // Add original points
    const originalGeometry = new THREE.BufferGeometry().setFromPoints(originalPoints);
    originalGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
      size: Constants.POINT_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const originalPointsObj = new THREE.Points(originalGeometry, pointsMaterial.clone());
    originalPointsObj.position.copy(this.state.sphereOriginal.position);
    this.state.gridPoints.push(originalPointsObj);
    this.state.scene.add(originalPointsObj);

    // Add transformed points
    if (transformedPoints.length > 0) {
      const transformedGeometry = new THREE.BufferGeometry().setFromPoints(transformedPoints);
      transformedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const transformedPointsObj = new THREE.Points(transformedGeometry, pointsMaterial.clone());
      transformedPointsObj.position.copy(this.state.sphereTransformed.position);
      this.state.gridPoints.push(transformedPointsObj);
      this.state.scene.add(transformedPointsObj);
    }
  }

  private updateContours(originalPoints: THREE.Vector3[], transformedPoints: THREE.Vector3[]): void {
    // Clear existing contours
    this.state.contourLines.forEach(line => this.state.scene.remove(line));
    this.state.contourLines = [];

    // Generate and add new contours
    const originalContours = ContourGenerator.generateContours(originalPoints);
    const transformedContours = ContourGenerator.generateContours(transformedPoints);

    originalContours.forEach(line => {
      line.position.copy(this.state.sphereOriginal.position);
      this.state.contourLines.push(line);
      this.state.scene.add(line);
    });

    transformedContours.forEach(line => {
      line.position.copy(this.state.sphereTransformed.position);
      this.state.contourLines.push(line);
      this.state.scene.add(line);
    });
  }

  private handleResize(): void {
    this.state.camera.aspect = window.innerWidth / window.innerHeight;
    this.state.camera.updateProjectionMatrix();
    this.state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose(): void {
    // Clean up resources
    this.gui.destroy();
    this.scene.dispose();
    window.removeEventListener('resize', () => this.handleResize());
  }
}

// Start the application
const app = new Application();
