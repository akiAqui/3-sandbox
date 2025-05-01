import * as THREE from 'three';
import { ShapeType, Constants } from './types';
import { StereoProjection } from './StereoProjection';

export class GridGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridGeneratorError';
  }
}

export class GridGenerator {
  /**
   * 選択された図形タイプに応じてポイントを生成
   */
  static generatePoints(shapeType: ShapeType, gridSize: number): THREE.Vector3[] {
    try {
      switch (shapeType) {
        case ShapeType.GRID:
          return this.generateGridPoints(gridSize);
        case ShapeType.CIRCLE:
          return this.generateCirclePoints(gridSize);
        case ShapeType.LINE:
          return this.generateLinePoints(gridSize);
        case ShapeType.PARALLEL_VERTICAL:
          return this.generateParallelVerticalPoints(gridSize);
        case ShapeType.PARALLEL_HORIZONTAL:
          return this.generateParallelHorizontalPoints(gridSize);
        case ShapeType.PARALLEL_DIAGONAL:
          return this.generateParallelDiagonalPoints(gridSize);
        case ShapeType.TRIANGLE:
          return this.generateTrianglePoints(gridSize);
        case ShapeType.RECTANGLE:
          return this.generateRectanglePoints(gridSize);
        default:
          throw new GridGeneratorError(`Unknown shape type: ${shapeType}`);
      }
    } catch (error) {
      throw new GridGeneratorError(`Error generating points: ${error.message}`);
    }
  }

  private static generateGridPoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const step = 2 / (gridSize - 1);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = -1 + i * step;
        const y = -1 + j * step;
        const z = this.calculateSphereZ(x, y);
        
        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static generateCirclePoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const radius = 0.8; // 単位球内に収まるように調整

    for (let i = 0; i < gridSize; i++) {
      const angle = (2 * Math.PI * i) / gridSize;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = this.calculateSphereZ(x, y);

      if (Number.isFinite(z)) {
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    return points;
  }

  private static generateLinePoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const start = -0.8;
    const end = 0.8;
    const step = (end - start) / (gridSize - 1);

    for (let i = 0; i < gridSize; i++) {
      const t = start + i * step;
      const x = t;
      const y = 0;
      const z = this.calculateSphereZ(x, y);

      if (Number.isFinite(z)) {
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    return points;
  }

  private static generateParallelVerticalPoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const step = 2 / (gridSize - 1);
    const lineCount = 5;
    const spacing = 1.6 / (lineCount - 1);

    for (let line = 0; line < lineCount; line++) {
      const x = -0.8 + line * spacing;
      for (let i = 0; i < gridSize; i++) {
        const y = -1 + i * step;
        const z = this.calculateSphereZ(x, y);

        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static generateParallelHorizontalPoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const step = 2 / (gridSize - 1);
    const lineCount = 5;
    const spacing = 1.6 / (lineCount - 1);

    for (let line = 0; line < lineCount; line++) {
      const y = -0.8 + line * spacing;
      for (let i = 0; i < gridSize; i++) {
        const x = -1 + i * step;
        const z = this.calculateSphereZ(x, y);

        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static generateParallelDiagonalPoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const lineCount = 5;
    const spacing = 0.4;
    const length = 1.6;
    const steps = gridSize / lineCount;

    for (let line = 0; line < lineCount; line++) {
      const offset = -0.8 + line * spacing;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const x = offset + t * length;
        const y = offset + t * length;
        const z = this.calculateSphereZ(x, y);

        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static generateTrianglePoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const size = 0.8;
    const height = size * Math.sqrt(3) / 2;
    const step = size / Math.floor(Math.sqrt(gridSize));

    for (let i = 0; i * step <= height; i++) {
      const y = -height/2 + i * step;
      const width = (height - Math.abs(y)) * 2 / Math.sqrt(3);
      const xStart = -width/2;
      const xEnd = width/2;
      const xStep = (xEnd - xStart) / Math.floor(width / step);

      for (let x = xStart; x <= xEnd + Constants.EPSILON; x += xStep) {
        const z = this.calculateSphereZ(x, y);
        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static generateRectanglePoints(gridSize: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const width = 0.8;
    const height = 0.6;
    const stepsX = Math.floor(Math.sqrt(gridSize) * width / height);
    const stepsY = Math.floor(Math.sqrt(gridSize));
    const stepX = width / stepsX;
    const stepY = height / stepsY;

    for (let i = 0; i <= stepsX; i++) {
      for (let j = 0; j <= stepsY; j++) {
        const x = -width/2 + i * stepX;
        const y = -height/2 + j * stepY;
        const z = this.calculateSphereZ(x, y);

        if (Number.isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }

  private static calculateSphereZ(x: number, y: number): number {
    const r2 = x * x + y * y;
    if (r2 >= 1) {
      return NaN;
    }
    return Math.sqrt(1 - r2);
  }

  /**
   * グラデーションカラーを生成
   */
  static generateColors(count: number): Float32Array {
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const hue = i / count;
      const color = new THREE.Color();
      color.setHSL(hue, 1.0, 0.5);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return colors;
  }
}
