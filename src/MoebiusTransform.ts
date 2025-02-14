import { Complex, TransformParams } from './types';
import { ComplexOperations, ComplexOperationsError } from './ComplexOperations';
import { Constants } from './types';

export class MoebiusTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoebiusTransformError';
  }
}

export class MoebiusTransform {
  private params: TransformParams;

  constructor(params: TransformParams) {
    this.params = params;
    this.validateParameters();
  }

  private validateParameters(): void {
    const determinant = this.params.a * this.params.d - this.params.b * this.params.c;
    if (Math.abs(determinant) < Constants.EPSILON) {
      throw new MoebiusTransformError('Invalid Mobius transformation: determinant is zero');
    }
  }

  public transform(z: Complex): Complex {
    try {
      // f(z) = (az + b)/(cz + d)
      const numerator = ComplexOperations.add(
        ComplexOperations.multiply(
          ComplexOperations.fromReal(this.params.a),
          z
        ),
        ComplexOperations.fromReal(this.params.b)
      );

      const denominator = ComplexOperations.add(
        ComplexOperations.multiply(
          ComplexOperations.fromReal(this.params.c),
          z
        ),
        ComplexOperations.fromReal(this.params.d)
      );

      return ComplexOperations.divide(numerator, denominator);
    } catch (error) {
      if (error instanceof ComplexOperationsError) {
        throw new MoebiusTransformError('Point maps to infinity');
      }
      throw error;
    }
  }

  public getInverseTransform(): MoebiusTransform {
    // 逆変換のパラメータを計算
    const determinant = this.params.a * this.params.d - this.params.b * this.params.c;
    const inverseParams: TransformParams = {
      a: this.params.d / determinant,
      b: -this.params.b / determinant,
      c: -this.params.c / determinant,
      d: this.params.a / determinant,
      gridSize: this.params.gridSize,
      showContours: this.params.showContours,
      compareMode: this.params.compareMode
    };
    return new MoebiusTransform(inverseParams);
  }

  public isIdentity(): boolean {
    return Math.abs(this.params.a - 1) < Constants.EPSILON &&
           Math.abs(this.params.b) < Constants.EPSILON &&
           Math.abs(this.params.c) < Constants.EPSILON &&
           Math.abs(this.params.d - 1) < Constants.EPSILON;
  }

  public getFixedPoints(): Complex[] {
    // 固定点を計算: (az + b)/(cz + d) = z の解
    // cz2 + (d-a)z - b = 0
    if (Math.abs(this.params.c) < Constants.EPSILON) {
      // c = 0 の場合の特別処理
      if (Math.abs(this.params.a - this.params.d) < Constants.EPSILON) {
        throw new MoebiusTransformError('All points are fixed points');
      }
      return [{
        re: this.params.b / (this.params.a - this.params.d),
        im: 0
      }];
    }

    // 二次方程式を解く
    const p = (this.params.d - this.params.a) / this.params.c;
    const q = -this.params.b / this.params.c;
    const discriminant = p * p - 4 * q;

    if (Math.abs(discriminant) < Constants.EPSILON) {
      return [{ re: -p / 2, im: 0 }];
    }

    if (discriminant > 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      return [
        { re: (-p + sqrtDisc) / 2, im: 0 },
        { re: (-p - sqrtDisc) / 2, im: 0 }
      ];
    }

    const re = -p / 2;
    const im = Math.sqrt(-discriminant) / 2;
    return [
      { re, im },
      { re, im: -im }
    ];
  }

  public getParams(): TransformParams {
    return { ...this.params };
  }

  public updateParams(newParams: Partial<TransformParams>): void {
    this.params = { ...this.params, ...newParams };
    this.validateParameters();
  }
}
