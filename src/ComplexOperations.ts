import { Complex } from './types';
import { Constants } from './types';

export class ComplexOperationsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComplexOperationsError';
  }
}

export class ComplexOperations {
  static add(z1: Complex, z2: Complex): Complex {
    return {
      re: z1.re + z2.re,
      im: z1.im + z2.im
    };
  }

  static subtract(z1: Complex, z2: Complex): Complex {
    return {
      re: z1.re - z2.re,
      im: z1.im - z2.im
    };
  }

  static multiply(z1: Complex, z2: Complex): Complex {
    return {
      re: z1.re * z2.re - z1.im * z2.im,
      im: z1.re * z2.im + z1.im * z2.re
    };
  }

  static divide(z1: Complex, z2: Complex): Complex {
    const denominator = z2.re * z2.re + z2.im * z2.im;
    if (Math.abs(denominator) < Constants.EPSILON) {
      throw new ComplexOperationsError('Division by zero in complex operation');
    }
    return {
      re: (z1.re * z2.re + z1.im * z2.im) / denominator,
      im: (z1.im * z2.re - z1.re * z2.im) / denominator
    };
  }

  static abs(z: Complex): number {
    return Math.sqrt(z.re * z.re + z.im * z.im);
  }

  static conjugate(z: Complex): Complex {
    return {
      re: z.re,
      im: -z.im
    };
  }

  static isInfinite(z: Complex): boolean {
    return Math.abs(z.re) > Constants.INFINITY_THRESHOLD || 
           Math.abs(z.im) > Constants.INFINITY_THRESHOLD;
  }

  static fromReal(x: number): Complex {
    return { re: x, im: 0 };
  }

  static toString(z: Complex): string {
    if (this.isInfinite(z)) {
      return '∞';
    }
    return `${z.re.toFixed(3)} ${z.im >= 0 ? '+' : ''}${z.im.toFixed(3)}i`;
  }
}
