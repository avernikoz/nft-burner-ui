import { Vector3 } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GTime, MathLerpVec3, MathSmoothstep, MathVector3Add, MathVector3Multiply, MathVector3Negate } from "./utils";

export class AnimationController {
    Position: Vector3;

    MaxPosition: Vector3;

    MinPosition: Vector3;

    PosInterpolationParameter = 0;

    PosAnimationNumCyclesPerSec: number;

    YawAnimationNumCyclesPerSec = 0.07;

    YawInterpolationParameter = 0;

    constructor(intialPosition: Vector3, minPos: Vector3, maxPos: Vector3) {
        this.Position = intialPosition;
        this.MinPosition = minPos;
        this.MaxPosition = maxPos;
        this.PosAnimationNumCyclesPerSec = 0.1;
    }

    UpdateSelf() {
        //update lerp param
        this.PosInterpolationParameter =
            (Math.sin(GTime.Cur * Math.PI * 2 * this.PosAnimationNumCyclesPerSec) + 1.0) * 0.5;

        //update controller position
        //const tSmooth = MathSmoothstep(0.0, 1.0, this.InterpolationParameter);
        this.Position = MathLerpVec3(this.MinPosition, this.MaxPosition, this.PosInterpolationParameter);

        this.YawInterpolationParameter =
            (Math.sin(GTime.Cur * Math.PI * 2 * this.YawAnimationNumCyclesPerSec) + 1.0) * 0.5;
    }

    UpdateObjectPosition(objectPos: Vector3, accelerationScale: number) {
        const curDiff = MathVector3Negate(objectPos, this.Position);
        const curVelocity = MathVector3Multiply(curDiff, -accelerationScale);
        return MathVector3Add(objectPos, MathVector3Multiply(curVelocity, Math.min(GTime.Delta, 1 / 60)));
    }
}
