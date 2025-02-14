import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

export type Complex = {
  re: number;
  im: number;
};

export interface TransformParams {
  a: number;
  b: number;
  c: number;
  d: number;
  gridSize: number;
  showContours: boolean;
  compareMode: boolean;
}

export interface AppState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  gui: GUI;
  params: TransformParams;
  sphereOriginal: THREE.Mesh;
  sphereTransformed: THREE.Mesh;
  gridPoints: THREE.Points[];
  contourLines: THREE.Line[];
  isAnimating: boolean;
  error: string | null;
}

export enum ShapeType {
  GRID = 'grid',
  CIRCLE = 'circle',
  LINE = 'line',
  PARALLEL_VERTICAL = 'parallel-vertical',
  PARALLEL_HORIZONTAL = 'parallel-horizontal',
  PARALLEL_DIAGONAL = 'parallel-diagonal',
  TRIANGLE = 'triangle',
  RECTANGLE = 'rectangle'
}

export const Constants = {
  EPSILON: 1e-10,
  INFINITY_THRESHOLD: 1e10,
  ANIMATION_DURATION: 500,
  DEFAULT_GRID_SIZE: 20,
  SPHERE_RADIUS: 1,
  POINT_SIZE: 0.02,
  CONTOUR_OPACITY: 0.5,
  SPHERE_SEPARATION: 2
} as const;
