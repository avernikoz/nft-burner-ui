export type Vector2 = { x: number; y: number };
export type Color = { r: number; g: number; b: number };

//export type Vector3 = { x: number; y: number; z: number };
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
