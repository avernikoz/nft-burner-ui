export type Vector2 = { x: number; y: number };
export type Color = { r: number; g: number; b: number };

//export type Vector3 = { x: number; y: number; z: number };
export class Vector3 {
    x: number;

    y: number;

    z: number;

    constructor(inX = 1.0, inY = 1.0, inZ = 0.0) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
    }

    Set(inX = 1.0, inY = 1.0, inZ = 0.0) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
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
}

export function GetVec2(r = 1.0, g = 1.0): Vector2 {
    return { x: r, y: g };
}
export function GetVec3(r: number, g: number, b: number): Vector3 {
    return new Vector3(r, g, b);
}
