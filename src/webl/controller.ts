/* Camera Control */

import { GSceneDesc } from "./scene";
import { Vector3 } from "./types";
import { GTime } from "./utils";

const GController = {
    bCameraMovesForwardThisFrame: false,
    bCameraMovesBackThisFrame: false,
    bCameraMovesLeftThisFrame: false,
    bCameraMovesRightThisFrame: false,
    bCameraMovesUpThisFrame: false,
    bCameraMovesDownThisFrame: false,
    bCameraSpeedDouble: false,
};

export function SetupCameraControlThroughInput() {
    document.addEventListener("keydown", function (event) {
        switch (event.key) {
            case "w":
                GController.bCameraMovesForwardThisFrame = true;
                break;
            case "a":
                GController.bCameraMovesLeftThisFrame = true;
                break;
            case "s":
                GController.bCameraMovesBackThisFrame = true;
                break;
            case "d":
                GController.bCameraMovesRightThisFrame = true;
                break;
            case "q":
                GController.bCameraMovesDownThisFrame = true;
                break;
            case "e":
                GController.bCameraMovesUpThisFrame = true;
                break;
            case "Shift":
                GController.bCameraSpeedDouble = !GController.bCameraSpeedDouble;
                break;
        }
    });

    document.addEventListener("keyup", function (event) {
        switch (event.key) {
            case "w":
                GController.bCameraMovesForwardThisFrame = false;
                break;
            case "a":
                GController.bCameraMovesLeftThisFrame = false;
                break;
            case "s":
                GController.bCameraMovesBackThisFrame = false;
                break;
            case "d":
                GController.bCameraMovesRightThisFrame = false;
                break;
            case "q":
                GController.bCameraMovesDownThisFrame = false;
                break;
            case "e":
                GController.bCameraMovesUpThisFrame = false;
                break;
        }
    });
}

export function ApplyCameraControl() {
    const speed = 2.5; // Base speed
    const adjustedSpeed = GController.bCameraSpeedDouble ? speed * 2.0 : speed;
    if (GController.bCameraMovesForwardThisFrame) {
        GSceneDesc.Camera.Position.z += adjustedSpeed * GTime.Delta;
    }
    if (GController.bCameraMovesBackThisFrame) {
        GSceneDesc.Camera.Position.z -= adjustedSpeed * GTime.Delta;
    }
    if (GController.bCameraMovesLeftThisFrame) {
        GSceneDesc.Camera.Position.x -= adjustedSpeed * GTime.Delta;
    }
    if (GController.bCameraMovesRightThisFrame) {
        GSceneDesc.Camera.Position.x += adjustedSpeed * GTime.Delta;
    }
    if (GController.bCameraMovesUpThisFrame) {
        GSceneDesc.Camera.Position.y += adjustedSpeed * GTime.Delta;
    }
    if (GController.bCameraMovesDownThisFrame) {
        GSceneDesc.Camera.Position.y -= adjustedSpeed * GTime.Delta;
    }
}

export class GCameraShakeController {
    static CachedCamPos = { x: 0.0, y: 0.0, z: 0.0 };

    static ShakeEventParam = 0.0;

    static bShakeEventRunning = false;

    static ShakeDuration = 0.2;

    static RandAmplitudeXYZ = { x: 0.0, y: 0.0, z: 0.0 };

    static ShakeCameraFast() {
        if (!this.bShakeEventRunning) {
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
            const shakeStrength = 0.05 * 0.5 * this.RandAmplitudeXYZ.z;

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
