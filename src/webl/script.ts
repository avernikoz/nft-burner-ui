import { APP_ENVIRONMENT } from "../config/config";
import { RFirePlanePass } from "./firePlane";
import { getCanvas } from "./helpers/canvas";
import { DrawUI, DrawUISingleton } from "./helpers/gui";
import { ParticlesEmitter } from "./particles";
import {
    AfterBurnAshesParticlesDesc,
    AfterBurnSmokeParticlesDesc,
    EmberParticlesDesc,
    FlameParticlesDesc,
    SmokeParticlesDesc,
} from "./particlesConfig";
import { RBloomPass, RBlurPass, RCombinerPass, RFlamePostProcessPass, RPresentPass } from "./postprocess";
import { BindRenderTarget, CreateFramebufferWithAttachment, CreateTextureRT } from "./resourcesUtils";
import { SceneDesc } from "./scene";
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
    SmokeTexture: WebGLTexture | null;
    SmokeFramebuffer: WebGLFramebuffer | null;
} = {
    FirePlaneTexture: null,
    FirePlaneFramebuffer: null,
    FlameTexture: null,
    FlameFramebuffer: null,
    FlameTexture2: null,
    FlameFramebuffer2: null,
    SmokeTexture: null,
    SmokeFramebuffer: null,
};

