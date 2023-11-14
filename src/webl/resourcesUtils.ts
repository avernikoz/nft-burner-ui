import { APP_ENVIRONMENT } from "../config/config";
import { Vector2 } from "./types";
import { showError } from "./utils";

export let GNumPendingTextures = 0;

export function GAreAllTexturesLoaded(): boolean {
    if (GNumPendingTextures > 0) {
        console.log("Num Pending Textures" + GNumPendingTextures);
        return false;
    } else {
        return true;
    }
}

export function CreateTexture(
    gl: WebGL2RenderingContext,
    inUnitIndex: number,
    inImageSrc: string | null,
    bGenerateMips = false,
    bUseTrilinearFilter = false,
): WebGLTexture {
    const texture = gl.createTexture();

    GNumPendingTextures += 1;

    //Set Cur Texture Unit
    gl.activeTexture(gl.TEXTURE0 + inUnitIndex);
    //Assign Resource to Currently Set Texture Unit
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    //Load Image
    if (inImageSrc != null) {
        const image = new Image();
        image.src = inImageSrc;

        image.onerror = function () {
            console.error("Failed to load image: " + inImageSrc);
        };

        image.addEventListener("load", function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            if (bGenerateMips) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            GNumPendingTextures -= 1;
        });

        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (bGenerateMips) {
            if (bUseTrilinearFilter) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
            }
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    if (texture === null) {
        throw new Error("Texture create fail");
    } else {
        return texture;
    }
}

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
) {
    gl.viewport(0.0, 0.0, viewportSize.x, viewportSize.y);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    if (bClear) {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
}

export function CreateFramebufferWithAttachment(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    FrameBufferCheck(gl, "FrameBuffer");
    return fbo;
}
