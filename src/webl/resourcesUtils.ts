import { Vector2 } from "./types";
import { showError } from "./utils";

export function CreateTexture(
    gl: WebGL2RenderingContext,
    inUnitIndex: number,
    inImageSrc: string | null,
    bGenerateMips = false,
): WebGLTexture {
    /*
	var self = this;
	self.TextureUnitIndex = inUnitIndex;
	self.Resource = gl.createTexture();
	self.UniformBufferIndex = 0; */

    const texture = gl.createTexture();

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
        });

        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (bGenerateMips) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    /* self.Bind = function(gl, inUniformBufferIndex)
	{
		gl.activeTexture(gl.TEXTURE0 + self.TextureUnitIndex);
		gl.bindTexture(gl.TEXTURE_2D, self.Resource);
		gl.uniform1i(inUniformBufferIndex, self.TextureUnitIndex);
	} */

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
) {
    const rtTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rtTexture);
    {
        // define size and format of level 0
        const level = 0;
        const border = 0;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, size.x, size.y, border, format, type, data);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return rtTexture;
}

export function FrameBufferCheck(gl: WebGL2RenderingContext, passname = "") {
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        showError(passname + " Framebuffer is incomplete");
    }
}
