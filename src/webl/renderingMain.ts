import { RBackgroundRenderPass, RBurntStampVisualizer, RSpotlightRenderPass } from "./backgroundScene";
import { RFirePlanePass } from "./firePlane";
import { getCanvas } from "./helpers/canvas";
import { DrawUI, DrawUISingleton } from "./helpers/gui";
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
    GAreAllTexturesLoaded,
    ReadPixelsAsync,
} from "./resourcesUtils";
import {
    AssignSceneDescription,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AssignSceneDescriptions,
    EnableSceneDescUI,
    GSceneDesc,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GSceneStateDescsArray,
    GScreenDesc,
    InitializeSceneStateDescsArr,
    UpdateSceneStateDescsArr,
} from "./scene";
import { CheckGL } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";

import { GUserInputDesc, RegisterUserInput } from "./input";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Vector2 } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GTime,
    MathAlignToPowerOf2,
    MathClamp,
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
import { ApplyCameraControl, SetupCameraControlThroughInput } from "./shaders/controller";
import { RSpatialControllerVisualizationRenderer, SpatialControlPoint } from "./spatialController";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../config/config";
import { AnimationController } from "./animationController";
import { AudioEngine } from "./audioEngine";

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
    const desiredBloomTexSize = 64; //aligned to smallest screen side

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
    GPostProcessPasses.Bloom = new RBloomPass(gl, bloomTextureSize);
}

