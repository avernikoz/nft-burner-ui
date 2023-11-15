import { RBackgroundRenderPass, RSpotlightRenderPass } from "./backgroundScene";
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
} from "./resourcesUtils";
import {
    AssignSceneDescription,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AssignSceneDescriptions,
    EnableSceneDescUI,
    GSceneDesc,
    GSceneStateDescsArray,
    GScreenDesc,
} from "./scene";
import { CheckGL } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";

import { GUserInputDesc, RegisterUserInput } from "./input";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Vector2 } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GTime, MathClamp, MathMapToRange, MathVector2Normalize, UpdateTime, showError } from "./utils";
import { ApplyCameraControl, SetupCameraControlThroughInput } from "./shaders/controller";
import { RSpatialControllerVisualizationRenderer, SpatialControlPoint } from "./spatialController";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../config/config";

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
    //generate intermediate texture for Blur
    //TODO: Specify target MIP resolution instead, and deduce MIP Index from it
    //const TextureSizeForBloom = 128;
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

class AudioEngine {
    public audioContext;

    private clickAudioBuffer: AudioBuffer | null;

    private introAudioBuffer: AudioBuffer | null;

    constructor() {
        this.clickAudioBuffer = null;
        this.introAudioBuffer = null;
        if (window.AudioContext) {
            this.audioContext = new AudioContext();
        } else {
            //console.error("Web Audio API is not supported in this browser");
        }
    }

    async loadSounds() {
        this.clickAudioBuffer = await this.loadAudioBuffer("assets/background/audio/bassShot.mp3");
        this.introAudioBuffer = await this.loadAudioBuffer("assets/background/audio/intro.mp3");
    }

