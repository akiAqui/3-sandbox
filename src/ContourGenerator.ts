import * as THREE from 'three';
import { Constants } from './types';

export class ContourGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContourGeneratorError';
  }
}

export class ContourGenerator {
  private static readonly CONTOUR_LEVELS = 10;

  static generateContours(points: THREE.Vector3[]): THREE.Line[] {
    try {
      const contours: THREE.Line[] = [];
      if (points.length === 0) return contours;

      // 絶対値の計算
      const values = points.map(p => this.calculateAbsoluteValue(p));
      const validValues = values.filter(v => Number.isFinite(v));
      
      if (validValues.length === 0) return contours;

      const minVal = Math.min(...validValues);
      const maxVal = Math.max(...validValues);
      
      // 等高線のレベルを生成
      const levels = this.generateContourLevels(minVal, maxVal);

      // 各レベルに対して等高線を生成
      levels.forEach(level => {
        const contourPoints = this.generateContourForLevel(points, values, level);
        if (contourPoints.length > 0) {
          const geometry = new THREE.BufferGeometry().setFromPoints(contourPoints);
          const material = new THREE.LineBasicMaterial({ 
            color: this.getContourColor(level, minVal, maxVal),
            transparent: true,
            opacity: Constants.CONTOUR_OPACITY
          });
          contours.push(new THREE.Line(geometry, material));
        }
      });

      return contours;
    } catch (error) {
      throw new ContourGeneratorError(`Error generating contours: ${error.message}`);
    }
  }

  private static calculateAbsoluteValue(point: THREE.Vector3): number {
    return Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
  }

  private static generateContourLevels(min: number, max: number): number[] {
    const levels: number[] = [];
    const step = (max - min) / (this.CONTOUR_LEVELS - 1);
    
    for (let i = 0; i < this.CONTOUR_LEVELS; i++) {
      levels.push(min + step * i);
    }
    return levels;
  }

  private static generateContourForLevel(
    points: THREE.Vector3[],
    values: number[],
    level: number
  ): THREE.Vector3[] {
    const contourPoints: THREE.Vector3[] = [];
    const gridSize = Math.sqrt(points.length);
    
    if (!Number.isInteger(gridSize)) {
      throw new ContourGeneratorError('Points array length must be a perfect square');
    }

    // マーチングスクエアアルゴリズムの実装
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const idx = i * gridSize + j;
        const square = [
          { point: points[idx], value: values[idx] },
          { point: points[idx + 1], value: values[idx + 1] },
          { point: points[idx + gridSize + 1], value: values[idx + gridSize + 1] },
          { point: points[idx + gridSize], value: values[idx + gridSize] }
        ];

        const segments = this.marchingSquares(square, level);
        contourPoints.push(...segments);
      }
    }

    return contourPoints;
  }

  private static marchingSquares(
    square: Array<{ point: THREE.Vector3, value: number }>,
    level: number
  ): THREE.Vector3[] {
    const segments: THREE.Vector3[] = [];
    const case_value = square.reduce((acc, curr, i) => {
      return acc + (curr.value > level ? Math.pow(2, i) : 0);
    }, 0);

    // マーチングスクエアのケースに応じて線分を生成
    const intersections = this.findIntersections(square, level);
    
    switch (case_value) {
      case 1:
      case 14:
        segments.push(intersections[3], intersections[0]);
        break;
      case 2:
      case 13:
        segments.push(intersections[0], intersections[1]);
        break;
      case 3:
      case 12:
        segments.push(intersections[3], intersections[1]);
        break;
      case 4:
      case 11:
        segments.push(intersections[1], intersections[2]);
        break;
      case 6:
      case 9:
        segments.push(intersections[0], intersections[2]);
        break;
      case 7:
      case 8:
        segments.push(intersections[3], intersections[2]);
        break;
      case 5:
        // 鞍点の場合、補間値で分岐を決定
        if (this.interpolateCenter(square) > level) {
          segments.push(intersections[3], intersections[0]);
          segments.push(intersections[1], intersections[2]);
        } else {
          segments.push(intersections[0], intersections[1]);
          segments.push(intersections[2], intersections[3]);
        }
        break;
      case 10:
        // 鞍点の場合、補間値で分岐を決定
        if (this.interpolateCenter(square) > level) {
          segments.push(intersections[0], intersections[1]);
          segments.push(intersections[2], intersections[3]);
        } else {
          segments.push(intersections[3], intersections[0]);
          segments.push(intersections[1], intersections[2]);
        }
        break;
    }

    return segments;
  }

  private static findIntersections(
    square: Array<{ point: THREE.Vector3, value: number }>,
    level: number
  ): THREE.Vector3[] {
    const intersections: THREE.Vector3[] = [];

    // 各辺での交点を計算
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      const p1 = square[i].point;
      const p2 = square[next].point;
      const v1 = square[i].value;
      const v2 = square[next].value;

      if ((v1 > level && v2 <= level) || (v1 <= level && v2 > level)) {
        const t = (level - v1) / (v2 - v1);
        intersections.push(new THREE.Vector3(
          p1.x + t * (p2.x - p1.x),
          p1.y + t * (p2.y - p1.y),
          p1.z + t * (p2.z - p1.z)
        ));
      } else {
        intersections.push(null!);
      }
    }

    return intersections;
  }

  private static interpolateCenter(
    square: Array<{ point: THREE.Vector3, value: number }>
  ): number {
    // セルの中心での値を双線形補間で計算
    const weights = square.map(s => 0.25);
    return square.reduce((sum, s, i) => sum + s.value * weights[i], 0);
  }

  private static getContourColor(level: number, min: number, max: number): THREE.Color {
    const t = (level - min) / (max - min);
    return new THREE.Color().setHSL(t, 1.0, 0.5);
  }
}
