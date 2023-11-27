export const GUserInputDesc = {
    InputPosNDCCur: { x: 0, y: 0 },
    InputPosNDCPrev: { x: 0, y: 0 },
    InputVelocityNDCCur: { x: 0, y: 0 },
    InputVelocityNDCPrev: { x: 0, y: 0 },
    bPointerInputActiveThisFrame: false,
    bPointerInputPressedThisFrame: false,
    bPointerInputPressedPrevFrame: false,
    FReset: function () {
        GUserInputDesc.bPointerInputActiveThisFrame = false;
        //GUserInputDesc.bPointerInputPressedThisFrame = false;
        GUserInputDesc.InputPosNDCPrev.x = GUserInputDesc.InputPosNDCCur.x;
        GUserInputDesc.InputPosNDCPrev.y = GUserInputDesc.InputPosNDCCur.y;
        /* GUserInputDesc.InputVelocityNDCCur = { x: 0.0, y: 0.0 };
        GUserInputDesc.InputVelocityNDCPrev = { x: 0.0, y: 0.0 }; */
    },
    kInactivityTimeMs: 1000,
    InactivityTimerID: setTimeout(() => {
        GUserInputDesc.FReset();
    }, 1000),
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
        const mouseX = ((clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        const mouseY = (1.0 - (clientY - rect.top) / canvas.clientHeight) * 2 - 1;
        GUserInputDesc.InputVelocityNDCPrev.x = GUserInputDesc.InputVelocityNDCCur.x;
        GUserInputDesc.InputVelocityNDCPrev.y = GUserInputDesc.InputVelocityNDCCur.y;
        GUserInputDesc.InputPosNDCPrev.x = GUserInputDesc.InputPosNDCCur.x;
        GUserInputDesc.InputPosNDCPrev.y = GUserInputDesc.InputPosNDCCur.y;
        GUserInputDesc.InputPosNDCCur.x = mouseX;
        GUserInputDesc.InputPosNDCCur.y = mouseY;
        GUserInputDesc.InputVelocityNDCCur.x = GUserInputDesc.InputPosNDCCur.x - GUserInputDesc.InputPosNDCPrev.x;
        GUserInputDesc.InputVelocityNDCCur.y = GUserInputDesc.InputPosNDCCur.y - GUserInputDesc.InputPosNDCPrev.y;
        GUserInputDesc.bPointerInputActiveThisFrame = true;
        clearTimeout(GUserInputDesc.InactivityTimerID);
        GUserInputDesc.InactivityTimerID = setTimeout(() => {
            GUserInputDesc.FReset();
        }, GUserInputDesc.kInactivityTimeMs);
    }
}

export function InitUserInputEvents(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousemove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        RegisterUserInput(canvas, e);
        GUserInputDesc.bPointerInputPressedThisFrame = true;
    });
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = false;
    });

    canvas.addEventListener("touchstart", (e) => {
        RegisterUserInput(canvas, e);
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = true;
    });
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = false;
    });
}
