import { Color, Vector2, Vector3 } from "./types";

export function showError(errorText: string) {
    console.log(errorText);
}

export function MathAlignToPowerOf2(num: number): number {
    return Math.pow(2, Math.ceil(Math.log2(num)));
}

export function MathGetVectorLength(vec2: Vector2) {
    return Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
}
export function MathClamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function MathSignedMax(value: number, max: number) {
    if (value < 0.0) {
        return Math.min(value, -max);
    } else {
        return Math.max(value, max);
    }
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
export function MathLerpVec2(start: Vector2, end: Vector2, t: number): Vector2 {
    return {
        x: MathLerp(start.x, end.x, t),
        y: MathLerp(start.y, end.y, t),
    };
}
export function MathLerpVec3(start: Vector3, end: Vector3, t: number): Vector3 {
    return {
        x: MathLerp(start.x, end.x, t),
        y: MathLerp(start.y, end.y, t),
        z: MathLerp(start.z, end.z, t),
    };
}
export function MathLerpColor(start: Color, end: Color, t: number): Color {
    return {
        r: MathLerp(start.r, end.r, t),
        g: MathLerp(start.g, end.g, t),
        b: MathLerp(start.b, end.b, t),
    };
}

export function MathIntersectionSphereSphere(pos1: Vector2, radius1: number, pos2: Vector2, radius2: number) {
    // Assuming spheres are objects with properties x, y, z (center) and radius
    const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));

    return distance <= radius1 + radius2;
}

export function uint16ToFloat16(uint16Value: number): number {
    // Extracting components
    const sign = (uint16Value & 0x8000) >> 15;
    const exponent = (uint16Value & 0x7c00) >> 10;
    const fraction = uint16Value & 0x03ff;

    // Reconstructing the float32 value
    let floatValue;

    if (exponent === 0) {
        if (fraction === 0) {
            // +/- 0
            floatValue = sign ? -0 : 0;
        } else {
            // Denormalized number
            floatValue = Math.pow(2, -14) * (fraction / Math.pow(2, 10)) * (sign ? -1 : 1);
        }
    } else if (exponent === 0x1f) {
        if (fraction === 0) {
            // +/- Infinity
            floatValue = sign ? -Infinity : Infinity;
        } else {
            // NaN
            floatValue = NaN;
        }
    } else {
        // Normalized number
        floatValue = Math.pow(2, exponent - 15) * (1 + fraction / Math.pow(2, 10)) * (sign ? -1 : 1);
    }

    return floatValue;
}

/* 
Time
*/
export const GTime = {
    Last: 0,
    Cur: 0.01,
    CurClamped: 0.0,
    Delta: 0.01,
    DeltaMs: 1,
    //FPS counter:
    FrameTimesArr: [] as number[],
    CurFrameCursor: 0,
    NumFrames: 0,
    MaxFrames: 60,
    FPSTotal: 0,
    FPSAvrg: 0,
};
export function GetCurrentTimeSec() {
    return performance.now() / 1000.0;
}
export function UpdateTime() {
    GTime.Cur = GetCurrentTimeSec();
    GTime.Delta = GTime.Cur - GTime.Last;
    //compute average FPS
    {
        const fps = 1 / GTime.Delta;
        // add the current fps and remove the oldest fps
        GTime.FPSTotal += fps - (GTime.FrameTimesArr[GTime.CurFrameCursor] || 0);
        // record the newest fps
        GTime.FrameTimesArr[GTime.CurFrameCursor++] = fps;
        // needed so the first N frames, before we have maxFrames, is correct.
        GTime.NumFrames = Math.max(GTime.NumFrames, GTime.CurFrameCursor);
        GTime.CurFrameCursor %= GTime.MaxFrames;
        GTime.FPSAvrg = GTime.FPSTotal / GTime.NumFrames;
    }
    if (GTime.Delta > 0.0) {
        GTime.Delta = MathClamp(GTime.Delta, 1.0 / 300.0, 1.0 / 30.0);
    }

    GTime.CurClamped += GTime.Delta;
    GTime.DeltaMs = GTime.Delta * 1000.0;
    GTime.Last = GTime.Cur;
}
