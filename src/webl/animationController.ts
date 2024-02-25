/* eslint-disable @typescript-eslint/lines-between-class-members */
import { start } from "repl";
import { GSceneDesc, GSceneStateDescsArray } from "./scene";
import { GetVec2, GetVec3, Vector3 } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
    GTime,
    MathGetVectorLength,
    MathLerpVec3,
    MathSmoothstep,
    MathVector2Normalize,
    MathVector3Add,
    MathVector3Multiply,
    MathVector3Negate,
    MathVector3Normalize,
} from "./utils";
import { ERenderingState } from "./states";

export class AnimationController {
    Position: Vector3;

    MaxPosition: Vector3;

    MinPosition: Vector3;

    PosInterpolationParameter = 0;

    PosAnimationNumCyclesPerSec: number;

    YawAnimationNumCyclesPerSec = 0.07;

    PitchAnimationNumCyclesPerSec = 0.03;

    YawInterpolationParameter = 0;

    PitchInterpolationParameter = 0;

    constructor(intialPosition: Vector3, minPos: Vector3, maxPos: Vector3) {
        this.Position = intialPosition;
        this.MinPosition = minPos;
        this.MaxPosition = maxPos;
        this.PosAnimationNumCyclesPerSec = 0.1;
    }

    UpdateSelf() {
        //update lerp param
        this.PosInterpolationParameter =
            (Math.sin(GTime.CurClamped * Math.PI * 2 * this.PosAnimationNumCyclesPerSec) + 1.0) * 0.5;

        //update controller position
        //const tSmooth = MathSmoothstep(0.0, 1.0, this.InterpolationParameter);
        this.Position = MathLerpVec3(this.MinPosition, this.MaxPosition, this.PosInterpolationParameter);

        this.YawInterpolationParameter =
            (Math.sin(GTime.CurClamped * Math.PI * 2 * this.YawAnimationNumCyclesPerSec) + 1.0) * 0.5;
        this.PitchInterpolationParameter =
            (Math.sin(GTime.CurClamped * Math.PI * 2 * this.PitchAnimationNumCyclesPerSec) + 1.0) * 0.5;
    }

    UpdateObjectPosition(objectPos: Vector3, accelerationScale: number) {
        const curDiff = MathVector3Negate(objectPos, this.Position);
        const curVelocity = MathVector3Multiply(curDiff, -accelerationScale);
        return MathVector3Add(objectPos, MathVector3Multiply(curVelocity, Math.min(GTime.Delta, 1 / 60)));
    }
}

export class GCameraShakeController {
    static CachedCamPos = { x: 0.0, y: 0.0, z: 0.0 };

    static ShakeEventParam = 0.0;

    static bShakeEventRunning = false;

    static ShakeDuration = 0.2;

    static RandAmplitudeXYZ = { x: 0.0, y: 0.0, z: 0.0 };

    static ShakeStrength = 1.0;

    static ShakeCameraFast(strength = 1.0) {
        if (!GCameraShakeController.bShakeEventRunning) {
            this.ShakeStrength = strength;

            this.bShakeEventRunning = true;
            this.ShakeEventParam = 0.0;

            const rand = Math.random();
            this.RandAmplitudeXYZ.x = rand;
            this.RandAmplitudeXYZ.y = 1.0 - rand;
            this.RandAmplitudeXYZ.z = 0.25 + Math.random() * 0.75;

            this.CachedCamPos.x = GSceneDesc.Camera.Position.x;
            this.CachedCamPos.y = GSceneDesc.Camera.Position.y;
            this.CachedCamPos.z = GSceneDesc.Camera.Position.z;
        }
    }

