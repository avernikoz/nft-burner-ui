import { APP_ENVIRONMENT } from "../config/config";
import { Vector2 } from "./types";
import { showError } from "./utils";

export function CreateTextureRT(
    gl: WebGL2RenderingContext,
    size: Vector2,
    internalFormat: GLenum,
    format: GLenum,
    type: GLenum,
    bGenerateMips = false,
) {
    const rtTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rtTexture);
    {
        // define size and format of level 0
        const level = 0;
        const border = 0;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, size.x, size.y, border, format, type, data);

        if (bGenerateMips) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return rtTexture;
}

export function FrameBufferCheck(gl: WebGL2RenderingContext, passname = "") {
    if (APP_ENVIRONMENT === "development") {
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            showError(passname + " Framebuffer is incomplete");
        }
    }
}

export function BindRenderTarget(
    gl: WebGL2RenderingContext,
    fbo: WebGLFramebuffer,
    viewportSize: Vector2,
    bClear = false,
    bClearDepth = false,
) {
    gl.viewport(0.0, 0.0, viewportSize.x, viewportSize.y);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    if (bClear) {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        if (bClearDepth) {
            gl.clearDepth(1.0); // Set clear depth to maximum
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        } else {
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }
}

export function CreateFramebufferWithAttachment(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    FrameBufferCheck(gl, "FrameBuffer");
    return fbo;
}

//Async Read
function CPUWaitForGPUAsync(gl: WebGL2RenderingContext, sync: WebGLSync, flags: number, interval_ms: number) {
    return new Promise<void>((resolve, reject) => {
        function syncCheck() {
            const res = gl.clientWaitSync(sync, flags, 0);
            if (res === gl.WAIT_FAILED) {
                //Indicates that an error occurred during the execution.
                reject();
                return;
            }
            if (res === gl.TIMEOUT_EXPIRED) {
                //Indicates that the timeout time passed and that the sync object did not become signaled.
                setTimeout(syncCheck, interval_ms); //try again after interval_ms passed
                return;
            }
            resolve();
        }
        syncCheck();
    });
}
async function GetBufferSubDataAsync(
    gl: WebGL2RenderingContext,
    target: number,
    buffer: WebGLBuffer,
    srcByteOffset: number,
    dstBuffer: ArrayBufferView,
    /* optional */ dstOffset?: number | undefined,
    /* optional */ length?: number | undefined,
) {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
    gl.flush();

    await CPUWaitForGPUAsync(gl, sync, 0, 10);
    gl.deleteSync(sync);

    gl.bindBuffer(target, buffer);
    gl.getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length);
    gl.bindBuffer(target, null);

    return dstBuffer;
}
export interface AsyncPixelReadingState {
    bReadingPixels: boolean;
}
export async function ReadPixelsAsync(
    gl: WebGL2RenderingContext,
    intermediateBuffer: WebGLBuffer,
    x: number,
    y: number,
    width: number,
    height: number,
    format: GLenum,
    type: GLenum,
    dest: ArrayBufferView,
    stateRef: AsyncPixelReadingState,
) {
    if (stateRef.bReadingPixels) {
        return;
    }

    stateRef.bReadingPixels = true;

    try {
        //Read pixels into intermediate GPU buffer
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, intermediateBuffer);
        gl.readPixels(x, y, width, height, format, type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        await GetBufferSubDataAsync(gl, gl.PIXEL_PACK_BUFFER, intermediateBuffer, 0, dest);
    } finally {
        stateRef.bReadingPixels = false;
    }

    //return dest;
}
