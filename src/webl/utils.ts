import { Vector2, Vector3 } from "./types";

export function showError(errorText: string) {
    console.log(errorText);
}

export function MathGetVectorLength(vec2: Vector2) {
    return Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
}
export function MathClamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}
export function MathVector2Normalize(vec: Vector2) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (length === 0) {
        // Avoid division by zero
        return { x: 0, y: 0 };
    } else {
        return { x: vec.x / length, y: vec.y / length };
    }
}
export function MathVector3Normalize(vec: Vector3) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length === 0) {
        // Avoid division by zero
        return { x: 0, y: 0, z: 0 };
    } else {
        return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
    }
}

export function MathVector3Negate(a: Vector3, b: Vector3) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
export function MathVector3Add(a: Vector3, b: Vector3) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
export function MathVector3Multiply(vec: Vector3, scale: number) {
    return { x: vec.x * scale, y: vec.y * scale, z: vec.z * scale };
}

export function MathMapToRange(t: number, t0: number, t1: number, newt0: number, newt1: number) {
    ///Translate to origin, scale by ranges ratio, translate to new position
    return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
}

export function MathSmoothstep(edge0: number, edge1: number, x: number): number {
    // Scale, and clamp x to 0..1 range
    const t = Math.max(0, Math.min((x - edge0) / (edge1 - edge0), 1));
    // Evaluate polynomial
    return t * t * (3 - 2 * t);
}

export function MathLerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}
export function MathLerpVec3(start: Vector3, end: Vector3, t: number): Vector3 {
    return {
        x: MathLerp(start.x, end.x, t),
        y: MathLerp(start.y, end.y, t),
        z: MathLerp(start.z, end.z, t),
    };
}

export function MathIntersectionSphereSphere(pos1: Vector2, radius1: number, pos2: Vector2, radius2: number) {
    // Assuming spheres are objects with properties x, y, z (center) and radius
    const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));

    return distance <= radius1 + radius2;
}

/* 
Time
*/
export const GTime = {
    Last: 0,
    Cur: 0.01,
    Delta: 0.01,
    DeltaMs: 1,
};
export function GetCurrentTimeSec() {
    return performance.now() / 1000.0;
}
export function UpdateTime() {
    GTime.Cur = GetCurrentTimeSec();
    GTime.Delta = GTime.Cur - GTime.Last;
    GTime.Delta = MathClamp(GTime.Delta, 1.0 / 300.0, 1.0 / 30.0);
    GTime.DeltaMs = GTime.Delta * 1000.0;
    GTime.Last = GTime.Cur;
}
