import { RBackgroundRenderPass, RBurntStampVisualizer, RRenderGlow, RSpotlightRenderPass } from "./backgroundScene";
import { RFirePlanePass } from "./firePlane";
import { getCanvas } from "./helpers/canvas";
import { DrawUISingleton } from "./helpers/gui";
import { ParticlesEmitter } from "./particles";
import {
    AfterBurnAshesParticlesDesc,
    AfterBurnSmokeParticlesDesc,
    DustParticlesDesc,
    EmberParticlesDesc,
    FlameParticlesDesc,
    SmokeParticlesDesc,
} from "./particlesConfig";
import { RBloomPass, RBlurPass, RCombinerPass, RFlamePostProcessPass, RPresentPass } from "./postprocess";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
    BindRenderTarget,
    CreateFramebufferWithAttachment,
    CreateTextureRT,
    ReadPixelsAsync,
    AsyncPixelReadingState,
} from "./resourcesUtils";
import {
    AssignSceneDescription,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AssignSceneDescriptions,
    GSceneDesc,
    GSceneDescSubmitDebugUI,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GSceneStateDescsArray,
    GScreenDesc,
    InitializeSceneStateDescsArr,
    UpdateSceneStateDescsArr,
} from "./scene";
import { CheckGL } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";

import { GUserInputDesc, InitUserInputEvents, UserInputUpdatePerFrame } from "./input";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Vector2 } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GTime,
    MathAlignToPowerOf2,
    MathClamp,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MathGetVectorLength,
    MathLerp,
    MathMapToRange,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MathSmoothstep,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MathVector2Normalize,
    MathVector3Add,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MathVector3Negate,
    UpdateTime,
    showError,
    uint16ToFloat16,
} from "./utils";
import { ApplyCameraControl, SetupCameraControlThroughInput } from "./controller";
import { RSpatialControllerVisualizationRenderer, SpatialControlPoint } from "./spatialController";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { APP_ENVIRONMENT, IMAGE_STORE_SINGLETON_INSTANCE } from "../config/config";
import { AnimationController } from "./animationController";
import { AudioEngineSingleton } from "./audioEngine";
import { LighterTool } from "./tools";
import { GTexturePool } from "./texturePool";
import { GReactGLBridgeFunctions } from "./reactglBridge";

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
    RenderTargetMIPForBloom: number;
} = {
    CopyPresemt: null,
    Blur: null,
    Bloom: null,
    FlamePostProcess: null,
    Combiner: null,
    BloomNumBlurPasses: 3,
    RenderTargetMIPForBloom: 4,
};

//TODO: Backup texture for reallocation, to avoid flickering when window is resized
function SetupBloomPostProcessPass(gl: WebGL2RenderingContext) {
    //const desiredBloomTexSize = 64; //aligned to smallest screen side
    const desiredBloomTexSize = 32; //aligned to smallest screen side

    const alignedRTSize = {
        x: MathAlignToPowerOf2(GScreenDesc.RenderTargetSize.x),
        y: MathAlignToPowerOf2(GScreenDesc.RenderTargetSize.y),
    };

    GPostProcessPasses.RenderTargetMIPForBloom = Math.log2(
        (GScreenDesc.ScreenRatio < 1 ? alignedRTSize.x : alignedRTSize.y) / desiredBloomTexSize,
    );

    const bloomTextureSize = {
        x: GScreenDesc.RenderTargetSize.x / Math.pow(2.0, GPostProcessPasses.RenderTargetMIPForBloom),
        y: GScreenDesc.RenderTargetSize.y / Math.pow(2.0, GPostProcessPasses.RenderTargetMIPForBloom),
    };
    GPostProcessPasses.Bloom = new RBloomPass(gl, bloomTextureSize, GPostProcessPasses.RenderTargetMIPForBloom);
}

function SetupPostProcessPasses(gl: WebGL2RenderingContext) {
    GPostProcessPasses.CopyPresemt = new RPresentPass(gl);
    GPostProcessPasses.Blur = new RBlurPass(gl);
    GPostProcessPasses.Combiner = new RCombinerPass(gl);
    GPostProcessPasses.FlamePostProcess = new RFlamePostProcessPass(gl);
    SetupBloomPostProcessPass(gl);
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
    SpotlightTexture: WebGLTexture | null;
    SpotlightFramebuffer: WebGLFramebuffer | null;
    bUseHalfResRT: boolean;
} = {
    FirePlaneTexture: null,
    FirePlaneFramebuffer: null,
    FlameTexture: null,
    FlameFramebuffer: null,
    FlameTexture2: null,
    FlameFramebuffer2: null,
    SmokeTexture: null,
    SmokeFramebuffer: null,
    SpotlightTexture: null,
    SpotlightFramebuffer: null,
    bUseHalfResRT: false,
};

