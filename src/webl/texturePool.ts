export class GTexturePool {
    static NumPendingTextures = 0;

    static SizeBytes = 0.0; //Size loaded from files

    static SizeBytesGPU = 0.0; //Actual Size occupying GPU

    static SizeMegaBytes = 0.0;

    static SizeMegaBytesGPU = 0.0;

    static NumTexturesInPool = 0;

    private static TextureMap = new Map<string, WebGLTexture>();

    static bLogTexturesInPool = false;

    static bSupportsASTCCompression = false;

    static bSupportsDXTCompression = false;

    static LogTexturesInPool() {
        if (GTexturePool.bLogTexturesInPool) {
            const urlsArray = Array.from(GTexturePool.TextureMap.keys());
            const urlsString = urlsArray.join("\n");
            console.log("Texture URLs in the pool:\n", urlsString);
            GTexturePool.bLogTexturesInPool = false;
        }
    }

    static AreAllTexturesLoaded(): boolean {
        if (GTexturePool.NumPendingTextures > 0) {
            console.log("Num Pending Textures" + GTexturePool.NumPendingTextures);
            return false;
        } else {
            return true;
        }
    }

    private static DefaultFormatsArr = ["png", "jpg"];

    private static TextureLocationFolder = `assets/textures/`;

    static ParseKTXHeader(arrayBuffer: ArrayBuffer) {
        // Test that it is a ktx formatted file, based on the first 12 bytes, character representation is:
        // '´', 'K', 'T', 'X', ' ', '1', '1', 'ª', '\r', '\n', '\x1A', '\n'
        // 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A
        const identifier = new Uint8Array(arrayBuffer, 0, 12);
        if (
            identifier[0] !== 0xab ||
            identifier[1] !== 0x4b ||
            identifier[2] !== 0x54 ||
            identifier[3] !== 0x58 ||
            identifier[4] !== 0x20 ||
            identifier[5] !== 0x31 ||
            identifier[6] !== 0x31 ||
            identifier[7] !== 0xbb ||
            identifier[8] !== 0x0d ||
            identifier[9] !== 0x0a ||
            identifier[10] !== 0x1a ||
            identifier[11] !== 0x0a
        ) {
            console.error("texture missing KTX identifier");
            return { result: false, x: 0, y: 0 };
        }

        const dataSize = Uint32Array.BYTES_PER_ELEMENT;
        const headerDataView = new DataView(arrayBuffer, 12, 13 * dataSize);
        const endianness = headerDataView.getUint32(0, true);
        const littleEndian = endianness === 0x04030201;

        const pixelWidth = headerDataView.getUint32(6 * dataSize, littleEndian); // level 0 value of arg passed to gl.compressedTexImage2D(,,,x,,,)
        const pixelHeight = headerDataView.getUint32(7 * dataSize, littleEndian); // level 0 value of arg passed to gl.compressedTexImage2D(,,,,x,,)
        //const numberOfMipmapLevels = headerDataView.getUint32(11 * dataSize, littleEndian); // number of levels; disregard possibility of 0 for compressed textures
        //const bytesOfKeyValueData = headerDataView.getUint32(12 * dataSize, littleEndian); // the amount of space after the header for meta-data

        return { result: true, x: pixelWidth, y: pixelHeight };
    }

    static async LoadTextureImageAsync(
        gl: WebGL2RenderingContext,
        texture: WebGLTexture,
        textureBaseName: string,
        bGenerateMips = false,
    ) {
        let bImageLoaded = false;
        const bSingleChannelTexture = textureBaseName.endsWith("_R8");

        const ext = gl.getExtension("WEBGL_compressed_texture_astc");
        if (!bSingleChannelTexture && ext) {
            //try load compressed image
            const imageUrl = GTexturePool.TextureLocationFolder + `${textureBaseName}.ktx`;
            const fetchRes = await fetch(imageUrl);
            if (fetchRes.ok) {
                try {
                    const arrayBuffer = await fetchRes.arrayBuffer();

                    const ktxMetaData = GTexturePool.ParseKTXHeader(arrayBuffer);

                    if (ktxMetaData.result) {
                        gl.compressedTexImage2D(
                            gl.TEXTURE_2D,
                            0,
                            ext.COMPRESSED_RGBA_ASTC_6x6_KHR,
                            ktxMetaData.x,
                            ktxMetaData.y,
                            0,
                            new Uint8Array(arrayBuffer),
                        );

                        GTexturePool.NumPendingTextures -= 1;
                        return;
                    }
                } catch {}
            }
        }

        const uploadImage = (image: HTMLImageElement) => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            if (bSingleChannelTexture) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, image);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
            if (bGenerateMips) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        };

        const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.src = src;

                image.onload = () => {
                    resolve(image);
                };

                image.onerror = (error) => {
                    reject(error);
                };
            });
        };

        for (let i = 0; i < GTexturePool.DefaultFormatsArr.length; i++) {
            const currentFormat = GTexturePool.DefaultFormatsArr[i];
            const imageUrl = GTexturePool.TextureLocationFolder + `${textureBaseName}.${currentFormat}`;
            try {
                const fetchRes = await fetch(imageUrl);
                if (fetchRes.ok) {
                    const contentType = fetchRes.headers.get("Content-Type");
                    if (contentType && contentType.startsWith("image/")) {
                        const blob = await fetchRes.blob();
                        const image = await loadImageAsync(URL.createObjectURL(blob));
                        uploadImage(image);
                        GTexturePool.NumPendingTextures -= 1;
                        const contentLength = fetchRes.headers.get("Content-Length");
                        if (contentLength) {
                            const fileSizeBytes = parseInt(contentLength, 10);
                            GTexturePool.SizeBytes += fileSizeBytes;
                        } else {
                            GTexturePool.SizeBytes += image.width * image.height * 4;
                        }
                        GTexturePool.SizeMegaBytes = GTexturePool.SizeBytes / 1000000.0;

                        GTexturePool.SizeBytesGPU += image.width * image.height * (bSingleChannelTexture ? 1 : 4);
                        GTexturePool.SizeMegaBytesGPU = GTexturePool.SizeBytesGPU / 1000000.0;
                        bImageLoaded = true;
                        break;
                    }
                }
            } catch (error) {
                console.error(`ERROR LOADING IMAGE ${textureBaseName}.${currentFormat}`, error);
            }
        }

        if (!bImageLoaded) {
            console.error(`ERROR LOADING IMAGE ${textureBaseName}`);
        }
    }

    static CreateTexture(
        gl: WebGL2RenderingContext,
        bSingleChannel: boolean,
        textureBaseName: string,
        bGenerateMips = false,
        bUseTrilinearFilter = false,
    ): WebGLTexture {
        //Check hash map
        const existingTexture = GTexturePool.TextureMap.get(textureBaseName);
        if (existingTexture) {
            return existingTexture;
        }

        const texture = gl.createTexture()!;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

        GTexturePool.NumPendingTextures += 1;
        GTexturePool.LoadTextureImageAsync(gl, texture, textureBaseName, bGenerateMips);

        //Move into the beginning
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

        if (bGenerateMips) {
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_LOD, 1.0);
        }

        // Store the new texture in the map
        GTexturePool.TextureMap.set(textureBaseName, texture);
        GTexturePool.NumTexturesInPool = GTexturePool.TextureMap.size;
        return texture;
    }

    /* static DDS_HEADER_LENGTH = 31;

    static DDS_MAGIC = 0x20534444;

    static DDS_HEADER_MAGIC = 0;

    static DDS_HEADER_SIZE = 1;

    static DDS_HEADER_FLAGS = 2;

    static DDS_HEADER_HEIGHT = 3;

    static DDS_HEADER_WIDTH = 4;

    static DDPF_FOURCC = 0x4;

    static DDS_HEADER_PF_FLAGS = 20;

    static DDS_HEADER_PF_FOURCC = 21;

    // A simple function to parse the DDS header (you might need to adjust this based on your use case)
    static parseDDSHeader(buffer: ArrayBuffer) {
        const header = new Int32Array(buffer, 0, GTexturePool.DDS_HEADER_LENGTH);

        // Do some sanity checks to make sure this is a valid DDS file.
        if (header[GTexturePool.DDS_HEADER_MAGIC] != GTexturePool.DDS_MAGIC) {
            console.log(`DDS Magic Error`);
        }

        const pf = header[GTexturePool.DDS_HEADER_PF_FLAGS];

        if (!(pf & GTexturePool.DDPF_FOURCC)) {
            console.log(`DDS FF Error`);
        }

        // Assuming a DDS header is 128 bytes (you might need to adjust this)
        const width = header[GTexturePool.DDS_HEADER_WIDTH]; // Read width at offset 16
        const height = header[GTexturePool.DDS_HEADER_HEIGHT]; // Read height at offset 12

        const dataOffset = header[GTexturePool.DDS_HEADER_SIZE] + 4;
        const dxtData = new Uint8Array(buffer, dataOffset);

        return { width, height, dxtData };
    }

    static CreateTextureCompressed(
        gl: WebGL2RenderingContext,
        bSingleChannel: boolean,
        textureBaseName: string,
        bGenerateMips = false,
        bUseTrilinearFilter = false,
    ): WebGLTexture {
        //Check hash map
        const existingTexture = GTexturePool.TextureMap.get(textureBaseName);
        if (existingTexture) {
            return existingTexture;
        }

        const texture = gl.createTexture();

        GTexturePool.NumPendingTextures += 1;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255, 255]),
        );

        const loadCompressedTexture = async () => {
            const currentFormat = "dds";
            const imageUrl = GTexturePool.TextureLocationFolder + `${textureBaseName}.${currentFormat}`;
            try {
                const response = await fetch(imageUrl);
                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    // Assuming buffer contains a DDS file
                    const ddsHeader = GTexturePool.parseDDSHeader(buffer);
                    // Use the DDS header dimensions (already multiples of 4 for DXT)
                    let sizeX = ddsHeader.width;
                    let sizeY = ddsHeader.height;

                    sizeX = (sizeX + 3) & ~3;
                    sizeY = (sizeY + 3) & ~3;

                    console.log(`DDS dimension: ${sizeX}, ${sizeY}`);

                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.compressedTexImage2D(
                        gl.TEXTURE_2D,
                        0,
                        GTexturePool.CompressedTextureExtension.COMPRESSED_RGBA_S3TC_DXT5_EXT,
                        sizeX,
                        sizeY,
                        0,
                        ddsHeader.dxtData,
                    );
                    GTexturePool.NumPendingTextures -= 1;
                    if (bGenerateMips) {
                        //gl.generateMipmap(gl.TEXTURE_2D);
                    }
                } else {
                    console.log(`Error loading image ${textureBaseName}.${currentFormat}`);
                }
            } catch (error) {
                console.error(`Error loading image ${textureBaseName}.${currentFormat}`, error);
            }
        };

        loadCompressedTexture();

        //Move into the beginning
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

        if (texture === null) {
            throw new Error("WebGLTexture create fail");
        } else {
            // Store the new texture in the map
            GTexturePool.TextureMap.set(textureBaseName, texture);
            GTexturePool.NumTexturesInPool = GTexturePool.TextureMap.size;
            return texture;
        }
    } */

    static SubmitDebugUI(datGui: dat.GUI) {
        const folder = datGui.addFolder("Texture Pool");
        folder.open();

        folder.add(GTexturePool, "SizeMegaBytes").name("SizeMb").step(0.01).listen();
        folder.add(GTexturePool, "SizeMegaBytesGPU").name("SizeMbGPU").step(0.01).listen();
        folder.add(GTexturePool, "NumTexturesInPool").name("NumTextures").step(1).listen();
        folder.add(GTexturePool, "bLogTexturesInPool").name("Log All Textures").listen();
        folder.add(GTexturePool, "bSupportsASTCCompression").name("ASTC").listen();
        folder.add(GTexturePool, "bSupportsDXTCompression").name("S3TC").listen();
    }
}
