export type Vector2 = { x: number; y: number };
export type Color = { r: number; g: number; b: number };

export class Vector3 {
    x: number;

    y: number;

    z: number;

    constructor(inX: number, inY: number, inZ: number) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
    }

    /* Set(inX: number, inY: number, inZ: number) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
    } */

    Set(inVec3: Vector3) {
        this.x = inVec3.x;
        this.y = inVec3.y;
        this.z = inVec3.z;
    }

    Set3(a: number, b: number, c: number) {
        this.x = a;
        this.y = b;
        this.z = c;
    }

    Mul(scale: number) {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
    }

    Negate(inVec: Vector3) {
        this.x -= inVec.x;
        this.y -= inVec.y;
        this.z -= inVec.z;
    }

    Add(inVec: Vector3) {
        this.x += inVec.x;
        this.y += inVec.y;
        this.z += inVec.z;
    }

    Normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (length === 0) {
            // Avoid division by zero
        } else {
            this.x = this.x / length;
            this.y = this.y / length;
            this.z = this.z / length;
        }
    }
}

export function GetVec2(r: number, g: number): Vector2 {
    return { x: r, y: g };
}

export function SetVec2(vec: Vector2, x: number, y: number) {
    vec.x = x;
    vec.y = y;
}

export function GetVec3(r: number, g: number, b: number): Vector3 {
    return new Vector3(r, g, b);
}

export class Matrix4x4 {
    elements: number[][];

    constructor() {
        this.elements = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ];
    }

    // Multiply this matrix by another matrix
    multiply(matrix: Matrix4x4): Matrix4x4 {
        const result = new Matrix4x4();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += this.elements[i][k] * matrix.elements[k][j];
                }
                result.elements[i][j] = sum;
            }
        }
        return result;
    }

    setBasisVectors(basisX: Vector3, basisY: Vector3, basisZ: Vector3) {
        this.elements[0][0] = basisX.x;
        this.elements[0][1] = basisX.y;
        this.elements[0][2] = basisX.z;
        this.elements[1][0] = basisY.x;
        this.elements[1][1] = basisY.y;
        this.elements[1][2] = basisY.z;
        this.elements[2][0] = basisZ.x;
        this.elements[2][1] = basisZ.y;
        this.elements[2][2] = basisZ.z;
    }

    setTranslation(translation: Vector3) {
        this.elements[3][0] = translation.x;
        this.elements[3][1] = translation.y;
        this.elements[3][2] = translation.z;
    }

    getDeterminant(): number {
        const a = this.elements[0][0];
        const b = this.elements[0][1];
        const c = this.elements[0][2];
        const d = this.elements[0][3];
        const e = this.elements[1][0];
        const f = this.elements[1][1];
        const g = this.elements[1][2];
        const h = this.elements[1][3];
        const i = this.elements[2][0];
        const j = this.elements[2][1];
        const k = this.elements[2][2];
        const l = this.elements[2][3];
        const m = this.elements[3][0];
        const n = this.elements[3][1];
        const o = this.elements[3][2];
        const p = this.elements[3][3];

        const det =
            a * f * k * p -
            a * f * l * o -
            a * g * j * p +
            a * g * l * n +
            a * h * j * o -
            a * h * k * n -
            b * e * k * p +
            b * e * l * o +
            b * g * i * p -
            b * g * l * m -
            b * h * i * o +
            b * h * k * m +
            c * e * j * p -
            c * e * l * n -
            c * f * i * p +
            c * f * l * m +
            c * h * i * n -
            c * h * j * m -
            d * e * j * o +
            d * e * k * n +
            d * f * i * o -
            d * f * k * m -
            d * g * i * n +
            d * g * j * m;

        return det;
    }

    toColumnMajorArray(): number[] {
        const result: number[] = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                result.push(this.elements[j][i]); // Transpose and pack into column-major order
            }
        }
        return result;
    }
}

//To avoid heap allocations
export class GStack {
    static readonly TempVec3 = new Vector3(0, 0, 0);

    static readonly TempVec3_2 = new Vector3(0, 0, 0);

    static readonly TempVec3_3 = new Vector3(0, 0, 0);

    static readonly TempVec3_4 = new Vector3(0, 0, 0);
}
