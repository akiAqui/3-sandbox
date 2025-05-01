import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { AppState, Constants } from './types';

export class AnimationController {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  public animate(): void {
    requestAnimationFrame(() => this.animate());
    TWEEN.update();
    this.state.controls.update();
    this.state.renderer.render(this.state.scene, this.state.camera);
  }

  public animateCompareMode(targetMode: boolean): Promise<void> {
    return new Promise((resolve) => {
      if (this.state.isAnimating) {
        resolve();
        return;
      }

      this.state.isAnimating = true;

      const duration = Constants.ANIMATION_DURATION;
      const targetSeparation = targetMode ? Constants.SPHERE_SEPARATION : 0;
      const mergedColor = new THREE.Color(0x800080); // Purple

      // Animate original sphere
      new TWEEN.Tween(this.state.sphereOriginal.position)
        .to({ x: -targetSeparation }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

      // Animate transformed sphere
      const transformedTween = new TWEEN.Tween(this.state.sphereTransformed.position)
        .to({ x: targetSeparation }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut);

      // Grid points animation
      this.state.gridPoints.forEach((points, index) => {
        new TWEEN.Tween(points.position)
          .to({ x: index === 0 ? -targetSeparation : targetSeparation }, duration)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();
      });

      // Contour lines animation
      if (this.state.params.showContours) {
        this.state.contourLines.forEach((line, index) => {
          new TWEEN.Tween(line.position)
            .to({
              x: index < this.state.contourLines.length / 2 ? 
                -targetSeparation : targetSeparation
            }, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
        });
      }

      // Color transition
      this.animateColors(targetMode, duration);

      // Complete the animation
      transformedTween
        .onComplete(() => {
          this.state.isAnimating = false;
          resolve();
        })
        .start();
    });
  }

  private animateColors(compareMode: boolean, duration: number): void {
    const materialOriginal = this.state.sphereOriginal.material as THREE.MeshPhongMaterial;
    const materialTransformed = this.state.sphereTransformed.material as THREE.MeshPhongMaterial;

    const colorOriginal = materialOriginal.color.clone();
    const colorTransformed = materialTransformed.color.clone();
    const targetColor = new THREE.Color(0x800080); // Purple

    if (!compareMode) {
      // Merge colors
      new TWEEN.Tween({ r: colorOriginal.r, g: colorOriginal.g, b: colorOriginal.b })
        .to({
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b
        }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ r, g, b }) => {
          materialOriginal.color.setRGB(r, g, b);
        })
        .start();

      new TWEEN.Tween({ r: colorTransformed.r, g: colorTransformed.g, b: colorTransformed.b })
        .to({
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b
        }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ r, g, b }) => {
          materialTransformed.color.setRGB(r, g, b);
        })
        .start();
    } else {
      // Split colors
      new TWEEN.Tween({ r: colorOriginal.r, g: colorOriginal.g, b: colorOriginal.b })
        .to({
          r: 1, // Red
          g: 0,
          b: 0
        }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ r, g, b }) => {
          materialOriginal.color.setRGB(r, g, b);
        })
        .start();

      new TWEEN.Tween({ r: colorTransformed.r, g: colorTransformed.g, b: colorTransformed.b })
        .to({
          r: 0,
          g: 0,
          b: 1 // Blue
        }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ r, g, b }) => {
          materialTransformed.color.setRGB(r, g, b);
        })
        .start();
    }
  }

  public animateGridPoints(
    sourcePoints: THREE.Vector3[],
    targetPoints: THREE.Vector3[],
    onComplete?: () => void
  ): void {
    const points = sourcePoints.map(p => p.clone());
    const duration = Constants.ANIMATION_DURATION;

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ t }) => {
        points.forEach((point, i) => {
          if (i < targetPoints.length) {
            point.lerp(targetPoints[i], t);
          }
        });
        this.updateGridPointsGeometry(points);
      })
      .onComplete(() => {
        if (onComplete) onComplete();
      })
      .start();
  }

  private updateGridPointsGeometry(points: THREE.Vector3[]): void {
    if (this.state.gridPoints.length > 0) {
      const positions = new Float32Array(points.length * 3);
      points.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });

      this.state.gridPoints.forEach(gridPoints => {
        const geometry = gridPoints.geometry as THREE.BufferGeometry;
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();
      });
    }
  }
}
