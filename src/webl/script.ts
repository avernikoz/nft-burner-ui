import { APP_ENVIRONMENT } from "../config/config";
import { RFirePlanePass } from "./firePlane";
import { getCanvas } from "./helpers/canvas";
import { DrawUI, DrawUISingleton } from "./helpers/gui";
import { ParticlesEmitter } from "./particles";
import { FlameParticlesDesc } from "./particlesConfig";
import { RBloomPass, RBlurPass, RCombinerPass, RFlamePostProcessPass, RPresentPass } from "./postprocess";
import { BindRenderTarget, CreateFramebufferWithAttachment, CreateTextureRT } from "./resourcesUtils";
import { CheckGL } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";

import { CGConstants } from "./systemValues";

import { Vector2 } from "./types";
import { GetMousePosNDC, MathClamp, MathGetVectorLength, MathVectorNormalize, UpdateTime, showError } from "./utils";

function AllocateCommonRenderingResources(gl: WebGL2RenderingContext) {
    if (CommonRenderingResources.FullscreenPassVertexBufferGPU == null) {
        const vertexBufferCPU = new Float32Array([
            -1.0,
            -1.0, // Bottom-left corner
            3.0,
            -1.0, // Bottom-right corner
            -1.0,
            3.0, // Top-left corner
        ]);

        CommonRenderingResources.FullscreenPassVertexBufferGPU = gl.createBuffer();
        //Upload from CPU to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.FullscreenPassVertexBufferGPU);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBufferCPU, gl.STATIC_DRAW);

        //VAO
        {
            CommonRenderingResources.FullscreenPassVAO = gl.createVertexArray();
            gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);
            //Vertex Buffer Bind
            gl.enableVertexAttribArray(CommonVertexAttributeLocationList.VertexBuffer); //turn on attribute
            //bind resource to this attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.FullscreenPassVertexBufferGPU);
            gl.vertexAttribPointer(
                CommonVertexAttributeLocationList.VertexBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
        }
    }

    if (CommonRenderingResources.PlaneShapeVertexBufferGPU == null) {
        //Create Vertex Buffer
        {
            const planeVertices = [-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1];
            const planeVertexBufferCPU = new Float32Array(planeVertices);

            CommonRenderingResources.PlaneShapeVertexBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeVertexBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeVertexBufferCPU, gl.STATIC_DRAW);
        }

        //Create TexCoord Buffer
        {
            const planeTexCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0];
            const planeTexCoordsBufferCPU = new Float32Array(planeTexCoords);

            CommonRenderingResources.PlaneShapeTexCoordsBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeTexCoordsBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeTexCoordsBufferCPU, gl.STATIC_DRAW);
        }

        //VAO
        CommonRenderingResources.PlaneShapeVAO = gl.createVertexArray();
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);
        //Vertex Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeVertexBufferGPU);
        gl.enableVertexAttribArray(CommonVertexAttributeLocationList.VertexBuffer); //turn on attribute
        gl.vertexAttribPointer(
            CommonVertexAttributeLocationList.VertexBuffer,
            2,
            gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );

        //TexCoords Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeTexCoordsBufferGPU);
        gl.enableVertexAttribArray(CommonVertexAttributeLocationList.TexCoordsBuffer); //turn on attribute
        gl.vertexAttribPointer(
            CommonVertexAttributeLocationList.TexCoordsBuffer,
            2,
            gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );
    }
}

const GSettings = {
    bRunSimulation: true,
};

const GPostProcessPasses: {
    CopyPresemt: RPresentPass | null;
    Blur: RBlurPass | null;
    Bloom: RBloomPass | null;
    Combiner: RCombinerPass | null;
    FlamePostProcess: RFlamePostProcessPass | null;
    BloomNumBlurPasses: number;
} = {
    CopyPresemt: null,
    Blur: null,
    Bloom: null,
    FlamePostProcess: null,
    Combiner: null,
    BloomNumBlurPasses: 3,
};

function SetupPostProcessPasses(gl: WebGL2RenderingContext, bloomTextureSize: Vector2) {
    GPostProcessPasses.CopyPresemt = new RPresentPass(gl);
    GPostProcessPasses.Blur = new RBlurPass(gl);
    GPostProcessPasses.Bloom = new RBloomPass(gl, bloomTextureSize);
    GPostProcessPasses.Combiner = new RCombinerPass(gl);
    GPostProcessPasses.FlamePostProcess = new RFlamePostProcessPass(gl);

    if (APP_ENVIRONMENT === "development") {
        const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
        //const folder = GDatGUI.addFolder(name);
        //folder.open();

        GDatGUI.add(GPostProcessPasses, "BloomNumBlurPasses", 0, 10, 1).name("BloomNumBlurPasses");
    }
}

const GRenderTargets: {
    FirePlaneTexture: WebGLTexture | null;
    FirePlaneFramebuffer: WebGLFramebuffer | null;
    FlameTexture: WebGLTexture | null;
    FlameTexture2: WebGLTexture | null;
    FlameFramebuffer: WebGLFramebuffer | null;
    FlameFramebuffer2: WebGLFramebuffer | null;
} = {
    FirePlaneTexture: null,
    FirePlaneFramebuffer: null,
    FlameTexture: null,
    FlameFramebuffer: null,
    FlameTexture2: null,
    FlameFramebuffer2: null,
};

function AllocateMainRenderTargets(gl: WebGL2RenderingContext, size: Vector2) {
    //const RenderTargetMainFloat = CreateTextureRT(gl, RenderTargetSize, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    //Fire Plane
    GRenderTargets.FirePlaneTexture = CreateTextureRT(gl, size, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, true);
    GRenderTargets.FirePlaneFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.FirePlaneTexture!);

    //Flame
    GRenderTargets.FlameTexture = CreateTextureRT(gl, size, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    GRenderTargets.FlameFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.FlameTexture!);
    GRenderTargets.FlameTexture2 = CreateTextureRT(gl, size, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, true);
    GRenderTargets.FlameFramebuffer2 = CreateFramebufferWithAttachment(gl, GRenderTargets.FlameTexture2!);
}

