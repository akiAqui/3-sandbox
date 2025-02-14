import GUI from 'lil-gui';
import { AppState, TransformParams, Constants, ShapeType } from './types';
import TWEEN from '@tweenjs/tween.js';

export class GUIController {
  private gui: GUI;
  private state: AppState;
  private onUpdateCallback: () => void;

  constructor(state: AppState, onUpdate: () => void) {
    this.state = state;
    this.gui = new GUI({ container: document.getElementById('gui-container')! });
    this.onUpdateCallback = onUpdate;
    this.initializeGUI();
  }

  private initializeGUI(): void {
    // Transform Parameters Folder
    const transformFolder = this.gui.addFolder('Mobius Transform');
    
    transformFolder.add(this.state.params, 'a', -10, 10, 0.1)
      .name('a')
      .onChange(() => this.handleTransformUpdate());
    
    transformFolder.add(this.state.params, 'b', -10, 10, 0.1)
      .name('b')
      .onChange(() => this.handleTransformUpdate());
    
    transformFolder.add(this.state.params, 'c', -10, 10, 0.1)
      .name('c')
      .onChange(() => this.handleTransformUpdate());
    
    transformFolder.add(this.state.params, 'd', -10, 10, 0.1)
      .name('d')
      .onChange(() => this.handleTransformUpdate());

    // Display Settings Folder
    const displayFolder = this.gui.addFolder('Display Settings');
    
    displayFolder.add(this.state.params, 'gridSize', 10, 1000, 1)
      .name('Grid Size')
      .onChange(() => this.handleGridUpdate());
    
    displayFolder.add(this.state.params, 'showContours')
      .name('Show Contours')
      .onChange(() => this.handleContourUpdate());
    
    displayFolder.add(this.state.params, 'compareMode')
      .name('Compare Mode')
      .onChange(() => this.handleCompareMode());

    // Shape Selection
    this.setupShapeSelection();

    // Preset transformations
    this.addPresetTransforms();
  }

  private setupShapeSelection(): void {
    const shapeSelect = document.getElementById('shape-select') as HTMLSelectElement;
    
    shapeSelect.addEventListener('change', () => {
      this.handleShapeUpdate();
    });
  }

  private addPresetTransforms(): void {
    const presetFolder = this.gui.addFolder('Presets');
    
    const presets = {
      'Identity': () => this.setTransform(1, 0, 0, 1),
      'Translation': () => this.setTransform(1, 1, 0, 1),
      'Rotation': () => this.setTransform(0, -1, 1, 0),
      'Dilation': () => this.setTransform(2, 0, 0, 1),
      'Inversion': () => this.setTransform(0, 1, 1, 0)
    };

    Object.entries(presets).forEach(([name, action]) => {
      presetFolder.add({ preset: action }, 'preset').name(name);
    });
  }

  private setTransform(a: number, b: number, c: number, d: number): void {
    this.state.params.a = a;
    this.state.params.b = b;
    this.state.params.c = c;
    this.state.params.d = d;
    
    // GUI の値を更新
    this.gui.controllers.forEach(controller => {
      controller.updateDisplay();
    });

    this.handleTransformUpdate();
  }

  private handleTransformUpdate(): void {
    try {
      this.onUpdateCallback();
    } catch (error) {
      console.error('Transform update error:', error);
      // エラーメッセージの表示やUI更新など
    }
  }

  private handleGridUpdate(): void {
    try {
      this.onUpdateCallback();
    } catch (error) {
      console.error('Grid update error:', error);
    }
  }

  private handleContourUpdate(): void {
    try {
      this.onUpdateCallback();
    } catch (error) {
      console.error('Contour update error:', error);
    }
  }

  private handleShapeUpdate(): void {
    try {
      this.onUpdateCallback();
    } catch (error) {
      console.error('Shape update error:', error);
    }
  }

  private handleCompareMode(): void {
    if (this.state.isAnimating) return;
    
    this.state.isAnimating = true;
    
    const duration = Constants.ANIMATION_DURATION;
    const targetSeparation = this.state.params.compareMode ? 
      Constants.SPHERE_SEPARATION : 0;

    new TWEEN.Tween({ separation: this.state.sphereOriginal.position.x })
      .to({ separation: -targetSeparation }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ separation }) => {
        this.state.sphereOriginal.position.x = separation;
      })
      .start();

    new TWEEN.Tween({ separation: this.state.sphereTransformed.position.x })
      .to({ separation: targetSeparation }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ separation }) => {
        this.state.sphereTransformed.position.x = separation;
      })
      .onComplete(() => {
        this.state.isAnimating = false;
      })
      .start();
  }

  public destroy(): void {
    this.gui.destroy();
  }
}