function AllocateMainRenderTargets(gl: WebGL2RenderingContext) {
    const size = GScreenDesc.RenderTargetSize;
    GScreenDesc.HalfResRenderTargetSize = GRenderTargets.bUseHalfResRT
        ? { x: GScreenDesc.RenderTargetSize.x * 0.5, y: GScreenDesc.RenderTargetSize.y * 0.5 }
        : GScreenDesc.RenderTargetSize;
    const textureInternalFormat = gl.R11F_G11F_B10F;
    const textureFormat = gl.RGB;
    const textureType = gl.HALF_FLOAT;

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
    GRenderTargets.SmokeTexture = CreateTextureRT(
        gl,
        GScreenDesc.HalfResRenderTargetSize,
        gl.RGBA8,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
    );
    GRenderTargets.SmokeFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.SmokeTexture!);

    //Spotlight
    GRenderTargets.SpotlightTexture = CreateTextureRT(gl, GScreenDesc.RenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);
    GRenderTargets.SpotlightFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.SpotlightTexture!);
}

export function RenderMain() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const DEBUG_ENV = APP_ENVIRONMENT === "development";
    const DEBUG_UI = 1 && DEBUG_ENV;
    const DEBUG_STOP_SIMULATION = 0 && DEBUG_ENV;

    const canvas = getCanvas();

    const GAudioEngine = AudioEngineSingleton.getInstance();
    if (GAudioEngine.audioContext) {
        GAudioEngine.loadSounds();
    }

    //=========================
    // 		INPUT EVENTS
    //=========================
    InitUserInputEvents(canvas);

    SetupCameraControlThroughInput();

    //=========================
    // 	  WINDOW RESIZE INIT
    //=========================
    function GetWindowSizeCurrent(): Vector2 {
        const maxDPR = 2;
        const dpr = MathClamp(window.devicePixelRatio, 1, maxDPR);
        if (dpr > 1) {
            GRenderTargets.bUseHalfResRT = true;
        } else {
            GRenderTargets.bUseHalfResRT = false;
        }
        return { x: Math.round(window.innerWidth * dpr), y: Math.round(window.innerHeight * dpr) };
    }

    function OnWindowResize() {
        console.log("Window Resized");
        GScreenDesc.WindowSize = GetWindowSizeCurrent();
        canvas.width = GScreenDesc.WindowSize.x;
        canvas.height = GScreenDesc.WindowSize.y;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        canvas.style.display = "block";
        GScreenDesc.RenderTargetSize = { x: GScreenDesc.WindowSize.x, y: GScreenDesc.WindowSize.y };
        GScreenDesc.ScreenRatio = window.innerWidth / window.innerHeight;
        GScreenDesc.bWideScreen = GScreenDesc.ScreenRatio > 1.0;
        GScreenDesc.ViewRatioXY = { x: 1.0, y: 1.0 };
        if (GScreenDesc.bWideScreen) {
            GScreenDesc.ViewRatioXY.x = window.innerWidth / window.innerHeight;
        } else {
            GScreenDesc.ViewRatioXY.y = window.innerHeight / window.innerWidth;
        }
    }

    // Call the resizeCanvas function initially and whenever the window is resized
    OnWindowResize();

    if (!canvas) {
        showError("Canvas Error");
    }

    /**
     * @type {WebGL2RenderingContext}
     */
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

    GTexturePool.ExtASTC = gl.getExtension("WEBGL_compressed_texture_astc");

    //==============================
    // 		ALLOCATE RESOURCES
    //==============================
    AllocateCommonRenderingResources(gl);

    //Allocate RenderTargets
    AllocateMainRenderTargets(gl);

    //GPU-CPU Readback Resources
    const GGpuReadData = {
        CurFireValueCPUArrBuffer: new Uint16Array(1),
        CurFireValueCPU: 0.0,
        ReadbackBuffer: gl.createBuffer(),
        InitReadbackBuffer: function () {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.ReadbackBuffer);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, this.CurFireValueCPUArrBuffer.byteLength, gl.STREAM_READ);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        },
        StateRef: { bReadingPixels: false } as AsyncPixelReadingState,
    };
    GGpuReadData.InitReadbackBuffer();

    //==============================
    // 		INIT RENDERERS
    //==============================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const BackGroundRenderPass = new RBackgroundRenderPass(gl);
    const SpotlightRenderPass = new RSpotlightRenderPass(gl);
    const BurntStampSprite = new RBurntStampVisualizer(gl);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const GlowRender = new RRenderGlow(gl);

    SetupPostProcessPasses(gl);

    const SpatialControlUIVisualizer = new RSpatialControllerVisualizationRenderer(gl);

    //======================
    // 		INIT TOOLS
    //======================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const CurTool = new LighterTool(gl);

    //==============================
    // 	   INIT BURNING SURFACE
    //==============================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FirePlaneSizePixels = { x: 512, y: 512 };
    //const FirePlaneSizePixels = { x: 1024, y: 1024 };
    const BurningSurface = new RFirePlanePass(gl, FirePlaneSizePixels);
    //BurningSurface.SetToBurned(gl);

    const firePlanePos = GSceneDesc.FirePlane.PositionOffset;
    const FirePlaneAnimationController = new AnimationController(
        firePlanePos,
        MathVector3Add(firePlanePos, { x: 0, y: -0.05, z: 0.0 }),
        MathVector3Add(firePlanePos, { x: 0, y: 0.05, z: 0.0 }),
    );

    //==============================
    // 		INIT PARTICLES
    //==============================
    if (GScreenDesc.bWideScreen) {
        /* EmberParticlesDesc.inDownwardForceScale = 2.5;
        AfterBurnAshesParticlesDesc.inDownwardForceScale = 2.5;
        SmokeParticlesDesc.inDownwardForceScale = 2.5; */
    }
    const bPaperMaterial = false;
    const bAshesInEmbersPass = 0;
    if (bPaperMaterial) {
        //FlameParticlesDesc.inDefaultSize.y *= 0.9;
        FlameParticlesDesc.inRandomSpawnThres = 0.5;
        FlameParticlesDesc.inSpawnRange.x = 500.0;
        SmokeParticlesDesc.inSpawnRange.x = 5000.0;
        SmokeParticlesDesc.inAlphaScale = 0.75;
        SmokeParticlesDesc.inEAlphaFade = 1;
        //SmokeParticlesDesc.inBrightness = 0.0;
        AfterBurnSmokeParticlesDesc.inSpawnRange.x = 0.1;

        AfterBurnAshesParticlesDesc.inSpawnRange.x = 0.05;
        AfterBurnAshesParticlesDesc.inSpawnRange.y = 10.05;
        AfterBurnAshesParticlesDesc.inNumSpawners2D = 64;
        AfterBurnAshesParticlesDesc.inVelocityFieldForceScale = 50;
        AfterBurnAshesParticlesDesc.inInitialVelocityScale = 1.0;
        EmberParticlesDesc.inVelocityFieldForceScale = 50;
        EmberParticlesDesc.inNumSpawners2D = 32;
        SmokeParticlesDesc.inVelocityFieldForceScale = 30;

        //DustParticlesDesc.inVelocityFieldForceScale = 50;

        //BackGroundRenderPass.FloorTransform.Translation = -0.35;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FlameParticles = new ParticlesEmitter(gl, FlameParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const EmberParticles = new ParticlesEmitter(gl, EmberParticlesDesc);
    //
    SmokeParticlesDesc.inAlphaScale = 0.2 + Math.random() * 0.8;
    SmokeParticlesDesc.inBuoyancyForceScale = MathLerp(10.0, 20.0, Math.random());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
    AfterBurnSmokeParticlesDesc.inAlphaScale = 0.25 + Math.random() * 0.5;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AfterBurnSmokeParticles = new ParticlesEmitter(gl, AfterBurnSmokeParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AshesParticles = new ParticlesEmitter(gl, AfterBurnAshesParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    /* DustParticlesDesc.inBuoyancyForceScale = 5.0 * Math.random();
    DustParticlesDesc.inDownwardForceScale = DustParticlesDesc.inBuoyancyForceScale * 2.0; */
    const DustParticles = new ParticlesEmitter(gl, DustParticlesDesc);

    //==============================
    // 		INIT GUI ELEMENTS
    //==============================
    const SpotlightPositionController = new SpatialControlPoint(
        gl,
        { x: 0.0, y: 0.9 },
        0.075,
        true,
        `spotLightIcon2_R8`,
        `spotLightIcon2Inv`,
    );
    SpotlightPositionController.bEnabled = false;
    function ApplySpotlightControlFromGUI() {
        if (SpotlightPositionController.bIntersectionThisFrame) {
            //Control Spotlight
            const controllerPosNDC = {
                x: SpotlightPositionController.PositionViewSpace.x / GScreenDesc.ScreenRatio,
                y: SpotlightPositionController.PositionViewSpace.y,
            };
            const xRange = 3.0;
            const spotLightXMapped = MathMapToRange(controllerPosNDC.x, -1.0, 1.0, -xRange, xRange);
            GSceneDesc.Spotlight.Position.x = spotLightXMapped;

            const yRange = { min: -0.0, max: 3.0 };
            let spotLightYMapped = MathMapToRange(controllerPosNDC.y, 1.0, -0.5, yRange.max, yRange.min);
            spotLightYMapped = MathClamp(spotLightYMapped, yRange.min, yRange.max);
            spotLightYMapped =
                spotLightYMapped -
                2.0 *
                    (1.0 - Math.abs(controllerPosNDC.x)) *
                    MathClamp(MathMapToRange(controllerPosNDC.y, 0.0, -1.0, 0.0, 1.0), 0.0, 1.0);
            GSceneDesc.Spotlight.Position.y = spotLightYMapped;

            const yFocusRange = { min: 0.0, max: 0.75 };
            let spotLightFocusYMapped = MathMapToRange(controllerPosNDC.y, 0.5, -1.0, yRange.min, yRange.max);
            spotLightFocusYMapped = MathClamp(spotLightFocusYMapped, yFocusRange.min, yFocusRange.max);
            const yFocusAdditional =
                Math.abs(controllerPosNDC.x) * MathMapToRange(controllerPosNDC.y, 0.75, -0.5, 1.0, 0);
            GSceneDesc.Spotlight.FocusPosition.y = spotLightFocusYMapped + yFocusAdditional;

            const zRange = { min: -3, max: -1.0 };
            const spotLightZMapped = MathMapToRange(controllerPosNDC.y, 1.0, -1.0, zRange.max, zRange.min);
            GSceneDesc.Spotlight.Position.z = spotLightZMapped;

            GSceneDesc.Spotlight.SizeScale.y = 2.5 + Math.abs(controllerPosNDC.x) * 0.75 * GScreenDesc.ScreenRatio;
        }
    }

    const ConnectWalletButtonController = new SpatialControlPoint(
        gl,
        { x: -0.75, y: 0.0 },
        0.35,
        false,
        `connectButton`,
        `connectButton1`,
    );
    ConnectWalletButtonController.bEnabled = false;
    //==============================
    // 	 INIT SCENE STATES DESCS
    //==============================
    InitializeSceneStateDescsArr();
    UpdateSceneStateDescsArr();

    //===================
    // 		DEBUG UI
    //===================
    let fpsElem: Element | null;
    if (DEBUG_UI) {
        const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
        if (GDatGUI) {
            //For global vars
            {
                GDatGUI.close();

                GDatGUI.add(GSettings, "bRunSimulation").name("Run Simulation");

                const folder = GDatGUI.addFolder("Main");

                folder.add(GTime, "DeltaMs").name("DeltaTime").listen().step(0.1);
                folder.add(GTime, "Cur").name("CurTime").listen().step(0.0001);

                folder.add(GScreenDesc, "ScreenRatio").name("ScreenRatio").listen().step(0.01);
                folder.add(GScreenDesc.WindowSize, "y").name("Resolution").listen().step(0.01);

                folder.add(GGpuReadData, "CurFireValueCPU").listen().step(0.001);

                folder.add(GPostProcessPasses, "BloomNumBlurPasses", 0, 10, 1).name("BloomNumBlurPasses");

                //State Debug UI
                const stateFolder = GDatGUI.addFolder("States");
                const StateMachineInner = { StateCurrent: ERenderingState.Intro };
                const stateController = stateFolder
                    .add(StateMachineInner, "StateCurrent", ERenderingState)
                    .name("Current State");
                stateController.onChange((value: number) => {
                    GRenderingStateMachine.SetRenderingState(+value);
                });
            }

            GSceneDescSubmitDebugUI(GDatGUI);

            BurningSurface.SubmitDebugUI(GDatGUI);
            BackGroundRenderPass.SubmitDebugUI(GDatGUI);
            CurTool.SubmitDebugUI(GDatGUI);
            GTexturePool.SubmitDebugUI(GDatGUI);
        }

        //deprecated fpsElem = document.querySelector("#fps");
        //enableFPSContainer();
    }

    //=============================================================================================================================
    //
    // 														RENDER LOOP
    //
    //=============================================================================================================================

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
    let GFirstRenderingFrame = true;
    let bInitialImagePreProcessed = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null && GRenderTargets.FirePlaneTexture !== null && GPostProcessPasses.CopyPresemt !== null) {
            //Debug UI
            if (APP_ENVIRONMENT === "development") {
                GTexturePool.LogTexturesInPool();
            }

            const RenderStateMachine = GRenderingStateMachine.GetInstance();
            const bNewRenderStateThisFrame = RenderStateMachine.bWasNewStateProcessed();
            const bPreloaderState = RenderStateMachine.currentState == ERenderingState.Preloading;

            //=========================
            // 		WINDOW RESIZE
            //=========================
            const windowSizeCur = GetWindowSizeCurrent();
            if (canvas.width !== windowSizeCur.x || canvas.height !== windowSizeCur.y) {
                //Resize
                OnWindowResize();
                AllocateMainRenderTargets(gl);
                SetupBloomPostProcessPass(gl);
                UpdateSceneStateDescsArr();
                if (RenderStateMachine.transitionParameter > 1.0) {
                    AssignSceneDescription(GSceneStateDescsArray[RenderStateMachine.currentState]);
                }
            }

            UpdateTime();
            if (fpsElem) {
                fpsElem.textContent = GTime.FPSAvrg.toFixed(1);
            }

            UserInputUpdatePerFrame();

            //============================
            // 		SCENE STATE UPDATE
            //============================
            let newState = RenderStateMachine.currentState;
            {
                if (RenderStateMachine.bCurStateHasSceneDesc) {
                    if (RenderStateMachine.transitionParameter <= 1.0) {
                        AssignSceneDescriptions(
                            GSceneStateDescsArray[RenderStateMachine.previousState],
                            GSceneStateDescsArray[RenderStateMachine.currentState],
                            RenderStateMachine.transitionParameter,
                        );
                    } else {
                        //AssignSceneDescription(GSceneStateDescsArray[RenderStateMachine.currentState]);
                    }
                }

                RenderStateMachine.AdvanceTransitionParameter();
                if (RenderStateMachine.currentState === ERenderingState.Intro) {
                    if (ConnectWalletButtonController.bEnabled) {
                        //Connect wallet button position alignment
                        {
                            if (GScreenDesc.ViewRatioXY.x > 1) {
                                ConnectWalletButtonController.PositionViewSpace.x = -0.5 * GScreenDesc.ViewRatioXY.x;
                                ConnectWalletButtonController.PositionViewSpace.y = 0.0;
                            } else {
                                ConnectWalletButtonController.PositionViewSpace.x = 0.0;
                                ConnectWalletButtonController.PositionViewSpace.y = 0.5;
                            }
                        }
                        ConnectWalletButtonController.OnUpdate();
                        if (ConnectWalletButtonController.bSelectedThisFrame) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            newState = ERenderingState.Inventory;
                        }
                        if (
                            ConnectWalletButtonController.bIntersectionThisFrame &&
                            ConnectWalletButtonController.bIntersectionThisFrame !==
                                ConnectWalletButtonController.bIntersectionPrevFrame
                        ) {
                            GAudioEngine.PlayClickSound();
                        }
                    }
                }
            }

            //============================
            // 		AFTER PRELOADER
            //============================

            if (GTexturePool.AreAllTexturesLoaded() && !bInitialImagePreProcessed) {
                BurningSurface.FirePlaneImagePreProcess(gl);
                bInitialImagePreProcessed = true;
            }

            if (
                /* GTexturePool.AreAllTexturesLoaded() && */
                1
            ) {
                ApplyCameraControl();

                if (SpotlightPositionController.bEnabled) {
                    SpotlightPositionController.OnUpdate();
                    ApplySpotlightControlFromGUI();
                }

                //Update Iamge Surface with one selected from Inventory
                if (RenderStateMachine.currentState === ERenderingState.Inventory) {
                    const srcImage = IMAGE_STORE_SINGLETON_INSTANCE.getImage();
                    const srcImageUrl = IMAGE_STORE_SINGLETON_INSTANCE.getImageUrl();
                    if (srcImage && srcImageUrl) {
                        BurningSurface.UpdatePlaneSurfaceImage(gl, srcImage, srcImageUrl);
                    }
                }

                //=========================
                // 		TOOL UPDATE
                //=========================
                CurTool.UpdateMain(gl, BurningSurface);

                if (RenderStateMachine.bCanBurn) {
                    if (RenderStateMachine.currentState === ERenderingState.Intro) {
                        if (bNewRenderStateThisFrame) {
                            //BurningSurface.ApplyFireAuto(gl, { x: 0.0, y: -0.5 }, 0.05);
                        }
                    } else {
                        if (RenderStateMachine.currentState !== ERenderingState.BurningFinished) {
                            if (GUserInputDesc.bPointerInputPressedCurFrame) {
                                if (!GUserInputDesc.bPointerInputPressedPrevFrame) {
                                    GAudioEngine.PlayLighterStartSound();
                                } else {
                                    GAudioEngine.PlayLighterGasSound();
                                }
                            } else {
                                GAudioEngine.ForceStopLighterGasSound();
                            }
                        }
                    }
                } else {
                    if (bNewRenderStateThisFrame) {
                        //BurningSurface.Reset(gl);
                    }
                }

                //=========================
                // BURNING SURFACE UPDATE
                //=========================
                //Animation during Viewer state
                if (RenderStateMachine.currentState === ERenderingState.Inventory) {
                    //Animate Burning Surface
                    FirePlaneAnimationController.UpdateSelf();
                    GSceneDesc.FirePlane.PositionOffset = FirePlaneAnimationController.UpdateObjectPosition(
                        GSceneDesc.FirePlane.PositionOffset,
                        0.25,
                    );

                    let t = FirePlaneAnimationController.YawInterpolationParameter;
                    const yawRange = { min: -Math.PI / 4, max: 0.0 };
                    if (GScreenDesc.ScreenRatio < 1.0) {
                        yawRange.min *= 0.25;
                        yawRange.max = Math.abs(yawRange.min);
                    }
                    GSceneDesc.FirePlane.OrientationEuler.yaw = MathLerp(yawRange.min, yawRange.max, t);
                    t = FirePlaneAnimationController.PitchInterpolationParameter;
                    const pitchRange = { min: -Math.PI / 13, max: Math.PI / 13 };
                    if (GScreenDesc.ScreenRatio < 1.0) {
                        pitchRange.min = 0.0;
                    }
                    GSceneDesc.FirePlane.OrientationEuler.pitch = MathLerp(pitchRange.min, pitchRange.max, t);
                } else {
                    GSceneDesc.FirePlane.PositionOffset.z = 0.0;
                    GSceneDesc.FirePlane.OrientationEuler.pitch = 0.0;
                    GSceneDesc.FirePlane.OrientationEuler.yaw = 0.0;
                    GSceneDesc.FirePlane.OrientationEuler.roll = 0.0;
                }
                //Update Main
                BurningSurface.UpdateFire(gl);

                //=============================
                // VIRTUAL POINT LIGHTS UPDATE
                //=============================
                const curFireTexture = BurningSurface.GetCurFireTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, curFireTexture);
                gl.generateMipmap(gl.TEXTURE_2D);
                BackGroundRenderPass.PointLights.Update(gl, curFireTexture);

                //=========================
                // 	BURNING STATE UPDATE
                //=========================
                //Change states depending on cur temperature
                if (
                    RenderStateMachine.currentState === ERenderingState.BurningReady &&
                    GGpuReadData.CurFireValueCPU > 0.05
                ) {
                    GRenderingStateMachine.SetRenderingState(ERenderingState.BurningNow);
                } else if (RenderStateMachine.currentState === ERenderingState.BurningNow) {
                    if (GGpuReadData.CurFireValueCPU < 0.05) {
                        GRenderingStateMachine.SetRenderingState(ERenderingState.BurningFinished);
                        GReactGLBridgeFunctions.OnBurningFinished();
                        //all callback calls here...
                    }
                }

                //=========================
                // 		BURN AUDIO
                //=========================
                if (GGpuReadData.CurFireValueCPU > 0.01) {
                    const curBurnVolume = MathMapToRange(GGpuReadData.CurFireValueCPU, 0.0, 2.0, 0.3, 1.0);
                    GAudioEngine.PlayBurningSound(curBurnVolume);
                }

                //=========================
                // 		PARTICLES UPDATE
                //=========================
                {
                    FlameParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                    EmberParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                    AshesParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                    SmokeParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                    AfterBurnSmokeParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                    DustParticles.Update(gl, BurningSurface.GetCurFireTexture()!);
                }

                //===================================
                // 		VOLUMENTRIC LIGHT RENDER
                //===================================
                {
                    BindRenderTarget(gl, GRenderTargets.SpotlightFramebuffer!, GScreenDesc.RenderTargetSize, true);
                    SpotlightRenderPass.RenderVolumetricLight(gl);
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.FUNC_ADD);
                    SpotlightRenderPass.RenderFlare(gl);
                    gl.disable(gl.BLEND);
                }

                //=============================
                // 		BACKGROUND RENDER
                //=============================
                if (!bPreloaderState) {
                    BindRenderTarget(gl, GRenderTargets.FirePlaneFramebuffer!, GScreenDesc.RenderTargetSize, true);
                    //Render Background floor
                    BackGroundRenderPass.RenderFloor(
                        gl,
                        GPostProcessPasses.Bloom!.GetBloomTextureMIP(3)!,
                        GPostProcessPasses.Combiner!.SmokeNoiseTexture,
                    );
                }

                //=================================
                // 		BURNING SURFACE RENDER
                //=================================
                if (!bPreloaderState) {
                    BurningSurface.VisualizeFirePlane(
                        gl,
                        BackGroundRenderPass.PointLights.LightsBufferTextureGPU!,
                        GRenderTargets.SpotlightTexture!,
                    );

                    if (0 && RenderStateMachine.currentState === ERenderingState.BurningFinished) {
                        //Render BURNT Stamp
                        BurntStampSprite.RunAnimation();
                        if (BurntStampSprite.AnimationT >= 0.95 && !BurntStampSprite.AnimationFinishedEventProcessed) {
                            GAudioEngine.PlayStampSound();
                            BurntStampSprite.AnimationFinishedEventProcessed = true;
                        }
                        gl.enable(gl.BLEND);
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                        gl.blendEquation(gl.FUNC_ADD);
                        BurntStampSprite.Render(gl);
                        gl.disable(gl.BLEND);
                    }
                }
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.MAX);
                SpotlightRenderPass.RenderSourceSprite(gl);

                //======================
                // 		GUI RENDER
                //======================
                {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.MAX);
                    if (SpotlightPositionController.bEnabled) {
                        SpatialControlUIVisualizer.Render(gl, SpotlightPositionController);
                    }

                    if (ConnectWalletButtonController.bEnabled) {
                        if (RenderStateMachine.currentState === ERenderingState.Intro) {
                            SpatialControlUIVisualizer.Render(gl, ConnectWalletButtonController);
                        }
                    }

                    gl.disable(gl.BLEND);
                }

                //======================
                // 		FLAME RENDER
                //======================
                let flameSourceTextureRef = GRenderTargets.FlameTexture;
                BindRenderTarget(gl, GRenderTargets.FlameFramebuffer!, GScreenDesc.RenderTargetSize, true);
                if (CurTool.bActiveThisFrame) {
                    CurTool.Render(gl);
                    CurTool.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                }

                if (1 || RenderStateMachine.bCanBurn) {
                    FlameParticles.Render(gl, gl.MAX, gl.ONE, gl.ONE);

                    GPostProcessPasses.FlamePostProcess!.Execute(
                        gl,
                        GRenderTargets.FlameTexture!,
                        GRenderTargets.FlameFramebuffer2!,
                        GScreenDesc.RenderTargetSize,
                    );
                    flameSourceTextureRef = GRenderTargets.FlameTexture2;

                    EmberParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                    if (bAshesInEmbersPass) {
                        AshesParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    }
                }

                //======================
                // 		BLOOM
                //======================

                if (GPostProcessPasses.Bloom!.BloomTexture !== null) {
                    //Downsample Source
                    gl.bindTexture(gl.TEXTURE_2D, GRenderTargets.FirePlaneTexture);
                    gl.generateMipmap(gl.TEXTURE_2D);
                    gl.bindTexture(gl.TEXTURE_2D, flameSourceTextureRef);
                    gl.generateMipmap(gl.TEXTURE_2D);

                    GPostProcessPasses.Bloom!.HQBloomPrePass(
                        gl,
                        flameSourceTextureRef!,
                        GRenderTargets.FirePlaneTexture,
                    );
                    if (RenderStateMachine.currentState === ERenderingState.Preloading) {
                        gl.enable(gl.BLEND);
                        gl.blendFunc(gl.ONE, gl.ONE);
                        gl.blendEquation(gl.FUNC_ADD);
                        GlowRender.Render(gl);
                        gl.disable(gl.BLEND);
                    }

                    GPostProcessPasses.Bloom!.HQBloomDownsample(gl);
                    GPostProcessPasses.Bloom!.HQBloomBlurAndUpsample(
                        gl,
                        flameSourceTextureRef!,
                        GRenderTargets.FirePlaneTexture,
                        GPostProcessPasses.BloomNumBlurPasses,
                        GPostProcessPasses.Blur!,
                    );

                    /* GPostProcessPasses.Bloom!.PrePass(
                        gl,
                        flameSourceTextureRef!,
                        GRenderTargets.FirePlaneTexture,
                        GRenderTargets.SpotlightTexture!,
                        GPostProcessPasses.RenderTargetMIPForBloom,
                    ); */

                    /* gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.FUNC_ADD);
                    GlowRender.Render(gl);
                    gl.disable(gl.BLEND); */

                    /* for (let i = 0; i < GPostProcessPasses.BloomNumBlurPasses; i++) {
                        GPostProcessPasses.Bloom!.Blur(gl, GPostProcessPasses.Blur!);
                    } */
                }

                //======================
                // 		SMOKE RENDER
                //======================
                BindRenderTarget(gl, GRenderTargets.SmokeFramebuffer!, GScreenDesc.HalfResRenderTargetSize, true);
                DustParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                AfterBurnSmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                if (!bAshesInEmbersPass) {
                    AshesParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                }
                if (CurTool.bActiveThisFrame) {
                    CurTool.SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }

                //======================
                // 		POST PROCESS
                //======================
                GPostProcessPasses.Combiner!.Execute(
                    gl,
                    GRenderTargets.FirePlaneTexture!,
                    flameSourceTextureRef!,
                    GPostProcessPasses.Bloom!.GetFinalTexture()!,
                    GRenderTargets.SmokeTexture!,
                    GRenderTargets.SpotlightTexture!,
                    BackGroundRenderPass.PointLights.LightsBufferTextureGPU!,
                    null,
                    {
                        x: canvas.width,
                        y: canvas.height,
                    },
                );

                //Render BURNT Stamp
                /* {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                    gl.blendEquation(gl.FUNC_ADD);
                    BurntStampSprite.Render(gl);
                    gl.disable(gl.BLEND);
                } */

                //read cur fire value
                {
                    const curFireTextureFramebuffer = BurningSurface.GetCurFireTextureHighestMipFramebuffer();
                    gl.bindFramebuffer(gl.FRAMEBUFFER, curFireTextureFramebuffer);
                    //gl.readPixels(0, 0, 1, 1, gl.RED, gl.HALF_FLOAT, GGpuReadData.CurFireValueCPUArrBuffer, 0);
                    ReadPixelsAsync(
                        gl,
                        GGpuReadData.ReadbackBuffer!,
                        0,
                        0,
                        1,
                        1,
                        gl.RED,
                        gl.HALF_FLOAT,
                        GGpuReadData.CurFireValueCPUArrBuffer,
                        GGpuReadData.StateRef,
                    );
                    GGpuReadData.CurFireValueCPU = uint16ToFloat16(GGpuReadData.CurFireValueCPUArrBuffer.at(0)!);
                }
            } else {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                /* StateControllers.forEach((controller) => {
                    SpatialControlUIVisualizer.Render(gl, controller);
                }); */
            }

            RenderStateMachine.MarkNewStateProcessed();

            if (DEBUG_STOP_SIMULATION && GTexturePool.AreAllTexturesLoaded()) {
                GSettings.bRunSimulation = false;
            }

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
