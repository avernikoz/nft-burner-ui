export type Vector2 = { x: number; y: number };
export type Vector3 = { x: number; y: number; z: number };
export type Color = { r: number; g: number; b: number };

export function GetVec2(r = 1.0, g = 1.0): Vector2 {
    return { x: r, y: g };
}
export function GetVec3(r = 1.0, g = 1.0, b = 1.0): Vector3 {
    return { x: r, y: g, z: b };
}