    async loadAudioBuffer(url: string): Promise<AudioBuffer> {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${response.status} - ${response.statusText}`);
            }

            const audioData = await response.arrayBuffer();
            return await this.audioContext!.decodeAudioData(audioData);
        } catch (error) {
            console.error(`Error loading audio file from ${url}:`, error);
            throw error; // Propagate the error to the caller
        }
    }

    PlayClickSound() {
        if (this.audioContext != null) {
            const source = this.audioContext.createBufferSource();
            if (this.clickAudioBuffer) {
                source.buffer = this.clickAudioBuffer;
                source.connect(this.audioContext.destination);
                source.start();
            }

            /* const oscillator = this.audioContext.createOscillator();
            oscillator.frequency.value = 140;
            oscillator.connect(this.audioContext.destination);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1); */
        }
    }

    PlayIntroSound() {
        if (this.audioContext != null) {
            const source = this.audioContext.createBufferSource();
            if (this.introAudioBuffer) {
                source.buffer = this.introAudioBuffer;
                source.connect(this.audioContext.destination);
                source.start();
            }
        }
    }
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
        GUserInputDesc.bPointerInputPressed = true;
    });
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressed = false;
    });

    canvas.addEventListener("touchstart", (e) => {
        RegisterUserInput(canvas, e);
        e.preventDefault();
        GUserInputDesc.bPointerInputPressed = true;
    });
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        GUserInputDesc.bPointerInputPressed = false;
    });

    SetupCameraControlThroughInput();

    function OnWindowResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        GScreenDesc.ViewportSize = { x: window.innerWidth, y: window.innerHeight };
        GScreenDesc.RenderTargetSize = { x: window.innerWidth, y: window.innerHeight };
        GScreenDesc.ViewportMin = Math.min(window.innerWidth, window.innerHeight);
        GScreenDesc.ScreenRatio = window.innerWidth / window.innerHeight;
        GScreenDesc.bWideScreen = GScreenDesc.ScreenRatio > 1.0;
        GScreenDesc.ViewRatioXY = { x: 1.0, y: 1.0 };
        if (GScreenDesc.bWideScreen) {
            GScreenDesc.ViewRatioXY.x = window.innerWidth / window.innerHeight;
        } else {
            GScreenDesc.ViewRatioXY.y = window.innerHeight / window.innerWidth;
        }
        {
            //Additional scale for square and wide screens
            const addScale = MathClamp(-0.25 * (GScreenDesc.ViewRatioXY.y - 1.0) + 0.25, 0.0, 0.25);
            GScreenDesc.FirePlaneSizeScaleNDC = GScreenDesc.FirePlaneSizeScaleNDC - addScale;
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
    const numStateControllers = 4;
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

    AllocateCommonRenderingResources(gl);

    //Allocate RenderTargets
    AllocateMainRenderTargets(gl);

    //const DebugColorTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg", true);

    //GUI
    DrawUI(GSettings);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const BackGroundRenderPass = new RBackgroundRenderPass(gl);
    const SpotlightRenderPass = new RSpotlightRenderPass(gl);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const FirePlaneSizePixels = { x: 512, y: 512 };
    const FirePlanePass = new RFirePlanePass(gl, FirePlaneSizePixels);

    if (GScreenDesc.bWideScreen) {
        EmberParticlesDesc.inDownwardForceScale = 2.5;
        AfterBurnAshesParticlesDesc.inDownwardForceScale = 2.5;
        SmokeParticlesDesc.inDownwardForceScale = 2.5;
    }

    const bPaperMaterial = true;
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
        SmokeParticlesDesc.inVelocityFieldForceScale = 30;

        //DustParticlesDesc.inVelocityFieldForceScale = 50;

        //BackGroundRenderPass.FloorTransform.Translation = -0.35;
    }

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

    let GFirstRenderingFrame = true;

    function ApplySpotlightControlFromGUI() {
        if (SpotlightPositionController.bIntersectionThisFrame) {
            //Control Spotlight
            const controllerPosNDC = {
                x: SpotlightPositionController.Position.x / GScreenDesc.ScreenRatio,
                y: SpotlightPositionController.Position.y,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null && GRenderTargets.FirePlaneTexture !== null && GPostProcessPasses.CopyPresemt !== null) {
            //Handle possible resize
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                //Resize
                OnWindowResize();
                AllocateMainRenderTargets(gl);
                SetupBloomPostProcessPass(gl);
            }

            UpdateTime();

            const RenderStateMachine = GRenderingStateMachine.GetInstance();

            RenderStateMachine.AdvanceTransitionParameter();

            //Handle State transition if present
            if (RenderStateMachine.transitionParameter <= 1.0) {
                AssignSceneDescriptions(
                    GSceneStateDescsArray[RenderStateMachine.previousState],
                    GSceneStateDescsArray[RenderStateMachine.currentState],
                    RenderStateMachine.transitionParameter,
                );
            } else {
                AssignSceneDescription(GSceneStateDescsArray[RenderStateMachine.currentState]);
            }

            StateControllers.forEach((controller) => {
                controller.ClearState();
            });
            StateControllers[RenderStateMachine.currentState].bSelectedThisFrame = true;
            StateControllers[RenderStateMachine.currentState].bIntersectionThisFrame = true;

            if (GAreAllTexturesLoaded() && GSettings.bRunSimulation) {
                if (GFirstRenderingFrame) {
                    GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, true);
                    GFirstRenderingFrame = false;
                }

                ApplyCameraControl();

                if (RenderStateMachine.currentState === ERenderingState.Inventory) {
                    SpotlightPositionController.OnUpdate();
                    ApplySpotlightControlFromGUI();
                }

                if (RenderStateMachine.currentState === ERenderingState.Burning) {
                    if (GUserInputDesc.bPointerInputPressed && !SpotlightPositionController.bIntersectionThisFrame) {
                        FirePlanePass.ApplyFireFromInput(gl);
                    }
                    FirePlanePass.UpdateFire(gl);

                    BackGroundRenderPass.PointLights.Update(gl, FirePlanePass.GetCurFireTexture()!);

                    FlameParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                    EmberParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                    AshesParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                    SmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                    AfterBurnSmokeParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                    DustParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);
                }

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
                }

                //Control UI
                {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.MAX);
                    if (RenderStateMachine.currentState === ERenderingState.Inventory) {
                        SpatialControlUIVisualizer.Render(gl, SpotlightPositionController);
                    }

                    StateControllers.forEach((controller) => {
                        SpatialControlUIVisualizer.Render(gl, controller);
                    });
                    gl.disable(gl.BLEND);
                }

                let flameSourceTextureRef = GRenderTargets.FlameTexture;
                if (RenderStateMachine.currentState === ERenderingState.Burning) {
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

            if (gl !== null) {
                if (CheckGL(gl)) {
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