function AllocateMainRenderTargets(gl: WebGL2RenderingContext, size: Vector2) {
    const textureInternalFormat = gl.R11F_G11F_B10F;
    const textureFormat = gl.RGB;
    const textureType = gl.HALF_FLOAT;
    /* const textureInternalFormat = gl.RGBA8;
    const textureFormat = gl.RGBA;
    const textureType = gl.UNSIGNED_BYTE; */

    //const RenderTargetMainFloat = CreateTextureRT(gl, RenderTargetSize, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    //Fire Plane
    GRenderTargets.FirePlaneTexture = CreateTextureRT(
        gl,
        size,
        textureInternalFormat,
        textureFormat,
        textureType,
        true,
    );
    GRenderTargets.FirePlaneFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.FirePlaneTexture!);

    //Flame
    GRenderTargets.FlameTexture = CreateTextureRT(gl, size, textureInternalFormat, textureFormat, textureType);
    GRenderTargets.FlameFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.FlameTexture!);
    GRenderTargets.FlameTexture2 = CreateTextureRT(gl, size, textureInternalFormat, textureFormat, textureType, true);
    GRenderTargets.FlameFramebuffer2 = CreateFramebufferWithAttachment(gl, GRenderTargets.FlameTexture2!);

    //Smoke
    GRenderTargets.SmokeTexture = CreateTextureRT(gl, size, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    GRenderTargets.SmokeFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.SmokeTexture!);
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
    function OnWindowResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        SceneDesc.ViewportSize = { x: window.innerWidth, y: window.innerHeight };
        SceneDesc.ViewportMin = Math.min(window.innerWidth, window.innerHeight);
        SceneDesc.ScreenRatio = window.innerWidth / window.innerHeight;
        SceneDesc.bWideScreen = SceneDesc.ScreenRatio > 1.0;
        SceneDesc.ViewRatioXY = { x: 1.0, y: 1.0 };
        if (SceneDesc.bWideScreen) {
            SceneDesc.ViewRatioXY.x = window.innerWidth / window.innerHeight;
        } else {
            SceneDesc.ViewRatioXY.y = window.innerHeight / window.innerWidth;
        }
    }

    // Call the resizeCanvas function initially and whenever the window is resized
    //window.addEventListener("resize", OnWindowResize); //@Alex: disabled for now to avoid visual artifacts
    OnWindowResize();

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
    //const RenderTargetSize = { x: 512, y: 512 };
    //TODO: Set base2 size derived from Viewport Size! We need to set Min Max allowed Resolution to prevent performance issues
    const RenderTargetSize = SceneDesc.ViewportSize;

    AllocateMainRenderTargets(gl, RenderTargetSize);

    //const DebugColorTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg", true);

    //GUI
    if (APP_ENVIRONMENT === "development") {
        DrawUI(GSettings);
    }

    GetMousePosNDC(canvas);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FirePlanePass = new RFirePlanePass(gl);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FlameParticles = new ParticlesEmitter(gl, FlameParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const EmberParticles = new ParticlesEmitter(gl, EmberParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AfterBurnSmokeParticles = new ParticlesEmitter(gl, AfterBurnSmokeParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AshesParticles = new ParticlesEmitter(gl, AfterBurnAshesParticlesDesc);

    //generate intermediate texture for Blur
    //TODO: Specify target MIP resolution instead, and deduce MIP Index from it
    //const TextureSizeForBloom = 128;
    const RenderTargetMIPForBloom = 4.0;
    const RenderTargetMIPSize = {
        x: RenderTargetSize.x / Math.pow(2.0, RenderTargetMIPForBloom),
        y: RenderTargetSize.y / Math.pow(2.0, RenderTargetMIPForBloom),
    };
    SetupPostProcessPasses(gl, RenderTargetMIPSize);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null && GRenderTargets.FirePlaneTexture !== null && GPostProcessPasses.CopyPresemt !== null) {
            UpdateTime();

            if (bMouseDown) {
                //If we are in Plane range -> apply fire
                const MousePosNDCPlaneRange = { x: 0, y: 0 };
                MousePosNDCPlaneRange.x =
                    CGConstants.MousePosNDC.x * SceneDesc.ViewRatioXY.x * (2.0 - SceneDesc.FirePlaneSizeScaleNDC);
                MousePosNDCPlaneRange.y =
                    CGConstants.MousePosNDC.y * SceneDesc.ViewRatioXY.y * (2.0 - SceneDesc.FirePlaneSizeScaleNDC);
                if (Math.abs(MousePosNDCPlaneRange.x) < 1.0 && Math.abs(MousePosNDCPlaneRange.y) < 1.0) {
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
                    FirePlanePass.ApplyFire(gl, MousePosNDCPlaneRange, applierSize, MathVectorNormalize(curMouseDir));
                }
            }

            FirePlanePass.UpdateFire(gl);

            FlameParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
            EmberParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
            AshesParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
            SmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
            AfterBurnSmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);

            BindRenderTarget(gl, GRenderTargets.FirePlaneFramebuffer!, RenderTargetSize, true);
            FirePlanePass.VisualizeFirePlane(gl);

            /* GPostProcessPasses.CopyPresemt.Execute(gl, canvas, GRenderTargets.FirePlaneTexture!, 0, null, {
                x: canvas.width,
                y: canvas.height,
            }); */

            BindRenderTarget(gl, GRenderTargets.FlameFramebuffer!, RenderTargetSize, true);
            FlameParticles.Render(gl, gl.MAX, gl.ONE, gl.ONE);

            GPostProcessPasses.FlamePostProcess!.Execute(
                gl,
                GRenderTargets.FlameTexture!,
                GRenderTargets.FlameFramebuffer2!,
                RenderTargetSize,
            );
            const flameSourceTextureRef = GRenderTargets.FlameTexture2;

            EmberParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);

            if (GPostProcessPasses.Bloom!.BloomTexture !== null) {
                //Downsample Source
                gl.bindTexture(gl.TEXTURE_2D, GRenderTargets.FirePlaneTexture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, flameSourceTextureRef);
                gl.generateMipmap(gl.TEXTURE_2D);

                GPostProcessPasses.Bloom!.PrePass(gl, flameSourceTextureRef!, GRenderTargets.FirePlaneTexture, 4.0);

                for (let i = 0; i < GPostProcessPasses.BloomNumBlurPasses; i++) {
                    GPostProcessPasses.Bloom!.Blur(gl, GPostProcessPasses.Blur!);
                }
            }

            BindRenderTarget(gl, GRenderTargets.SmokeFramebuffer!, RenderTargetSize, true);
            SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            AfterBurnSmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            AshesParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            GPostProcessPasses.Combiner!.Execute(
                gl,
                GRenderTargets.FirePlaneTexture!,
                flameSourceTextureRef!,
                GPostProcessPasses.Bloom!.BloomTexture!,
                GRenderTargets.SmokeTexture!,
                null,
                {
                    x: canvas.width,
                    y: canvas.height,
                },
            );

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
