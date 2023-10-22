import { CGConstants } from "./systemValues";
import { Vector2 } from "./types";

export function getMousePosition(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent) {
    // console.debug("[getMousePosition] call");
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
        CGConstants.PrevMousePosNDC.x = CGConstants.MousePosNDC.x;
        CGConstants.PrevMousePosNDC.y = CGConstants.MousePosNDC.y;
        CGConstants.MousePosNDC.x = mouseX;
        CGConstants.MousePosNDC.y = mouseY;
        CGConstants.bMouseMoved = true;
    }
}

export function showError(errorText: string) {
    // const errorBoxDiv = document.getElementById("error-box");
    // const errorTextElement = document.createElement("p");
    // errorTextElement.innerText = errorText;
    // errorBoxDiv.appendChild(errorTextElement);
    console.log(errorText);
}

/* function check(condition, text) {
  if (condition == false) {
    showError(text);
  } */
// }

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
    GTime.DeltaMs = GTime.Delta * 1000.0;
    GTime.Last = GTime.Cur;
}

export function MathGetVectorLength(vec2: Vector2) {
    return Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
}
export function MathClamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}
export function MathVectorNormalize(vec: Vector2) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (length === 0) {
        // Avoid division by zero
        return { x: 0, y: 0 };
    } else {
        return { x: vec.x / length, y: vec.y / length };
    }
}

export function MathMapToRange(t: number, t0: number, t1: number, newt0: number, newt1: number) {
    ///Translate to origin, scale by ranges ratio, translate to new position
    return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
}
