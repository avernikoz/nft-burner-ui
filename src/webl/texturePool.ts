export class GTexturePool {
    static NumPendingTextures = 0;

    static AreAllTexturesLoaded(): boolean {
        if (GTexturePool.NumPendingTextures > 0) {
            console.log("Num Pending Textures" + GTexturePool.NumPendingTextures);
            return false;
        } else {
            return true;
        }
    }

    static CreateTexture(
        gl: WebGL2RenderingContext,
        bSingleChannel: boolean,
        inImageSrc: string | null,
        bGenerateMips = false,
        bUseTrilinearFilter = false,
    ): WebGLTexture {
        const texture = gl.createTexture();

        GTexturePool.NumPendingTextures += 1;

        //Set Cur Texture Unit
        gl.activeTexture(gl.TEXTURE0);
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
                GTexturePool.NumPendingTextures -= 1;
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

        if (inImageSrc != null) {
            fetch(inImageSrc)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${inImageSrc}`);
                    }
                    return response.blob();
                })
                .then((blob) => createImageBitmap(blob))
                .then((imageBitmap) => {
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBitmap);
                    if (bGenerateMips) {
                        gl.generateMipmap(gl.TEXTURE_2D);
                    }
                    GTexturePool.NumPendingTextures -= 1;
                })
                .catch((error) => {
                    console.error(`Error loading image: ${inImageSrc}`, error);
                });
        }

        if (texture === null) {
            throw new Error("Texture create fail");
        } else {
            return texture;
        }
    }
}
