/* Camera Control */

import { GSceneDesc } from "../scene";
import { GTime } from "../utils";

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
