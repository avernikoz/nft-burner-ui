import { GScreenDesc } from "./scene";
import { MathLerp } from "./utils";

export const GUserInputDesc = {
    InputPosCurNDC: { x: 0, y: 0 },
    InputPosPrevNDC: { x: 0, y: 0 },
    InputVelocityCurNDC: { x: 0, y: 0 },
    InputVelocityPrevNDC: { x: 0, y: 0 },
    InputPosCurViewSpace: { x: 0, y: 0 },
    InputPosPrevViewSpace: { x: 0, y: 0 },
    InputVelocityCurViewSpace: { x: 0, y: 0 },
    InputVelocityPrevViewSpace: { x: 0, y: 0 },
    bPointerInputMoving: false,
    bPointerInputPressedCurFrame: false,
    bPointerInputPressedPrevFrame: false,
    FReset: function () {
        GUserInputDesc.bPointerInputMoving = false;
    },
    kInactivityTimeMs: 1000,
    InactivityTimerID: setTimeout(() => {
        GUserInputDesc.FReset();
    }, 1),
};

const VariablesInner = {
    InputPosCurNDC: { x: 0, y: 0 },
    bPointerInputPressed: false,
};

export function RegisterUserInput(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
        // Handle the first touch if available
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }

    if (clientX !== undefined && clientY !== undefined) {
        const inputX = ((clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        const inputY = (1.0 - (clientY - rect.top) / canvas.clientHeight) * 2 - 1;
        VariablesInner.InputPosCurNDC.x = inputX;
        VariablesInner.InputPosCurNDC.y = inputY;

        GUserInputDesc.bPointerInputMoving = true;
        clearTimeout(GUserInputDesc.InactivityTimerID);
        GUserInputDesc.InactivityTimerID = setTimeout(() => {
            GUserInputDesc.FReset();
        }, GUserInputDesc.kInactivityTimeMs);
    }
}

export function UserInputUpdatePerFrame() {
    //Ask system for current Input State
    GUserInputDesc.bPointerInputPressedPrevFrame = GUserInputDesc.bPointerInputPressedCurFrame;
    GUserInputDesc.bPointerInputPressedCurFrame = VariablesInner.bPointerInputPressed;

    //Ask system for current InputPos
    GUserInputDesc.InputPosPrevNDC.x = GUserInputDesc.InputPosCurNDC.x;
    GUserInputDesc.InputPosPrevNDC.y = GUserInputDesc.InputPosCurNDC.y;
    GUserInputDesc.InputPosCurNDC.x = VariablesInner.InputPosCurNDC.x;
    GUserInputDesc.InputPosCurNDC.y = VariablesInner.InputPosCurNDC.y;

    //View Space
    GUserInputDesc.InputPosPrevViewSpace.x = GUserInputDesc.InputPosCurViewSpace.x;
    GUserInputDesc.InputPosPrevViewSpace.y = GUserInputDesc.InputPosCurViewSpace.y;

    GUserInputDesc.InputPosCurViewSpace = {
        x: GUserInputDesc.InputPosCurNDC.x * GScreenDesc.ScreenRatio,
        y: GUserInputDesc.InputPosCurNDC.y,
    };

    //Update Velocity
    GUserInputDesc.InputVelocityPrevNDC.x = GUserInputDesc.InputVelocityCurNDC.x;
    GUserInputDesc.InputVelocityPrevNDC.y = GUserInputDesc.InputVelocityCurNDC.y;

    GUserInputDesc.InputVelocityCurNDC.x = GUserInputDesc.InputPosCurNDC.x - GUserInputDesc.InputPosPrevNDC.x;
    GUserInputDesc.InputVelocityCurNDC.y = GUserInputDesc.InputPosCurNDC.y - GUserInputDesc.InputPosPrevNDC.y;

    //View Space
    GUserInputDesc.InputVelocityPrevViewSpace.x = GUserInputDesc.InputVelocityCurViewSpace.x;
    GUserInputDesc.InputVelocityPrevViewSpace.y = GUserInputDesc.InputVelocityCurViewSpace.y;

    //View space velocity smoothed out
    GUserInputDesc.InputVelocityCurViewSpace.x = MathLerp(
        GUserInputDesc.InputPosCurViewSpace.x - GUserInputDesc.InputPosPrevViewSpace.x,
        GUserInputDesc.InputVelocityPrevViewSpace.x,
        0.75,
    );
    GUserInputDesc.InputVelocityCurViewSpace.y = MathLerp(
        GUserInputDesc.InputPosCurViewSpace.y - GUserInputDesc.InputPosPrevViewSpace.y,
        GUserInputDesc.InputVelocityPrevViewSpace.y,
        0.75,
    );
}

export function InitUserInputEvents(canvas: HTMLCanvasElement) {
    document.addEventListener("mousemove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    document.addEventListener("touchmove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        RegisterUserInput(canvas, e);
        VariablesInner.bPointerInputPressed = true;
    });
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        VariablesInner.bPointerInputPressed = false;
    });

    canvas.addEventListener("touchstart", (e) => {
        RegisterUserInput(canvas, e);
        e.preventDefault();
        VariablesInner.bPointerInputPressed = true;
    });
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        VariablesInner.bPointerInputPressed = false;
    });
}