export function RenderMain() {
    const canvas = getCanvas();

    let bMouseDown: boolean;
    canvas.addEventListener("mousedown", () => {
        bMouseDown = true;
    });
    canvas.addEventListener("mouseup", () => {
        bMouseDown = false;
    });

    canvas.addEventListener("touchstart", () => {
        bMouseDown = true;
    });
    canvas.addEventListener("touchend", () => {
        bMouseDown = false;
    });

    // Set the canvas dimensions to maintain a 1:1 aspect ratio
    function resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = size;
        canvas.height = size;

        // You can use the canvas context to draw here if needed
    }

    // Call the resizeCanvas function initially and whenever the window is resized
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    if (!canvas) {
        showError("Canvas Error");
    }

    /**
     * @type {WebGL2RenderingContext}
     */
    //const gl = canvas.getContext("webgl2");
    const gl = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    if (gl === null) {
        showError("WebGL context error");
        throw new Error("WebGL is not defined");
    }

    let ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
        ext = gl.getExtension("EXT_color_buffer_half_float");
        if (!ext) {
            showError("This device doesnt support FLOAT Framebuffers.");
            return;
        }
    }

    AllocateCommonRenderingResources(gl);

    //Create RenderTargets
    const RenderTargetSize = { x: 512, y: 512 };

    AllocateMainRenderTargets(gl, RenderTargetSize);

    //const DebugColorTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg", true);

    //GUI
    if (APP_ENVIRONMENT === "development") {
        DrawUI(GSettings);
    }

    GetMousePosNDC(canvas);

    gl.clearColor(0.05, 0.05, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FirePlanePass = new RFirePlanePass(gl);

    const FlameParticles = new ParticlesEmitter(gl, FlameParticlesDesc);

    //generate intermediate texture for Blur
    const RenderTargetMIPForBlur = 4.0;
    const RenderTargetMIPSize = {
        x: RenderTargetSize.x / Math.pow(2.0, RenderTargetMIPForBlur),
        y: RenderTargetSize.y / Math.pow(2.0, RenderTargetMIPForBlur),
    };
    SetupPostProcessPasses(gl, RenderTargetMIPSize);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null && GRenderTargets.FirePlaneTexture !== null && GPostProcessPasses.CopyPresemt !== null) {
            UpdateTime();

            if (bMouseDown) {
                const curMouseDir = { x: 0, y: 0 };
                curMouseDir.x = CGConstants.MousePosNDC.x - CGConstants.PrevMousePosNDC.x;
                curMouseDir.y = CGConstants.MousePosNDC.y - CGConstants.PrevMousePosNDC.y;
                const mouseDirLength = MathGetVectorLength(curMouseDir);
                let applierSize;
                if (CGConstants.bMouseMoved == false) {
                    applierSize = 0.005;
                    curMouseDir.x = 0;
                    curMouseDir.y = 1;
                } else {
                    applierSize = MathClamp(mouseDirLength * 0.5, 0.001, 0.05);
                }
                FirePlanePass.ApplyFire(gl, CGConstants.MousePosNDC, applierSize, MathVectorNormalize(curMouseDir));
            }

            FirePlanePass.UpdateFire(gl);

            FlameParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);

            BindRenderTarget(gl, GRenderTargets.FirePlaneFramebuffer!, RenderTargetSize, true);

            FirePlanePass.VisualizeFire(gl);

            BindRenderTarget(gl, GRenderTargets.FlameFramebuffer!, RenderTargetSize, true);

            FlameParticles.Render(gl);

            GPostProcessPasses.FlamePostProcess!.Execute(
                gl,
                GRenderTargets.FlameTexture!,
                GRenderTargets.FlameFramebuffer2!,
                RenderTargetSize,
            );

            if (GPostProcessPasses.Bloom!.BloomTexture !== null) {
                //Downsample Source
                gl.bindTexture(gl.TEXTURE_2D, GRenderTargets.FirePlaneTexture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, GRenderTargets.FlameTexture2);
                gl.generateMipmap(gl.TEXTURE_2D);

                GPostProcessPasses.Bloom!.PrePass(
                    gl,
                    GRenderTargets.FlameTexture2!,
                    GRenderTargets.FirePlaneTexture,
                    4.0,
                );

                for (let i = 0; i < GPostProcessPasses.BloomNumBlurPasses; i++) {
                    GPostProcessPasses.Bloom!.Blur(gl, GPostProcessPasses.Blur!);
                }

                GPostProcessPasses.Combiner!.Execute(
                    gl,
                    GRenderTargets.FirePlaneTexture!,
                    GRenderTargets.FlameTexture!,
                    GPostProcessPasses.Bloom!.BloomTexture,
                    null,
                    {
                        x: canvas.width,
                        y: canvas.height,
                    },
                );
            }

            /* if (RenderTargetMain !== null) {
                PresentPass.Execute(gl, canvas, RenderTargetMain, null, { x: canvas.width, y: canvas.height });
            } */

            CGConstants.bMouseMoved = false;

            if (gl !== null) {
                if (CheckGL(gl) && GSettings.bRunSimulation) {
                    requestAnimationFrame(RenderLoop);
                }
            }
        }

        // }
    }

    if (gl !== null) {
        RenderLoop();
    }
}

try {
    RenderMain();
} catch (e) {
    showError(`JS Exception: ${e}`);
}
