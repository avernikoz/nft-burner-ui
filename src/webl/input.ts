export const GUserInputDesc = {
    InputPosNDCCur: { x: 0, y: 0 },
    InputPosNDCPrev: { x: 0, y: 0 },
    bPointerInputActiveThisFrame: false,
    bPointerInputPressed: false,
    InactiveTimerFunc: setTimeout(function () {
        GUserInputDesc.bPointerInputActiveThisFrame = false;
        GUserInputDesc.bPointerInputPressed = false;
        GUserInputDesc.InputPosNDCPrev.x = GUserInputDesc.InputPosNDCCur.x;
        GUserInputDesc.InputPosNDCPrev.y = GUserInputDesc.InputPosNDCCur.y;
    }, 2000), //time threshold for inactivity in milliseconds
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
        GUserInputDesc.InputPosNDCPrev.x = GUserInputDesc.InputPosNDCCur.x;
        GUserInputDesc.InputPosNDCPrev.y = GUserInputDesc.InputPosNDCCur.y;
        GUserInputDesc.InputPosNDCCur.x = mouseX;
        GUserInputDesc.InputPosNDCCur.y = mouseY;
        GUserInputDesc.bPointerInputActiveThisFrame = true;
        clearTimeout(GUserInputDesc.InactiveTimerFunc);
    }
}
