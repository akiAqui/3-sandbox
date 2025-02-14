import * as THREE from 'three';
import { Complex } from './types';
import { Constants } from './types';

export class StereoProjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StereoProjectionError';
  }
}

export class StereoProjection {
  /**
   * リーマン球面上の点を複素平面に投影
   */
  static projectToPlane(point: THREE.Vector3): Complex {
    try {
      // 北極からの投影の場合、z = 1の点は無限遠点に対応
      if (Math.abs(1 - point.z) < Constants.EPSILON) {
        return { re: Infinity, im: Infinity };
      }

      return {
        re: point.x / (1 - point.z),
        im: point.y / (1 - point.z)
      };
    } catch (error) {
      throw new StereoProjectionError('Error in stereographic projection to plane');
    }
  }

  /**
   * 複素平面上の点をリーマン球面に逆投影
   */
  static projectToSphere(z: Complex): THREE.Vector3 {
    try {
      // 無限遠点は北極に対応
      if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) {
        return new THREE.Vector3(0, 0, 1);
      }

      const x2y2 = z.re * z.re + z.im * z.im;
      
      return new THREE.Vector3(
        2 * z.re / (1 + x2y2),
        2 * z.im / (1 + x2y2),
        (x2y2 - 1) / (x2y2 + 1)
      );
    } catch (error) {
      throw new StereoProjectionError('Error in stereographic projection to sphere');
    }
  }

  /**
   * 球面上の2点間の測地線距離を計算
   */
  static sphericalDistance(p1: THREE.Vector3, p2: THREE.Vector3): number {
    try {
      const dot = p1.dot(p2);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      return angle * Constants.SPHERE_RADIUS;
    } catch (error) {
      throw new StereoProjectionError('Error calculating spherical distance');
    }
  }

  /**
   * 球面上の点が有効かチェック
   */
  static isValidSpherePoint(point: THREE.Vector3): boolean {
    // 点が単位球面上にあるかチェック
    const radius = Math.sqrt(
      point.x * point.x + 
      point.y * point.y + 
      point.z * point.z
    );
    return Math.abs(radius - Constants.SPHERE_RADIUS) < Constants.EPSILON;
  }

  /**
   * 複素平面上の点が有効かチェック
   */
  static isValidPlanePoint(z: Complex): boolean {
    return Number.isFinite(z.re) && Number.isFinite(z.im);
  }

  /**
   * 球面上の補間点を生成（測地線に沿って）
   */
  static interpolateOnSphere(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    t: number
  ): THREE.Vector3 {
    try {
      const omega = Math.acos(Math.max(-1, Math.min(1, p1.dot(p2))));
      
      if (Math.abs(omega) < Constants.EPSILON) {
        return p1.clone();
      }

      const sinOmega = Math.sin(omega);
      
      const scale1 = Math.sin((1 - t) * omega) / sinOmega;
      const scale2 = Math.sin(t * omega) / sinOmega;

      const result = new THREE.Vector3()
        .addScaledVector(p1, scale1)
        .addScaledVector(p2, scale2);

      // 数値誤差による僅かなずれを補正
      result.normalize().multiplyScalar(Constants.SPHERE_RADIUS);
      
      return result;
    } catch (error) {
      throw new StereoProjectionError('Error in sphere interpolation');
    }
  }
}