    static OnUpdate() {
        if (this.bShakeEventRunning) {
            const shakeStrength = 0.05 * 0.5 * GCameraShakeController.ShakeStrength * this.RandAmplitudeXYZ.z;

            const xOffset = Math.sin(this.ShakeEventParam * 37.0) * shakeStrength * this.RandAmplitudeXYZ.x;
            const yOffset = Math.sin(this.ShakeEventParam * 40.0) * shakeStrength * this.RandAmplitudeXYZ.y;

            GSceneDesc.Camera.Position.x = this.CachedCamPos.x + xOffset;
            GSceneDesc.Camera.Position.y = this.CachedCamPos.y + yOffset;

            this.ShakeEventParam += GTime.Delta;

            if (this.ShakeEventParam > this.ShakeDuration) {
                this.bShakeEventRunning = false;
                GSceneDesc.Camera.Position.x = this.CachedCamPos.x;
                GSceneDesc.Camera.Position.y = this.CachedCamPos.y;
            }
        }
    }
}

export class GSpotlightShakeController {
    static CachedSpotlightPos = { x: 0.0, y: 0.0, z: 0.0 };
    static CachedSpotlightFocusPos = { x: 0.0, y: 0.0, z: 0.0 };

    static VelocityCur = GetVec3(0, 0, 0);
    static kMaxBounds = GetVec3(1, 1);
    static DesiredFocusPos = GetVec3(0, 0, 0);

    static kConnectionConstraintStiffness = 20.0;

    static Init() {
        this.CachedSpotlightPos.x = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightPosition.x;
        this.CachedSpotlightPos.y = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightPosition.y;
        this.CachedSpotlightPos.z = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightPosition.z;

        this.CachedSpotlightFocusPos.x = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightFocusPosition.x;
        this.CachedSpotlightFocusPos.y = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightFocusPosition.y;
        this.CachedSpotlightFocusPos.z = GSceneStateDescsArray[ERenderingState.BurningReady].SpotlightFocusPosition.z;
    }

    static ShakeSpotlight(strength = 1.0) {
        //Apply random dir force
        const force = MathVector2Normalize(GetVec2(-1.0 + Math.random() * 2.0, Math.random() * 1.5));

        const dt = Math.min(1 / 60, GTime.Delta);

        strength *= 100.0;

        this.VelocityCur.x += force.x * strength * dt;
        this.VelocityCur.z += force.y * strength * dt;
    }

    static OnUpdate() {
        const curFocusPos = GSceneDesc.Spotlight.FocusPosition;

        const diff = GetVec2(
            this.CachedSpotlightFocusPos.x - curFocusPos.x,
            this.CachedSpotlightFocusPos.z - curFocusPos.z,
        );

        const curDist = MathGetVectorLength(diff) * this.kConnectionConstraintStiffness;
        const dir = MathVector2Normalize(diff);

        const dt = Math.min(1 / 60, GTime.Delta);

        this.VelocityCur.x += dir.x * curDist * dt;
        this.VelocityCur.z += dir.y * curDist * dt;

        //Damping
        this.VelocityCur.x = this.VelocityCur.x * 0.99;
        this.VelocityCur.y = this.VelocityCur.y * 0.99;
        this.VelocityCur.z = this.VelocityCur.z * 0.99;

        //Integrate
        curFocusPos.x = curFocusPos.x + this.VelocityCur.x * dt;
        curFocusPos.z = curFocusPos.z + this.VelocityCur.z * dt;

        const newDiff = GetVec2(
            this.CachedSpotlightFocusPos.x - curFocusPos.x,
            this.CachedSpotlightFocusPos.z - curFocusPos.z,
        );

        const posOffset = MathVector3Normalize(GetVec3(newDiff.x, -1, newDiff.y));
        const posOffsetScale = 0.5;
        GSceneDesc.Spotlight.Position.x = this.CachedSpotlightPos.x - posOffset.x * posOffsetScale;
        GSceneDesc.Spotlight.Position.y = this.CachedSpotlightPos.y + posOffsetScale + posOffset.y * posOffsetScale;
        GSceneDesc.Spotlight.Position.z = this.CachedSpotlightPos.z - posOffset.z * posOffsetScale;
    }
}