function SetupPostProcessPasses(gl: WebGL2RenderingContext) {
    GPostProcessPasses.CopyPresemt = new RPresentPass(gl);
    GPostProcessPasses.Blur = new RBlurPass(gl);
    GPostProcessPasses.Combiner = new RCombinerPass(gl);
    GPostProcessPasses.FlamePostProcess = new RFlamePostProcessPass(gl);
    SetupBloomPostProcessPass(gl);

    //Draw UI
    const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
    if (GDatGUI) {
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
    SpotlightTexture: WebGLTexture | null;
    SpotlightFramebuffer: WebGLFramebuffer | null;
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
};

function AllocateMainRenderTargets(gl: WebGL2RenderingContext) {
    const size = GScreenDesc.RenderTargetSize;
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

    //Spotlight
    GRenderTargets.SpotlightTexture = CreateTextureRT(gl, size, gl.R16F, gl.RED, gl.HALF_FLOAT);
    GRenderTargets.SpotlightFramebuffer = CreateFramebufferWithAttachment(gl, GRenderTargets.SpotlightTexture!);
}

export function RenderMain() {
    const canvas = getCanvas();

    const GAudioEngine = new AudioEngine();
    if (GAudioEngine.audioContext) {
        GAudioEngine.loadSounds();
    }

    canvas.addEventListener("mousemove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault(); // Prevent default touchmove behavior, like scrolling
        RegisterUserInput(canvas, e);
    });

    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        RegisterUserInput(canvas, e);
        GUserInputDesc.bPointerInputPressedThisFrame = true;
    });
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = false;
    });

    canvas.addEventListener("touchstart", (e) => {
        RegisterUserInput(canvas, e);
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = true;
    });
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressedThisFrame = false;
    });

    SetupCameraControlThroughInput();

    function GetWindowSizeCurrent(): Vector2 {
        const dpr = MathClamp(window.devicePixelRatio, 1, 3);
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

    //States Controllers
    const stateControllerSize = 0.05;
    const numStateControllers = 6;
    const stateControllersViewSpaceStart = -0.25;
    const stateControllersViewSpaceLength = 0.5;
    const distBBetwenControllers = stateControllersViewSpaceLength / (numStateControllers - 1);
    let curStateControllerPos = stateControllersViewSpaceStart;

    const StateControllers: SpatialControlPoint[] = [];

    StateControllers[0] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon0.png`,
        `assets/background/stateIcon01.png`,
    );
    curStateControllerPos += distBBetwenControllers;
    StateControllers[1] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon1.png`,
        `assets/background/stateIcon11.png`,
    );
    curStateControllerPos += distBBetwenControllers;
    StateControllers[2] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon2.png`,
        `assets/background/stateIcon21.png`,
    );
    curStateControllerPos += distBBetwenControllers;
    StateControllers[3] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon3.png`,
        `assets/background/stateIcon31.png`,
    );
    curStateControllerPos += distBBetwenControllers;
    StateControllers[4] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon3.png`,
        `assets/background/stateIcon31.png`,
    );
    curStateControllerPos += distBBetwenControllers;
    StateControllers[5] = new SpatialControlPoint(
        gl,
        { x: curStateControllerPos, y: -0.75 },
        stateControllerSize,
        false,
        `assets/background/stateIcon3.png`,
        `assets/background/stateIcon31.png`,
    );

    AllocateCommonRenderingResources(gl);

    //Allocate RenderTargets
    AllocateMainRenderTargets(gl);

    //const DebugColorTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg", true);

    //GUI
    DrawUI(GSettings);

    //CurFire CPU
    const GGpuReadData = {
        CurFireValueCPUArrBuffer: new Uint16Array(1),
        CurFireValueCPU: 0.0,
        ReadbackBuffer: gl.createBuffer(),
        InitReadbackBuffer: function () {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.ReadbackBuffer);
            gl.bufferData(gl.PIXEL_PACK_BUFFER, this.CurFireValueCPUArrBuffer.byteLength, gl.STREAM_READ);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        },
    };
    GGpuReadData.InitReadbackBuffer();

    {
        const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
        if (GDatGUI) {
            GDatGUI.add(GGpuReadData, "CurFireValueCPU").listen().step(0.001);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const BackGroundRenderPass = new RBackgroundRenderPass(gl);
    const SpotlightRenderPass = new RSpotlightRenderPass(gl);
    const BurntStampSprite = new RBurntStampVisualizer(gl);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FirePlaneSizePixels = { x: 512, y: 512 };
    const FirePlanePass = new RFirePlanePass(gl, FirePlaneSizePixels);

    const firePlanePos = GSceneDesc.FirePlane.PositionOffset;
    const FirePlaneAnimationController = new AnimationController(
        firePlanePos,
        MathVector3Add(firePlanePos, { x: 0, y: -0.05, z: 0.0 }),
        MathVector3Add(firePlanePos, { x: 0, y: 0.05, z: 0.0 }),
    );

    if (GScreenDesc.bWideScreen) {
        /* EmberParticlesDesc.inDownwardForceScale = 2.5;
        AfterBurnAshesParticlesDesc.inDownwardForceScale = 2.5;
        SmokeParticlesDesc.inDownwardForceScale = 2.5; */
    }

    const bPaperMaterial = false;
    const bAshesInEmbersPass = 0 && bPaperMaterial;
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
    SmokeParticlesDesc.inAlphaScale = 0.25 + Math.random() * 0.7;
    SmokeParticlesDesc.inBuoyancyForceScale = MathLerp(5.0, 20.0, Math.random());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
    AfterBurnSmokeParticlesDesc.inAlphaScale = 0.25 + Math.random() * 0.5;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AfterBurnSmokeParticles = new ParticlesEmitter(gl, AfterBurnSmokeParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const AshesParticles = new ParticlesEmitter(gl, AfterBurnAshesParticlesDesc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const DustParticles = new ParticlesEmitter(gl, DustParticlesDesc);

    SetupPostProcessPasses(gl);

    EnableSceneDescUI();

    const SpatialControlUIVisualizer = new RSpatialControllerVisualizationRenderer(gl);
    const SpotlightPositionController = new SpatialControlPoint(
        gl,
        { x: 0.0, y: 0.9 },
        0.075,
        true,
        `assets/background/spotLightIcon2.png`,
        `assets/background/spotLightIcon2Inv.png`,
    );

    const ConnectWalletButtonController = new SpatialControlPoint(
        gl,
        { x: -0.75, y: 0.0 },
        0.35,
        false,
        `assets/background/connectButton.png`,
        `assets/background/connectButton1.png`,
    );

    let GFirstRenderingFrame = true;

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

    InitializeSceneStateDescsArr();
    UpdateSceneStateDescsArr();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null && GRenderTargets.FirePlaneTexture !== null && GPostProcessPasses.CopyPresemt !== null) {
            const RenderStateMachine = GRenderingStateMachine.GetInstance();
            const bNewRenderStateThisFrame = RenderStateMachine.bWasNewStateProcessed();

            //Handle possible resize
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

            //Handle State transition if present
            if (RenderStateMachine.transitionParameter <= 1.0) {
                AssignSceneDescriptions(
                    GSceneStateDescsArray[RenderStateMachine.previousState],
                    GSceneStateDescsArray[RenderStateMachine.currentState],
                    RenderStateMachine.transitionParameter,
                );
            } else {
                //AssignSceneDescription(GSceneStateDescsArray[RenderStateMachine.currentState]);
            }

            RenderStateMachine.AdvanceTransitionParameter();

            let newState = RenderStateMachine.currentState;
            if (RenderStateMachine.currentState == ERenderingState.Intro) {
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

            StateControllers.forEach((controller) => {
                controller.OnUpdate();
            });
            //Check for clicked states UIs
            for (let i = 0; i < numStateControllers; i++) {
                if (StateControllers[i].bSelectedThisFrame) {
                    newState = i;
                }
                if (
                    StateControllers[i].bIntersectionThisFrame &&
                    StateControllers[i].bIntersectionThisFrame !== StateControllers[i].bIntersectionPrevFrame
                ) {
                    GAudioEngine.PlayClickSound();
                }
            }
            if (newState != RenderStateMachine.currentState) {
                //...
                //GAudioEngine.PlayIntroSound();

                GRenderingStateMachine.SetRenderingState(newState);
            }

            /* StateControllers.forEach((controller) => {
                controller.ClearState();
            }); */
            StateControllers[RenderStateMachine.currentState].bSelectedThisFrame = true;
            StateControllers[RenderStateMachine.currentState].bIntersectionThisFrame = true;

            if (
                GAreAllTexturesLoaded() &&
                (GFirstRenderingFrame || RenderStateMachine.currentState !== ERenderingState.Preloading)
            ) {
                if (GFirstRenderingFrame) {
                    GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady, true);
                    GFirstRenderingFrame = false;
                }

                ApplyCameraControl();

                if (RenderStateMachine.currentState == ERenderingState.Inventory) {
                    //Animate Fire Plane
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

                SpotlightPositionController.OnUpdate();
                ApplySpotlightControlFromGUI();

                if (RenderStateMachine.bCanBurn) {
                    if (RenderStateMachine.currentState === ERenderingState.Intro) {
                        if (bNewRenderStateThisFrame) {
                            //FirePlanePass.ApplyFireAuto(gl, { x: 0.0, y: -0.5 }, 0.05);
                        }
                    } else {
                        if (RenderStateMachine.currentState !== ERenderingState.BurningFinished) {
                            if (
                                GUserInputDesc.bPointerInputPressedThisFrame &&
                                !SpotlightPositionController.bIntersectionThisFrame
                            ) {
                                FirePlanePass.ApplyFireFromInput(gl);
                            }

                            if (GUserInputDesc.bPointerInputPressedThisFrame) {
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
                        FirePlanePass.Reset(gl);
                    }
                }

                FirePlanePass.UpdateFire(gl);

                const curFireTexture = FirePlanePass.GetCurFireTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, curFireTexture);
                gl.generateMipmap(gl.TEXTURE_2D);
                BackGroundRenderPass.PointLights.Update(gl, curFireTexture);

                //Change states depending on cur temperature
                if (
                    RenderStateMachine.currentState === ERenderingState.BurningReady &&
                    GGpuReadData.CurFireValueCPU > 0.05
                ) {
                    GRenderingStateMachine.SetRenderingState(ERenderingState.BurningNow);
                } else if (RenderStateMachine.currentState === ERenderingState.BurningNow) {
                    if (GGpuReadData.CurFireValueCPU < 0.05) {
                        GRenderingStateMachine.SetRenderingState(ERenderingState.BurningFinished);
                        //all callback calls here...
                    }
                }

                if (GGpuReadData.CurFireValueCPU > 0.01) {
                    const curBurnVolume = MathMapToRange(GGpuReadData.CurFireValueCPU, 0.0, 2.0, 0.3, 1.0);
                    GAudioEngine.PlayBurningSound(curBurnVolume);
                }

                FlameParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                EmberParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                AshesParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                SmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                AfterBurnSmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);

                DustParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);

                BindRenderTarget(gl, GRenderTargets.SpotlightFramebuffer!, GScreenDesc.RenderTargetSize, true);
                SpotlightRenderPass.RenderVolumetricLight(gl);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);
                SpotlightRenderPass.RenderFlare(gl);

                gl.disable(gl.BLEND);

                BindRenderTarget(gl, GRenderTargets.FirePlaneFramebuffer!, GScreenDesc.RenderTargetSize, true);
                //Render Background floor
                if (GPostProcessPasses.Bloom!.BloomTexture !== null) {
                    BackGroundRenderPass.RenderFloor(
                        gl,
                        GPostProcessPasses.Bloom!.BloomTexture,
                        GPostProcessPasses.Combiner!.SmokeNoiseTexture,
                    );
                }
                //Render Main Burner Plane Surface
                {
                    //Update Iamge Surface with one selected from Inventory
                    if (RenderStateMachine.currentState === ERenderingState.Inventory) {
                        const srcImage = IMAGE_STORE_SINGLETON_INSTANCE.getImage();
                        const srcImageUrl = IMAGE_STORE_SINGLETON_INSTANCE.getImageUrl();
                        if (srcImage && srcImageUrl) {
                            FirePlanePass.UpdatePlaneSurfaceImage(gl, srcImage, srcImageUrl);
                        }
                    }

                    FirePlanePass.VisualizeFirePlane(
                        gl,
                        BackGroundRenderPass.PointLights.LightsBufferTextureGPU!,
                        GRenderTargets.SpotlightTexture!,
                    );

                    if (RenderStateMachine.currentState === ERenderingState.BurningFinished) {
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

                //Control UI
                {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.MAX);
                    SpatialControlUIVisualizer.Render(gl, SpotlightPositionController);

                    if (RenderStateMachine.currentState == ERenderingState.Intro) {
                        SpatialControlUIVisualizer.Render(gl, ConnectWalletButtonController);
                    }

                    StateControllers.forEach((controller) => {
                        SpatialControlUIVisualizer.Render(gl, controller);
                    });
                    gl.disable(gl.BLEND);
                }

                let flameSourceTextureRef = GRenderTargets.FlameTexture;
                if (1 || RenderStateMachine.bCanBurn) {
                    BindRenderTarget(gl, GRenderTargets.FlameFramebuffer!, GScreenDesc.RenderTargetSize, true);
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

                if (GPostProcessPasses.Bloom!.BloomTexture !== null) {
                    //Downsample Source
                    gl.bindTexture(gl.TEXTURE_2D, GRenderTargets.FirePlaneTexture);
                    gl.generateMipmap(gl.TEXTURE_2D);
                    gl.bindTexture(gl.TEXTURE_2D, flameSourceTextureRef);
                    gl.generateMipmap(gl.TEXTURE_2D);

                    GPostProcessPasses.Bloom!.PrePass(
                        gl,
                        flameSourceTextureRef!,
                        GRenderTargets.FirePlaneTexture,
                        GRenderTargets.SpotlightTexture!,
                        GPostProcessPasses.RenderTargetMIPForBloom,
                    );

                    for (let i = 0; i < GPostProcessPasses.BloomNumBlurPasses; i++) {
                        GPostProcessPasses.Bloom!.Blur(gl, GPostProcessPasses.Blur!);
                    }
                }

                //Render Smoke
                BindRenderTarget(gl, GRenderTargets.SmokeFramebuffer!, GScreenDesc.RenderTargetSize, true);
                DustParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                AfterBurnSmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                if (!bAshesInEmbersPass) {
                    AshesParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
                }

                //Combine results
                GPostProcessPasses.Combiner!.Execute(
                    gl,
                    GRenderTargets.FirePlaneTexture!,
                    flameSourceTextureRef!,
                    GPostProcessPasses.Bloom!.BloomTexture!,
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
            } else {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                StateControllers.forEach((controller) => {
                    SpatialControlUIVisualizer.Render(gl, controller);
                });
            }

            GUserInputDesc.bPointerInputActiveThisFrame = false;
            GUserInputDesc.bPointerInputPressedPrevFrame = GUserInputDesc.bPointerInputPressedThisFrame;

            RenderStateMachine.MarkNewStateProcessed();

            //read cur fire value
            {
                const curFireTextureFramebuffer = FirePlanePass.GetCurFireTextureHighestMipFramebuffer();
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
                );
                GGpuReadData.CurFireValueCPU = uint16ToFloat16(GGpuReadData.CurFireValueCPUArrBuffer.at(0)!);
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
