/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GAudioEngine, SoundSample } from "./audioEngine";
import { GCameraShakeController, GSpotlightShakeController } from "./animationController";
import { GBurningSurface } from "./firePlane";
import { GMeshGenerator } from "./helpers/meshGenerator";
import { GUserInputDesc } from "./input";
import { EParticleShadingMode, ParticlesEmitter } from "./particles";
import { GetAfterBurnSmokeParticlesDesc, GetEmberParticlesDesc, GetSmokeParticlesDesc } from "./particlesConfig";
import { GSceneDesc, GSceneStateDescsArray, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import {
    GetShaderSourceGenericSpriteRenderVS,
    GetShaderSourceImpactFlareRenderPS,
    GetShaderSourceLaserFlareRenderPS,
    GetShaderSourceLightFlareRenderVS,
    GetShaderSourceThunderFlareRenderPS,
} from "./shaders/shaderBackgroundScene";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";
import {
    GetShaderSourceAnimatedSpriteRenderPS,
    GetShaderSourceFireballRenderPS,
    GetShaderSourceLaserPS,
    GetShaderSourceLaserVS,
    GetShaderSourceSingleFlameRenderVS,
    GetShaderSourceThunderPS,
} from "./shaders/shaderTools";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";
import { GetVec2, GetVec3 } from "./types";
import {
    GTime,
    MathClamp,
    MathGetVectorLength,
    MathIntersectionAABBSphere,
    MathIntersectionRayAABB,
    MathLerp,
    MathLerpColor,
    MathLerpVec3,
    MathMapToRange,
    MathSignedMax,
    MathVector2Normalize,
    Vec3Add,
    Vec3Multiply,
    Vec3Negate,
    MathVector3Normalize,
    SetPositionSmooth,
} from "./utils";
import { BindRenderTarget } from "./resourcesUtils";
import {
    RSpatialControllerVisualizationRenderer,
    SpatialControlPoint,
    SpatialControlPointWithTexture,
} from "./spatialController";
import { bifrostWallet } from "@rainbow-me/rainbowkit/dist/wallets/walletConnectors";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        Position: gl.getUniformLocation(shaderProgram, "Position"),
        Velocity: gl.getUniformLocation(shaderProgram, "Velocity"),
        FadeInOutParameters: gl.getUniformLocation(shaderProgram, "FadeInOutParameters"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        AnimationFrameIndex: gl.getUniformLocation(shaderProgram, "AnimationFrameIndex"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        LaserTexture: gl.getUniformLocation(shaderProgram, "LaserTexture"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
        LUTTexture: gl.getUniformLocation(shaderProgram, "LUTTexture"),
        PositionStart: gl.getUniformLocation(shaderProgram, "PositionStart"),
        PositionEnd: gl.getUniformLocation(shaderProgram, "PositionEnd"),
        SpotlightScale: gl.getUniformLocation(shaderProgram, "SpotlightScale"),
        SpotlightPos: gl.getUniformLocation(shaderProgram, "SpotlightPos"),
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        ColorScale: gl.getUniformLocation(shaderProgram, "ColorScale"),
        LineThickness: gl.getUniformLocation(shaderProgram, "LineThickness"),
        LineColorCutThreshold: gl.getUniformLocation(shaderProgram, "LineColorCutThreshold"),
        Orientation: gl.getUniformLocation(shaderProgram, "Orientation"),
        Scale: gl.getUniformLocation(shaderProgram, "Scale"),
        Color: gl.getUniformLocation(shaderProgram, "Color"),
        CurrentState: gl.getUniformLocation(shaderProgram, "CurrentState"),
    };
    return params;
}

class CAnimationComponent {
    Age = 0.0;

    AgeNormalized = 0.0;

    FadeInParameter = 1.0;

    FadeInSpeed = 1.0;

    FadeOutParameter = 0.0;

    FadeOutSpeed = 1.0;

    AgeGlobal = 0.0;

    Lifetime = 1.0;

    Speed = 1.0;

    FlipbookSize = { x: 16, y: 4 };

    Update() {
        this.AgeGlobal += GTime.Delta;
        this.Age += GTime.Delta * this.Speed;
        this.Age = this.Age % this.Lifetime;
        this.AgeNormalized = this.Age / this.Lifetime;
    }

    FadeInUpdate() {
        if (this.FadeInParameter < 1.0) {
            this.FadeInParameter += GTime.Delta * this.FadeInSpeed;
            this.FadeInParameter = Math.min(1.0, this.FadeInParameter);
        }
    }

    FadeOutUpdate() {
        if (this.FadeOutParameter > 0) {
            this.FadeOutParameter -= GTime.Delta * this.FadeOutSpeed;
            this.FadeOutParameter = Math.max(0.0, this.FadeOutParameter);
        }
    }

    Reset() {
        this.AgeGlobal = 0.0;
        this.Age = 0.0;
        this.AgeNormalized = 0.0;
        this.FadeInParameter = 0.0;
        this.FadeOutParameter = 1.0;
    }

    IsFadeInFinished() {
        return this.FadeInParameter >= 0.99;
    }

    IsFadeOutFinished() {
        return this.FadeOutParameter <= 0.01;
    }
}

export enum EBurningTool {
    Laser = 0,
    Lighter,
    Thunder,
    //===
    NUM,
}

export abstract class ToolBase {
    // Render Resources

    // Components
    AnimationComponent;

    TimeSinceLastInteraction = 0.0;

    // Base
    bActiveThisFrame;

    bFirstInteraction;

    bIntersection;

    bIntersectionPrevFrame;

    // Methods
    constructor() {
        this.AnimationComponent = new CAnimationComponent();
        this.bActiveThisFrame = false;
        this.bFirstInteraction = true;
        this.bIntersection = false;
        this.bIntersectionPrevFrame = false;
    }

    abstract UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface): void;
    abstract RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface): void;

    UpdatePositionMain(offset = { x: 0.0, y: 0.0, z: 0.0 }) {
        const posWS = { x: GUserInputDesc.InputPosCurNDC.x, y: GUserInputDesc.InputPosCurNDC.y };
        posWS.x *= GScreenDesc.ScreenRatio;
        posWS.x /= GSceneDesc.Camera.ZoomScale;
        posWS.y /= GSceneDesc.Camera.ZoomScale;

        posWS.x *= -GSceneDesc.Camera.Position.z + 1.0;
        posWS.y *= -GSceneDesc.Camera.Position.z + 1.0;

        GSceneDesc.Tool.Position.x = posWS.x + offset.x;
        GSceneDesc.Tool.Position.y = posWS.y + offset.y;
        GSceneDesc.Tool.Position.z = offset.z;
    }

    BaseUpdate() {
        this.TimeSinceLastInteraction += GTime.Delta;
    }

    BaseReset() {
        this.TimeSinceLastInteraction = 0.0;
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext): void {}

    RenderToFlameRT(gl: WebGL2RenderingContext): void {}

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {}

    SubmitDebugUI(datGui: dat.GUI): void {}
}

export class LighterTool extends ToolBase {
    //Render Resources
    ShaderProgram;

    UniformParametersLocationList;

    ColorTexture;

    LUTTexture;

    VAO = CommonRenderingResources.PlaneShapeVAO;

    NumVertices = 6;

    VertexBufferGPU: WebGLBuffer | null = null;

    TexCoordsBufferGPU: WebGLBuffer | null = null;

    //Particles
    SparksParticles: ParticlesEmitter;

    SmokeParticles: ParticlesEmitter;

    //Audio
    private SoundLighterStart: SoundSample = new SoundSample();

    private SoundLoopLighterGas: SoundSample = new SoundSample();

    PlayLighterStartSound() {
        this.SoundLighterStart.Play(GAudioEngine.GetContext()!);
    }

    PlayLighterGasSound() {
        this.SoundLoopLighterGas.Play(GAudioEngine.GetContext()!, true);
    }

    ForceStopLighterGasSound() {
        if (this.SoundLoopLighterGas.SourceNode) {
            this.SoundLoopLighterGas.Stop();
        }
    }

    constructor(gl: WebGL2RenderingContext) {
        super();

        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceSingleFlameRenderVS(),
            GetShaderSourceAnimatedSpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ColorTexture = GTexturePool.CreateTexture(gl, false, "Flame02_16x4", true);
        this.LUTTexture = GTexturePool.CreateTexture(gl, false, "flameColorLUT5", true);

        this.InitRenderingResources(gl);

        this.AnimationComponent.Speed = 1.0;
        this.AnimationComponent.FadeInSpeed = 10.0;
        this.AnimationComponent.FadeOutSpeed = 8.0;

        //TODO: Enable/disable when needed
        setInterval(() => {
            this.RandCur = Math.random();
        }, 0.1 * 1000);

        const SparksParticlesDesc = GetEmberParticlesDesc();
        SparksParticlesDesc.NumSpawners2D = 4;
        SparksParticlesDesc.NumParticlesPerSpawner = 1;
        SparksParticlesDesc.ParticleLife = 0.7;
        //SparksParticlesDesc.InitialVelocityScale *= 1.25;
        //SparksParticlesDesc.VelocityFieldForceScale = 100.0;
        SparksParticlesDesc.InitialVelocityAddScale.x = 0.5;
        SparksParticlesDesc.InitialVelocityAddScale.y = 1.25;
        const brihgtness = 3.0;
        SparksParticlesDesc.Color = GetVec3(1.0 * brihgtness, 0.6 * brihgtness, 0.1 * brihgtness);
        SparksParticlesDesc.MotionStretchScale = 3.0;
        SparksParticlesDesc.BuoyancyForceScale = 15.0;
        SparksParticlesDesc.DownwardForceScale = 1.0;
        SparksParticlesDesc.EInitialPositionMode = 2;
        SparksParticlesDesc.bOneShotParticle = true;
        SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);

        const SmokeDesc = GetAfterBurnSmokeParticlesDesc();
        SmokeDesc.NumSpawners2D = 1;
        SmokeDesc.ParticleLife = 2;
        SmokeDesc.NumLoops = 1.0;
        SmokeDesc.DefaultSize = { x: 2.0 * 0.1, y: 3.525 * 0.15 };
        SmokeDesc.AlphaScale = 0.95;
        SmokeDesc.bOneShotParticle = true;
        SmokeDesc.EInitialPositionMode = 2;
        SmokeDesc.EFadeInOutMode = 1;

        this.SmokeParticles = new ParticlesEmitter(gl, SmokeDesc);

        //Audio

        this.SoundLighterStart.Init(
            GAudioEngine.GetContext(),
            "assets/audio/lighterStart.mp3",
            GAudioEngine.GetMasterGain(),
        );

        this.SoundLoopLighterGas.Init(
            GAudioEngine.GetContext(),
            "assets/audio/lighterGasLoop.mp3",
            GAudioEngine.GetMasterGain(),
            0.5,
        );
    }

    RandCur = 0.0;

    ColorLerpParam = 0.0;

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const RenderStateMachine = GRenderingStateMachine.GetInstance();

        this.UpdatePositionMain({ x: 0.0, y: 0.25, z: -0.3 });

        //Interactivity check
        const bInteracted =
            RenderStateMachine.currentState !== ERenderingState.BurningFinished &&
            RenderStateMachine.bCanBurn &&
            GUserInputDesc.bPointerInputPressedCurFrame;
        if (bInteracted) {
            this.bActiveThisFrame = true;
            if (!GUserInputDesc.bPointerInputPressedPrevFrame) {
                //start fade in logic

                this.AnimationComponent.Reset();

                this.SparksParticles.Reset(gl);
                this.SmokeParticles.Reset(gl);
            }
        } else {
            if (GUserInputDesc.bPointerInputPressedPrevFrame) {
                //start fade out logic
            }
            if (this.AnimationComponent.IsFadeInFinished()) {
                this.AnimationComponent.FadeOutUpdate();
            }

            if (this.bActiveThisFrame) {
                if (this.AnimationComponent.IsFadeOutFinished()) {
                    this.bActiveThisFrame = false;
                }
            }
        }

        if (this.bActiveThisFrame) {
            //Animation
            this.AnimationComponent.Speed = MathLerp(1.0, 1.5, (Math.sin(GTime.CurClamped) + 1.0) * 0.5);
            const velocityMagnitude = MathGetVectorLength(GUserInputDesc.InputVelocityCurViewSpace);
            this.AnimationComponent.Speed += velocityMagnitude * 50;
            this.AnimationComponent.Update();
            this.AnimationComponent.FadeInUpdate();

            //Color
            this.ColorLerpParam += (this.RandCur - this.ColorLerpParam) * GTime.Delta * 1.0;
            const blueColor = { r: 0.2, g: 0.3, b: 0.9 };
            const redColor = { r: 1.0, g: 0.8, b: 0.1 };
            GSceneDesc.Tool.Color = MathLerpColor(redColor, blueColor, Math.max(0.35, this.ColorLerpParam));
            GSceneDesc.Tool.Radius =
                2.5 * Math.max(0.5, 1.0 - this.ColorLerpParam) * this.AnimationComponent.FadeOutParameter;
            if (Math.abs(GUserInputDesc.InputVelocityCurNDC.x) > 0.0) {
                //shrink
                const s = 1.0 - MathClamp(Math.abs(GUserInputDesc.InputVelocityCurNDC.x) * 35.0, 0.0, 1.0);
                GSceneDesc.Tool.Color.r *= s;
                GSceneDesc.Tool.Color.g *= s;
                GSceneDesc.Tool.Color.b *= s;
            }

            //Particles
            this.SparksParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y - 0.275, 0.0),
            );
            this.SmokeParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y - 0.275, 0.0),
            );

            //Apply Fire
            this.RenderToFireSurface(gl, BurningSurface);
        } else {
            GSceneDesc.Tool.Radius = 0.0;
        }

        if (RenderStateMachine.bCanBurn) {
            if (RenderStateMachine.currentState !== ERenderingState.BurningFinished) {
                if (GUserInputDesc.bPointerInputPressedCurFrame) {
                    if (!GUserInputDesc.bPointerInputPressedPrevFrame) {
                        this.PlayLighterStartSound();
                    } else {
                        this.PlayLighterGasSound();
                    }
                } else {
                    this.ForceStopLighterGasSound();
                }
            }
        }
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const curInputPos = GUserInputDesc.InputPosCurNDC;
        const sizeScale = 0.03;

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x + Math.asin(Math.sin(GTime.Cur * 7.0)) * 0.005, y: curInputPos.y + 0.1 },
            { x: 0.0, y: 1.0 },
            { x: sizeScale * 0.3, y: sizeScale },
            4.0 * GTime.Delta,
            true,
            true,
            false,
        );
        gl.disable(gl.BLEND);
    }

    InitRenderingResources(gl: WebGL2RenderingContext) {
        const mesh = GMeshGenerator.GeneratePolyboardVertical(8);
        this.NumVertices = mesh.vertices.length / 2;
        //Create Vertex Buffer
        {
            //const planeVertices = [-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1];
            const planeVertexBufferCPU = new Float32Array(mesh.vertices);

            this.VertexBufferGPU = gl.createBuffer()!;
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeVertexBufferCPU, gl.STATIC_DRAW);
        }

        //Create TexCoord Buffer
        {
            //const planeTexCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0];
            const planeTexCoordsBufferCPU = new Float32Array(mesh.texCoords);

            this.TexCoordsBufferGPU = gl.createBuffer()!;
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, this.TexCoordsBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeTexCoordsBufferCPU, gl.STATIC_DRAW);
        }

        //VAO
        this.VAO = gl.createVertexArray();
        gl.bindVertexArray(this.VAO);
        //Vertex Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexBufferGPU);
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.TexCoordsBufferGPU);
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

    RenderToFlameRT(gl: WebGL2RenderingContext) {
        if (!this.bActiveThisFrame) {
            return;
        }
        gl.bindVertexArray(this.VAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

        const TotalFlipFrames = this.AnimationComponent.FlipbookSize.x * this.AnimationComponent.FlipbookSize.y;
        gl.uniform1f(
            this.UniformParametersLocationList.AnimationFrameIndex,
            this.AnimationComponent.AgeNormalized * TotalFlipFrames,
        );

        gl.uniform3f(
            this.UniformParametersLocationList.Position,
            GUserInputDesc.InputPosCurViewSpace.x,
            GUserInputDesc.InputPosCurViewSpace.y,
            0.0,
        );
        const curInputDir = {
            x: GUserInputDesc.InputVelocityCurViewSpace.x,
            y: GUserInputDesc.InputVelocityCurViewSpace.y,
        };
        curInputDir.x = (curInputDir.x + GUserInputDesc.InputVelocityPrevViewSpace.x) * 0.5;
        curInputDir.y = (curInputDir.y + GUserInputDesc.InputVelocityPrevViewSpace.y) * 0.5;
        gl.uniform2f(this.UniformParametersLocationList.Velocity, curInputDir.x, curInputDir.y);

        gl.uniform2f(
            this.UniformParametersLocationList.FadeInOutParameters,
            this.AnimationComponent.FadeInParameter,
            this.AnimationComponent.FadeOutParameter,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.LUTTexture);
        gl.uniform1i(this.UniformParametersLocationList.LUTTexture, 2);

        gl.drawArrays(gl.TRIANGLES, 0, this.NumVertices);

        this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
    }

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame) {
            this.SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }

    SubmitDebugUI(datGui: dat.GUI) {
        const folder = datGui.addFolder("Tool Params");
        //folder.open();

        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
    }
}

//=============================================================================================================================
// 														_LASER
//=============================================================================================================================

export class LaserTool extends ToolBase {
    //Render Resources
    ShaderProgram;

    ShaderProgramFlare;

    UniformParametersLocationList;

    UniformParametersLocationListFlare;

    LaserTexture;

    NoiseTexture;

    //Audio
    private SoundLaser: SoundSample = new SoundSample();

    private SoundLaserStop: SoundSample = new SoundSample();

    PlayLaserSound() {
        this.SoundLaser.Play(GAudioEngine.GetContext()!);
    }

    ForceStopLaserSound() {
        if (this.SoundLaser.bIsPlaying) {
            this.SoundLaser.Stop();
            this.SoundLaserStop.Play(GAudioEngine.GetContext()!, true);
        }
    }

    //Particles
    SparksParticles: ParticlesEmitter;

    //Desc

    LaserStrength = 5.0 + Math.random() * 10.0;

    LaserBrightness = 4.0;

    LaserColor = { r: 1.0 * this.LaserBrightness, g: 0.4 * this.LaserBrightness, b: 0.2 * this.LaserBrightness };

    LaserGlowZPos = -0.3;

    LaserStartPos = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    LaserDir = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    constructor(gl: WebGL2RenderingContext) {
        super();
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(gl, GetShaderSourceLaserVS(), GetShaderSourceLaserPS());

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceLaserFlareRenderPS(),
        );
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);

        this.LaserTexture = GTexturePool.CreateTexture(gl, false, "FlamesTexture", false);
        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");

        this.AnimationComponent.Speed = 1.0;
        this.AnimationComponent.FadeInSpeed = 12.0;
        this.AnimationComponent.FadeOutSpeed = 30.0;

        //Audio

        this.SoundLaser.Init(GAudioEngine.GetContext(), "assets/audio/laserMain4.mp3", GAudioEngine.GetMasterGain());

        this.SoundLaserStop.Init(
            GAudioEngine.GetContext(),
            "assets/audio/laserStop.mp3",
            GAudioEngine.GetMasterGain(),
            0.25,
        );

        //Particles
        const SparksParticlesDesc = GetEmberParticlesDesc();
        SparksParticlesDesc.NumSpawners2D = 4;
        SparksParticlesDesc.NumParticlesPerSpawner = 32;
        SparksParticlesDesc.ParticleLife = 0.4;
        SparksParticlesDesc.InitialVelocityScale = 10;
        //SparksParticlesDesc.SizeRangeMinMax.y = 0.75;
        //SparksParticlesDesc.SizeRangeMinMax.x = 0.25;
        SparksParticlesDesc.EInitialPositionMode = 2;
        //SparksParticlesDesc.inBrightness = 5.0;
        //SparksParticlesDesc.RandomSpawnThres = 0.9;
        SparksParticlesDesc.bOneShotParticle = true;
        SparksParticlesDesc.bFreeFallParticle = true;
        SparksParticlesDesc.bAlwaysRespawn = true;
        SparksParticlesDesc.b3DSpace = true;
        SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;
        SparksParticlesDesc.Color = GetVec3(1.0, 0.6, 0.1);
        //SparksParticlesDesc.InitialVelocityAddScale.y *= 0.5;
        //SparksParticlesDesc.InitialVelocityAddScale.x *= 1.25;
        SparksParticlesDesc.MotionStretchScale = 3.75;

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);
    }

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const RenderStateMachine = GRenderingStateMachine.GetInstance();

        this.UpdatePositionMain({ x: 0.0, y: 0.0, z: this.LaserGlowZPos });

        //Interactivity check
        this.LaserDir = MathVector3Normalize(
            Vec3Negate(
                GetVec3(GUserInputDesc.InputPosCurViewSpace.x, GUserInputDesc.InputPosCurViewSpace.y, 0.0),
                this.LaserStartPos,
            ),
        );

        this.bIntersection = MathIntersectionRayAABB(
            this.LaserStartPos,
            this.LaserDir,
            GSceneDesc.FirePlane.PositionOffset,
            GetVec3(0.4, 0.4, 0.0),
        );

        //this.bIntersection = true;

        const bInteracted =
            RenderStateMachine.currentState !== ERenderingState.BurningFinished &&
            RenderStateMachine.bCanBurn &&
            GUserInputDesc.bPointerInputPressedCurFrame &&
            this.bIntersection;

        if (bInteracted) {
            this.bActiveThisFrame = true;
            if (!GUserInputDesc.bPointerInputPressedPrevFrame || !this.bIntersectionPrevFrame) {
                //start fade in logic

                this.AnimationComponent.Reset();

                this.SparksParticles.Reset(gl);

                if (this.bFirstInteraction) {
                    this.LaserStartPos = GetVec3(
                        MathSignedMax(GUserInputDesc.InputPosCurViewSpace.x, 0.5) * 4.0,
                        GUserInputDesc.InputPosCurViewSpace.y * 5.0,
                        -4.0,
                    );

                    this.bFirstInteraction = false;
                }

                this.PlayLaserSound();

                GCameraShakeController.ShakeCameraFast(0.5);
            }
        } else {
            if (GUserInputDesc.bPointerInputPressedPrevFrame || this.bIntersectionPrevFrame) {
                //start fade out logic
                this.ForceStopLaserSound();
            }
            if (this.AnimationComponent.IsFadeInFinished()) {
                this.AnimationComponent.FadeOutUpdate();
            }

            if (this.bActiveThisFrame) {
                if (this.AnimationComponent.IsFadeOutFinished()) {
                    this.bActiveThisFrame = false;
                }
            }
        }

        /* if (this.SoundLaser.bIsPlaying) {
            this.SoundLaser.Stop();
        } */

        if (this.bActiveThisFrame) {
            //Animation
            this.AnimationComponent.Update();
            this.AnimationComponent.FadeInUpdate();

            //Color
            GSceneDesc.Tool.Color = this.LaserColor;
            GSceneDesc.Tool.Radius = 2.0 * this.AnimationComponent.FadeOutParameter;

            this.SparksParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );

            //Apply Fire
            if (this.AnimationComponent.IsFadeInFinished()) {
                this.RenderToFireSurface(gl, BurningSurface);
            }
        } else {
            GSceneDesc.Tool.Radius = 0.0;
        }

        if (RenderStateMachine.bCanBurn) {
            if (RenderStateMachine.currentState !== ERenderingState.BurningFinished) {
                if (GUserInputDesc.bPointerInputPressedCurFrame) {
                    if (!GUserInputDesc.bPointerInputPressedPrevFrame) {
                        //this.PlayLaserSound();
                    } else {
                        //this.PlayLighterGasSound();
                    }
                } else {
                    //this.PlayLaserStopSound();
                }
            }
        }

        this.bIntersectionPrevFrame = this.bIntersection;
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const curInputPos = GUserInputDesc.InputPosCurNDC;
        const sizeScale = 0.0035;

        //BurningSurface.Reset(gl);

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y },
            GUserInputDesc.InputVelocityCurViewSpace,
            { x: sizeScale, y: sizeScale },
            this.LaserStrength,
            true,
            false,
            false,
        );
        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        if (!this.bActiveThisFrame) {
            return;
        }
        if (!this.bIntersection) {
            return;
        }

        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);

        const posStart = this.LaserStartPos;
        gl.uniform3f(this.UniformParametersLocationList.PositionStart, posStart.x, posStart.y, posStart.z);

        let posEnd = GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0);
        if (!this.bIntersection) {
            posEnd = Vec3Add(posStart, Vec3Multiply(this.LaserDir, 10));
        }

        let posEndFinal = MathLerpVec3(posStart, posEnd, this.AnimationComponent.FadeInParameter);
        if (this.AnimationComponent.FadeOutParameter < 1.0) {
            posEndFinal = MathLerpVec3(posStart, posEnd, this.AnimationComponent.FadeOutParameter);
        }
        gl.uniform3f(this.UniformParametersLocationList.PositionEnd, posEndFinal.x, posEndFinal.y, posEndFinal.z);

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

        gl.uniform1f(this.UniformParametersLocationList.LineThickness, 0.05);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LaserTexture);
        gl.uniform1i(this.UniformParametersLocationList.LaserTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 2);

        //Textures
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (
            this.AnimationComponent.IsFadeInFinished() &&
            this.AnimationComponent.FadeOutParameter >= 0.99 &&
            this.bIntersection
        ) {
            this.RenderFlare(gl);
        }
    }

    LaserGlareSizeDefault = 0.5;

    RenderFlare(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFlare);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListFlare.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListFlare.ScreenRatio, GScreenDesc.ScreenRatio);

        const finalGlareSize =
            this.LaserGlareSizeDefault *
            (0.75 + (Math.sin(GTime.Cur * 2) * 0.5 + 0.5) * 0.5 + (Math.sin(GTime.Cur * 2 * 2.7) * 0.5 + 0.5) * 0.1);

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize * 1.5, finalGlareSize);

        gl.uniform1f(this.UniformParametersLocationListFlare.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            GSceneDesc.Tool.Position.x,
            GSceneDesc.Tool.Position.y,
            -0.1,
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = datGui.addFolder("Tool Params");
        //folder.open();

        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
        folder.add(this, "bActiveThisFrame", 0, 1).listen();
        folder.add(this, "bIntersection", 0, 1).listen();
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame) {
            this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
        }
    }
}

//=============================================================================================================================
// 														_THUNDER
//=============================================================================================================================

export class ThunderTool extends ToolBase {
    //Render Resources
    ShaderProgram;

    ShaderProgramFlare;

    UniformParametersLocationList;

    UniformParametersLocationListFlare;

    ThunderTexture;

    ThunderTexture2;

    NoiseTexture;

    LightFlareTexture;

    //Audio
    SoundThunder: SoundSample = new SoundSample();

    SoundThunder2: SoundSample = new SoundSample();

    SoundThunder3: SoundSample = new SoundSample();

    //Particles
    SparksParticles: ParticlesEmitter;

    SmokeParticles: ParticlesEmitter;

    //Desc

    AppliedFireStrength = 25.0;

    Brightness = 10.0;

    Thickness = 1.5;

    Color = { r: 0.2, g: 0.2, b: 1.0 };

    GlowZPos = -0.3;

    StartPos = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    Dir = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    constructor(gl: WebGL2RenderingContext) {
        super();
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(gl, GetShaderSourceLaserVS(), GetShaderSourceThunderPS());

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceThunderFlareRenderPS(),
        );
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);

        this.ThunderTexture = GTexturePool.CreateTexture(gl, false, "thunder3", false);
        this.ThunderTexture2 = GTexturePool.CreateTexture(gl, false, "thunder", false);
        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");
        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `lightGlare2`);

        this.AnimationComponent.Speed = 1.0;
        this.AnimationComponent.FadeInSpeed = 10.0;
        this.AnimationComponent.FadeOutSpeed = 1.0;

        //Audio

        this.SoundThunder.Init(
            GAudioEngine.GetContext(),
            "assets/audio/thunder1.mp3",
            GAudioEngine.GetMasterGain(),
            2.25,
        );
        this.SoundThunder2.Init(
            GAudioEngine.GetContext(),
            "assets/audio/thunder2.mp3",
            GAudioEngine.GetMasterGain(),
            2.25,
        );
        this.SoundThunder3.Init(
            GAudioEngine.GetContext(),
            "assets/audio/thunder3.mp3",
            GAudioEngine.GetMasterGain(),
            2.25,
        );

        //Particles
        const SparksParticlesDesc = GetEmberParticlesDesc();
        SparksParticlesDesc.NumSpawners2D = 18;
        SparksParticlesDesc.ParticleLife = 2.0;
        //SparksParticlesDesc.SizeRangeMinMax.y *= 1.25;
        SparksParticlesDesc.SizeRangeMinMax.x = 0.25;
        SparksParticlesDesc.EInitialPositionMode = 2;
        SparksParticlesDesc.InitialVelocityScale = 10;
        //SparksParticlesDesc.RandomSpawnThres = 0.5;
        SparksParticlesDesc.bOneShotParticle = true;
        SparksParticlesDesc.bFreeFallParticle = true;
        //SparksParticlesDesc.bAlwaysRespawn = true;
        SparksParticlesDesc.b3DSpace = true;
        SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

        const brihgtness = 2.0;
        SparksParticlesDesc.Color = GetVec3(0.8 * brihgtness, 0.7 * brihgtness, 1.0 * brihgtness);
        SparksParticlesDesc.MotionStretchScale = 1.25;
        SparksParticlesDesc.InitialVelocityAddScale = GetVec2(0.6, 1.5);

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);

        const SmokeParticlesDesc = GetSmokeParticlesDesc();
        SmokeParticlesDesc.NumSpawners2D = 1;
        SmokeParticlesDesc.ParticleLife = 1.0;
        SmokeParticlesDesc.DefaultSize.x *= 1.5;
        SmokeParticlesDesc.DefaultSize.y *= 1.5;
        SmokeParticlesDesc.BuoyancyForceScale *= 0.1;
        SmokeParticlesDesc.bOneShotParticle = true;
        SmokeParticlesDesc.EInitialPositionMode = 2;
        SmokeParticlesDesc.EAlphaFade = 1.0;
        SmokeParticlesDesc.AlphaScale = 1.0;
        //SmokeParticlesDesc.InitialVelocityScale = 20.0;
        SmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
        SmokeParticlesDesc.EFadeInOutMode = 1;
        SmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };

        this.SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
    }

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        this.BaseUpdate();

        const RenderStateMachine = GRenderingStateMachine.GetInstance();

        if (!this.bActiveThisFrame) {
            this.UpdatePositionMain({ x: 0.0, y: 0.0, z: this.GlowZPos });
        }

        //Interactivity check
        this.Dir = MathVector3Normalize(
            Vec3Negate(
                GetVec3(GUserInputDesc.InputPosCurViewSpace.x, GUserInputDesc.InputPosCurViewSpace.y, 0.0),
                this.StartPos,
            ),
        );

        this.bIntersection = MathIntersectionRayAABB(
            this.StartPos,
            this.Dir,
            GSceneDesc.FirePlane.PositionOffset,
            GetVec3(0.4, 0.4, 0.0),
        );

        //this.bIntersection = true;

        const bInteracted =
            RenderStateMachine.currentState !== ERenderingState.BurningFinished &&
            RenderStateMachine.bCanBurn &&
            GUserInputDesc.bPointerInputPressedCurFrame &&
            !GUserInputDesc.bPointerInputPressedPrevFrame &&
            this.bIntersection &&
            this.AnimationComponent.IsFadeOutFinished();

        if (bInteracted) {
            //if (this.AnimationComponent.IsFadeInFinished())
            {
                this.bActiveThisFrame = true;
            }
            //if (!this.bIntersectionPrevFrame)
            {
                //start fade in logic

                this.BaseReset();
                this.AnimationComponent.Reset();

                this.SparksParticles.Reset(gl);
                this.SmokeParticles.Reset(gl);

                this.StartPos = GetVec3(
                    MathSignedMax(GUserInputDesc.InputPosCurViewSpace.x, 0.5) * 6.0,
                    3 + Math.max(0, GUserInputDesc.InputPosCurViewSpace.y),
                    0.1,
                );

                this.Thickness = 1.5;
                this.Brightness = 30.0;

                this.bFirstInteraction = true;

                const randInt = Math.random() * 3;
                if (randInt < 1) {
                    this.SoundThunder.Play(GAudioEngine.GetContext()!);
                } else if (randInt < 2) {
                    this.SoundThunder2.Play(GAudioEngine.GetContext()!);
                } else {
                    this.SoundThunder3.Play(GAudioEngine.GetContext()!);
                }

                GCameraShakeController.ShakeCameraFast();
                GSpotlightShakeController.ShakeSpotlight(1.0);
            }
        } else {
            if (this.AnimationComponent.IsFadeInFinished()) {
                this.AnimationComponent.FadeOutUpdate();
            }

            if (this.bActiveThisFrame) {
                if (this.AnimationComponent.IsFadeOutFinished()) {
                    this.bActiveThisFrame = false;
                }
            }
        }

        /* if (this.SoundLaser.bIsPlaying) {
            this.SoundLaser.Stop();
        } */

        if (this.bActiveThisFrame) {
            //Animation
            this.AnimationComponent.Update();
            this.AnimationComponent.FadeInUpdate();

            this.Thickness = Math.max(0.8, this.Thickness - 5.0 * GTime.Delta);

            this.Brightness = Math.max(1.0, this.Brightness - 50.0 * GTime.Delta);

            //Color
            const additionToolScale = 0.2;
            GSceneDesc.Tool.Color.r = this.Color.r * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Color.g = this.Color.g * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Color.b = this.Color.b * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Radius = 2.5 * this.AnimationComponent.FadeOutParameter;

            //Apply Fire
            if (this.AnimationComponent.IsFadeInFinished() && this.bFirstInteraction) {
                this.RenderToFireSurface(gl, BurningSurface);
                this.bFirstInteraction = false;
            }
        } else {
            GSceneDesc.Tool.Radius = 0.0;
        }

        if (this.TimeSinceLastInteraction < this.SparksParticles.Desc.ParticleLife) {
            this.SparksParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );
            this.SmokeParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );
        }

        this.bIntersectionPrevFrame = this.bIntersection;
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        if (!this.bActiveThisFrame) {
            return;
        }
        if (!this.bIntersection) {
            return;
        }
        const curInputPos = GUserInputDesc.InputPosCurNDC;
        const sizeScale = 0.05;

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y },
            GUserInputDesc.InputVelocityCurViewSpace,
            { x: sizeScale, y: sizeScale },
            this.AppliedFireStrength * 10.0,
            true,
            true,
            true,
        );
        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        if (!this.bActiveThisFrame) {
            return;
        }
        if (!this.bIntersection) {
            return;
        }

        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);

        const posStart = this.StartPos;
        gl.uniform3f(this.UniformParametersLocationList.PositionStart, posStart.x, posStart.y, posStart.z);

        {
            const colorParam = MathClamp(Math.max(0.0, this.AnimationComponent.AgeGlobal - 0.4) / 1.0, 0.0, 1.0);

            const colorScaleAdd = 1.0;

            const colorBright = {
                r: this.Color.r * Math.max(1.0, this.Brightness),
                g: this.Color.g * Math.max(this.Brightness),
                b: this.Color.b * Math.max(this.Brightness),
            };

            const colorNew = MathLerpColor(
                colorBright,
                { r: 0.05 * colorScaleAdd, g: 0.05 * colorScaleAdd, b: 0.1 * colorScaleAdd },
                colorParam + (1 - this.AnimationComponent.FadeOutParameter),
            );

            gl.uniform3f(this.UniformParametersLocationList.ColorScale, colorNew.r, colorNew.g, colorNew.b);
        }

        let posEnd = { x: GSceneDesc.Tool.Position.x, y: GSceneDesc.Tool.Position.y, z: 0.0 };
        if (!this.bIntersection) {
            posEnd = Vec3Add(posStart, Vec3Multiply(this.Dir, 10));
        }

        gl.uniform1f(this.UniformParametersLocationList.LineThickness, this.Thickness);

        gl.uniform1f(this.UniformParametersLocationList.LineColorCutThreshold, this.AnimationComponent.FadeInParameter);

        gl.uniform3f(this.UniformParametersLocationList.PositionEnd, posEnd.x, posEnd.y, posEnd.z);

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.ThunderTexture);
        gl.uniform1i(this.UniformParametersLocationList.LaserTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 2);

        // gl.enable(gl.BLEND);
        // gl.blendEquation(gl.MAX);
        //gl.blendFunc(gl.ONE, gl.ONE);

        //Textures
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //Render Second Thunder
        //if (this.AnimationComponent.AgeGlobal < 0.1)
        {
            //Textures
            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, this.ThunderTexture2);
            gl.uniform1i(this.UniformParametersLocationList.LaserTexture, 1);

            const colorParam = MathClamp(this.AnimationComponent.AgeGlobal / 0.5, 0.0, 1.0);

            const colorScaleAdd =
                0.5 * (1 - this.AnimationComponent.FadeOutParameter) * (1 - this.AnimationComponent.FadeOutParameter);

            const colorBright = {
                r: this.Color.r * Math.max(1.0, this.Brightness * 0.1),
                g: this.Color.g * Math.max(this.Brightness * 0.1),
                b: this.Color.b * Math.max(this.Brightness * 0.1),
            };

            const colorNew = MathLerpColor(
                colorBright,
                { r: 0.05 * colorScaleAdd, g: 0.05 * colorScaleAdd, b: 0.1 * colorScaleAdd },
                colorParam + (1 - this.AnimationComponent.FadeOutParameter),
            );

            gl.uniform3f(this.UniformParametersLocationList.ColorScale, colorNew.r, colorNew.g, colorNew.b);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        if (
            this.AnimationComponent.IsFadeInFinished() &&
            this.bIntersection &&
            this.AnimationComponent.AgeGlobal < 0.4
        ) {
            this.RenderFlare(gl);
        }

        //gl.disable(gl.BLEND);
    }

    GlareSizeDefault = 2.0;

    RenderFlare(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFlare);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListFlare.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListFlare.ScreenRatio, GScreenDesc.ScreenRatio);

        let sizeScale = 1.0;

        if (this.AnimationComponent.AgeGlobal > 0.2) {
            sizeScale = 1.0 - (this.AnimationComponent.AgeGlobal - 0.2) * 10.0;
        }

        const finalGlareSize = this.GlareSizeDefault * sizeScale;

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize * 1.5, finalGlareSize);

        gl.uniform1f(this.UniformParametersLocationListFlare.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            GSceneDesc.Tool.Position.x,
            GSceneDesc.Tool.Position.y,
            -0.1,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LightFlareTexture);
        gl.uniform1i(this.UniformParametersLocationListFlare.SpotlightTexture, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = datGui.addFolder("Tool Params");
        //folder.open();

        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
        folder.add(this, "bActiveThisFrame", 0, 1).listen();
        folder.add(this, "bIntersection", 0, 1).listen();
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame || this.TimeSinceLastInteraction < this.SparksParticles.Desc.ParticleLife) {
            this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
        }
    }

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame) {
            this.SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }
}

//=============================================================================================================================
// 														_FIREBALL
//=============================================================================================================================

export class FireballTool extends ToolBase {
    ShaderProgram;

    ShaderProgramFlare;

    UniformParametersLocationList;

    UniformParametersLocationListFlare;

    //Resources
    NoiseTexture;

    LightFlareTexture;

    //Audio

    //Particles
    SparksParticles: ParticlesEmitter;
    SmokeParticles: ParticlesEmitter;
    TrailSparksParticles: ParticlesEmitter;
    TrailSmokeParticles: ParticlesEmitter;

    //Desc
    Scale = 0.15;
    Orientation = { pitch: 0.0, yaw: 0.0, roll: 0.0 };
    ColorInitial = GetVec3(1.0, 0.7, 0.35);
    ColorCurrent = GetVec3(this.ColorInitial.x, this.ColorInitial.y, this.ColorInitial.z);

    CamHeightOffset = -0.8;

    SpatialController;
    ControllerInitialPos = GetVec2(0.0, -0.8);

    constructor(gl: WebGL2RenderingContext) {
        super();
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(),
            GetShaderSourceFireballRenderPS(),
        );

        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceImpactFlareRenderPS(),
        );
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");

        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `lightGlare2`);

        this.AnimationComponent.Speed = 1.0;
        this.AnimationComponent.FadeInSpeed = 10.0;
        this.AnimationComponent.FadeOutSpeed = 1.0;

        //Audio

        //Particles
        const SparksParticlesDesc = GetEmberParticlesDesc();
        SparksParticlesDesc.NumSpawners2D = 32;
        SparksParticlesDesc.ParticleLife = 2.0;
        //SparksParticlesDesc.SizeRangeMinMax.y *= 1.25;
        SparksParticlesDesc.DefaultSize.y *= 0.95;
        SparksParticlesDesc.SizeRangeMinMax.x = 0.25;
        SparksParticlesDesc.EInitialPositionMode = 2;
        SparksParticlesDesc.InitialVelocityScale = 11.5;
        //SparksParticlesDesc.RandomSpawnThres = 0.5;
        SparksParticlesDesc.bOneShotParticle = true;
        SparksParticlesDesc.bFreeFallParticle = true;
        //SparksParticlesDesc.bAlwaysRespawn = true;
        SparksParticlesDesc.b3DSpace = true;
        SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

        const brihgtness = 1.0;
        SparksParticlesDesc.Color = GetVec3(
            this.ColorInitial.x * brihgtness,
            this.ColorInitial.y * brihgtness,
            this.ColorInitial.z * brihgtness,
        );
        SparksParticlesDesc.MotionStretchScale = 1.3;
        SparksParticlesDesc.InitialVelocityAddScale = GetVec2(0.6, 1.5);

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);

        const SmokeParticlesDesc = GetSmokeParticlesDesc();
        SmokeParticlesDesc.NumSpawners2D = 3;
        SmokeParticlesDesc.ParticleLife = 1.4;
        SmokeParticlesDesc.DefaultSize.x *= 1.75;
        SmokeParticlesDesc.DefaultSize.y *= 1.75;
        SmokeParticlesDesc.BuoyancyForceScale *= 0.1;
        SmokeParticlesDesc.bOneShotParticle = true;
        SmokeParticlesDesc.EInitialPositionMode = 2;
        SmokeParticlesDesc.EAlphaFade = 1.0;
        SmokeParticlesDesc.InitialVelocityScale = 30.0;
        SmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
        SmokeParticlesDesc.EFadeInOutMode = 1;
        SmokeParticlesDesc.AlphaScale = 1.0;
        SmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };

        this.SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);

        //Particles
        const TrailSparksParticlesDesc = GetEmberParticlesDesc();
        TrailSparksParticlesDesc.NumSpawners2D = 3;
        TrailSparksParticlesDesc.NumParticlesPerSpawner = 32;
        TrailSparksParticlesDesc.ParticleLife = 0.4;
        TrailSparksParticlesDesc.SizeRangeMinMax.x = 0.25;
        TrailSparksParticlesDesc.VelocityFieldForceScale = 0;
        TrailSparksParticlesDesc.EInitialPositionMode = 2;
        TrailSparksParticlesDesc.bOneShotParticle = true;
        TrailSparksParticlesDesc.bAlwaysRespawn = true;
        TrailSparksParticlesDesc.b3DSpace = true;
        TrailSparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;
        TrailSparksParticlesDesc.Color = GetVec3(1.0, 0.6, 0.1);
        TrailSparksParticlesDesc.InitialVelocityAddScale.y *= 0.25;
        TrailSparksParticlesDesc.InitialVelocityAddScale.x *= 0.25;

        TrailSparksParticlesDesc.bFreeFallParticle = true;
        if (TrailSparksParticlesDesc.bFreeFallParticle) {
            TrailSparksParticlesDesc.InitialVelocityScale = 20;
            TrailSparksParticlesDesc.MotionStretchScale = 1.3;
        } else {
            TrailSparksParticlesDesc.InitialVelocityScale = 1;
            TrailSparksParticlesDesc.MotionStretchScale = 1.3;
        }

        this.TrailSparksParticles = new ParticlesEmitter(gl, TrailSparksParticlesDesc);

        const TrailSmokeParticlesDesc = GetSmokeParticlesDesc();
        TrailSmokeParticlesDesc.NumSpawners2D = 1;
        TrailSmokeParticlesDesc.NumParticlesPerSpawner = 18;
        TrailSmokeParticlesDesc.ParticleLife = 1.2;
        TrailSmokeParticlesDesc.DefaultSize.x *= 0.75;
        TrailSmokeParticlesDesc.DefaultSize.y *= 0.75;
        TrailSmokeParticlesDesc.BuoyancyForceScale *= 0.1;

        TrailSmokeParticlesDesc.EInitialPositionMode = 2;
        TrailSmokeParticlesDesc.EAlphaFade = 1.0;
        TrailSmokeParticlesDesc.InitialVelocityScale = 0.0;
        TrailSmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
        TrailSmokeParticlesDesc.EFadeInOutMode = 0;
        TrailSmokeParticlesDesc.AlphaScale = 0.75;
        TrailSmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };
        TrailSmokeParticlesDesc.bOneShotParticle = true;
        TrailSmokeParticlesDesc.b3DSpace = true;
        TrailSmokeParticlesDesc.bAlwaysRespawn = true;
        TrailSmokeParticlesDesc.bFreeFallParticle = false;

        this.TrailSmokeParticles = new ParticlesEmitter(gl, TrailSmokeParticlesDesc);

        this.Reset();

        //this.FireballPositionController = new SpatialControlPoint(gl, { x: 0.0, y: -0.8 }, 0.075, true);
        this.SpatialController = new SpatialControlPointWithTexture(
            gl,
            this.ControllerInitialPos,
            0.075,
            true,
            `spotLightIcon2_R8`,
            `spotLightIcon2Inv`,
        );

        this.SpatialController.MinBoundsNDC = GetVec2(-0.95, -1.0);
        this.SpatialController.MaxBoundsNDC = GetVec2(0.95, -0.25);

        GSceneStateDescsArray[ERenderingState.BurningReady].CameraPosition.y = this.CamHeightOffset;
        GSceneStateDescsArray[ERenderingState.BurningReady + 1].CameraPosition.y = this.CamHeightOffset;
        GSceneStateDescsArray[ERenderingState.BurningReady].CameraPosition.y = this.CamHeightOffset;

        this.ControllerTraction(true);
    }

    //Phys
    PositionInitial = GetVec3(0.0, this.CamHeightOffset - 0.33, 0.0);
    PositionCurrent = GetVec3(0.0, 0.0, 0.0);
    VelocityCurrent = GetVec3(0.0, 0.0, 0.0);
    LaunchStrength = 500.0;

    bLaunched = false;
    TargetConstraintStrength = 5.0;

    AttemptLaunch(gl: WebGL2RenderingContext) {
        if (this.VelocityCurrent.z > 1.0) {
            const randDir = MathVector3Normalize(GetVec3(-1.0 + Math.random() * 2.0, -0.5 + Math.random() * 1.5, 1.0));

            const dt = Math.min(1 / 60, GTime.Delta);

            //Higher when hit from the side
            this.VelocityCurrent.y *= 1.0 + Math.abs(this.PositionCurrent.x) * 0.75;

            this.TrailSparksParticles.Reset(gl);

            this.bLaunched = true;
        } else {
        }

        this.SpatialController.PositionViewSpace.x = this.ControllerInitialPos.x;
        this.SpatialController.PositionViewSpace.y = this.ControllerInitialPos.y;
    }

    Reset() {
        this.PositionCurrent.x = this.PositionInitial.x;
        this.PositionCurrent.y = this.PositionInitial.y;
        this.PositionCurrent.z = this.PositionInitial.z;

        this.VelocityCurrent.x = 0.0;
        this.VelocityCurrent.y = 0.0;
        this.VelocityCurrent.z = 0.0;

        this.bLaunched = false;
    }

    ResetController() {}

    LaunchUpdate() {
        const dt = Math.min(1 / 60, GTime.Delta);

        {
            //aim to fire plane
            const curTargetPos = GSceneDesc.FirePlane.PositionOffset;

            const diff = GetVec3(
                curTargetPos.x - this.PositionCurrent.x,
                curTargetPos.y - 1 - this.PositionCurrent.y,
                curTargetPos.z - this.PositionCurrent.z,
            );

            let curDist = MathGetVectorLength(diff) * this.TargetConstraintStrength;
            curDist *= curDist;
            const dir = MathVector3Normalize(diff);

            this.VelocityCurrent.x += dir.x * curDist * dt * 0.75;
            if (dir.y < 0.0) {
                this.VelocityCurrent.y += dir.y * curDist * dt * 0.5;
            }
            /* const zScale = 0.1;
            this.VelocityCurrent.z += dir.z * zScale * curDist * dt; */
        }

        //Integrate
        this.PositionCurrent.x += this.VelocityCurrent.x * dt;
        this.PositionCurrent.y += this.VelocityCurrent.y * dt;
        this.PositionCurrent.z += this.VelocityCurrent.z * dt;
    }

    ControllerTraction(bInstant = false) {
        const vsPos = GetVec3(
            this.SpatialController.PositionViewSpace.x,
            MathMapToRange(
                this.SpatialController.PositionNDCSpace.y,
                this.ControllerInitialPos.y,
                1.0,
                this.ControllerInitialPos.y,
                0.1,
            ),
            MathMapToRange(this.SpatialController.PositionNDCSpace.y, this.ControllerInitialPos.y, 1.0, 1.0, 3.0),
        );

        const worldPos = GetVec3(
            GSceneDesc.Camera.Position.x + vsPos.x,
            GSceneDesc.Camera.Position.y + vsPos.y,
            GSceneDesc.Camera.Position.z + vsPos.z,
        );

        if (bInstant) {
            this.PositionCurrent.x = worldPos.x;
            this.PositionCurrent.y = worldPos.y;
            this.PositionCurrent.z = worldPos.z;
        } else {
            /* this.PositionCurrent.x = MathLerp(this.PositionCurrent.x, worldPos.x, 0.25);
            this.PositionCurrent.y = MathLerp(this.PositionCurrent.y, worldPos.y, 0.25);
            this.PositionCurrent.z = MathLerp(this.PositionCurrent.z, worldPos.z, 0.25); */

            const dt = Math.min(1 / 60, GTime.Delta);
            SetPositionSmooth(this.PositionCurrent, this.VelocityCurrent, worldPos, dt, 200.0, 10.0);
        }
    }

    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface): void {
        this.SpatialController.OnUpdate();

        if (this.SpatialController.bReleasedThisFrame) {
            this.AttemptLaunch(gl);
        } else {
            if (!this.bLaunched) {
                this.ControllerTraction();
            }
        }

        if (this.bLaunched) {
            this.LaunchUpdate();
        }

        if (this.SpatialController.bSelectedThisFrame) {
            this.TrailSmokeParticles.Reset(gl);
        }

        let velLengthScale = 0.75;
        if (this.SpatialController.bDragState) {
            velLengthScale = velLengthScale + Math.min(1.25, MathGetVectorLength(this.VelocityCurrent) * 0.5);
        }
        this.ColorCurrent.Set(
            this.ColorInitial.x * velLengthScale,
            this.ColorInitial.y * velLengthScale,
            this.ColorInitial.z * velLengthScale,
        );

        this.BaseUpdate();
        const RenderStateMachine = GRenderingStateMachine.GetInstance();

        if (this.bLaunched || this.SpatialController.bDragState) {
            this.TrailSmokeParticles.Update(gl, BurningSurface.GetCurFireTexture()!, this.PositionCurrent);
        }

        if (this.bLaunched) {
            GSceneDesc.Tool.Position.x = this.PositionCurrent.x;
            GSceneDesc.Tool.Position.y = this.PositionCurrent.y;
            GSceneDesc.Tool.Position.z = this.PositionCurrent.z;

            const toolBright = 1.0;
            GSceneDesc.Tool.Color.r = this.ColorCurrent.x * toolBright;
            GSceneDesc.Tool.Color.g = this.ColorCurrent.y * toolBright;
            GSceneDesc.Tool.Color.b = this.ColorCurrent.z * toolBright;

            GSceneDesc.Tool.Radius = 2.5;

            this.TrailSparksParticles.Update(gl, BurningSurface.GetCurFireTexture()!, this.PositionCurrent);
        } else {
            GSceneDesc.Tool.Radius = 0.0;
        }

        if (this.bLaunched) {
            this.bIntersection = MathIntersectionAABBSphere(
                this.PositionCurrent,
                this.Scale * 0.5,
                GSceneDesc.FirePlane.PositionOffset,
                GetVec3(1.0, 1.0, 0.0),
            );

            const bInteracted =
                RenderStateMachine.currentState !== ERenderingState.BurningFinished &&
                RenderStateMachine.bCanBurn &&
                this.bIntersection;

            if (bInteracted) {
                this.bActiveThisFrame = true;

                this.BaseReset();
                this.AnimationComponent.Reset();

                this.SparksParticles.Reset(gl);
                this.SmokeParticles.Reset(gl);

                const impactAmount = Math.min(MathGetVectorLength(this.VelocityCurrent) * 0.5, 1.5);
                GCameraShakeController.ShakeCameraFast(impactAmount);
                GSpotlightShakeController.ShakeSpotlight(impactAmount);

                this.RenderToFireSurface(gl, BurningSurface);

                this.Reset();
            } else {
                if (this.AnimationComponent.IsFadeInFinished()) {
                    this.AnimationComponent.FadeOutUpdate();
                }

                if (this.bActiveThisFrame) {
                    if (this.AnimationComponent.IsFadeOutFinished()) {
                        this.bActiveThisFrame = false;
                    }
                }
            }

            if (this.bActiveThisFrame) {
                this.AnimationComponent.Update();
                this.AnimationComponent.FadeInUpdate();
            }

            if (this.IsOutOfBounds()) {
                this.Reset();
            }
        } else {
            //GSceneDesc.Tool.Radius = 0.0;
        }

        if (this.TimeSinceLastInteraction < this.SparksParticles.Desc.ParticleLife + 0.1) {
            this.SparksParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );
            this.SmokeParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );
        }
    }

    IsOutOfBounds() {
        return (
            this.PositionCurrent.z > 0.1 ||
            this.PositionCurrent.z < GSceneDesc.Camera.Position.z - 1.0 ||
            Math.abs(this.PositionCurrent.x) > 5.0 ||
            Math.abs(this.PositionCurrent.y) > 5.0
        );
    }

    GetCurrentControllerState() {
        if (this.bLaunched) {
            return 3;
        } else if (this.SpatialController.bDragState) {
            return 2;
        } else if (this.SpatialController.bIntersectionThisFrame) {
            return 1;
        } else {
            return 0;
        }
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const curInputPos = this.PositionCurrent;
        const sizeScale = 0.055;

        //BurningSurface.Reset(gl);

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y },
            GetVec2(this.VelocityCurrent.x * GTime.Delta * 0.001, this.VelocityCurrent.y * GTime.Delta * 0.001),
            { x: sizeScale, y: sizeScale },
            1000.0,
            true,
            true,
            true,
            true,
        );
        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        /* if (RSpatialControllerVisualizationRenderer.GInstance) {
            RSpatialControllerVisualizationRenderer.GInstance.Render(gl, this.SpatialController);
        } */
        /* if (
            this.AnimationComponent.IsFadeInFinished() &&
            this.TimeSinceLastInteraction < 0.4 &&
            this.bActiveThisFrame
        )  */
        {
            this.RenderFlare(gl);
        }
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationList.Scale, this.Scale);
        gl.uniform3f(
            this.UniformParametersLocationList.Position,
            this.PositionCurrent.x,
            this.PositionCurrent.y,
            this.PositionCurrent.z,
        );
        gl.uniform3f(
            this.UniformParametersLocationList.Orientation,
            this.Orientation.pitch,
            this.Orientation.yaw,
            this.Orientation.roll,
        );
        gl.uniform3f(
            this.UniformParametersLocationList.Color,
            this.ColorCurrent.x,
            this.ColorCurrent.y,
            this.ColorCurrent.z,
        );

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);
        gl.uniform1i(this.UniformParametersLocationList.CurrentState, this.GetCurrentControllerState());

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 2);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        //Textures
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (this.bActiveThisFrame || this.TimeSinceLastInteraction < this.SparksParticles.Desc.ParticleLife) {
            this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
        }

        if (this.bLaunched) {
            this.TrailSparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
        }
    }

    RenderFlare(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFlare);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListFlare.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );

        gl.uniform3f(
            this.UniformParametersLocationListFlare.Color,
            this.ColorCurrent.x,
            this.ColorCurrent.y,
            this.ColorCurrent.z,
        );

        gl.uniform1f(this.UniformParametersLocationListFlare.ScreenRatio, GScreenDesc.ScreenRatio);

        let t = 0.0;
        const startThres = 0.05;
        const sustainThres = 0.2;
        const endThres = sustainThres + 0.001;
        if (this.TimeSinceLastInteraction < startThres) {
            t = MathMapToRange(this.TimeSinceLastInteraction, 0.0, startThres, 0.0, 1.0);
        } else if (this.TimeSinceLastInteraction < sustainThres) {
            t = 1.0;
        }
        /* else if (this.TimeSinceLastInteraction < endThres) {
            t = MathMapToRange(this.TimeSinceLastInteraction, sustainThres, endThres, 1.0, 0.0);
        } */

        const sizeScale = 1.0 * MathClamp(t, 0.0, 1.0) * (0.55 + (Math.sin(GTime.Cur * 12.0) + 1.0) * 0.2);

        /* if (this.AnimationComponent.AgeGlobal > 0.2) {
            sizeScale = 1.0 - (this.AnimationComponent.AgeGlobal - 0.2) * 10.0;
        } */

        const finalGlareSize = 2.0 * sizeScale;

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize * 1.5, finalGlareSize);

        gl.uniform1f(this.UniformParametersLocationListFlare.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            GSceneDesc.Tool.Position.x,
            GSceneDesc.Tool.Position.y,
            -0.1,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LightFlareTexture);
        gl.uniform1i(this.UniformParametersLocationListFlare.SpotlightTexture, 1);

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.BLEND);
    }

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame) {
            this.SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }

        if (this.bLaunched || this.SpatialController.bDragState) {
            this.TrailSmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = datGui.addFolder("Tool Params");
        folder.open();

        folder.add(this.PositionCurrent, "x", -2, 5).name("StartPosX").step(0.01).listen();
        folder.add(this.PositionCurrent, "y", -3, 10).name("StartPosY").step(0.01).listen();
        folder.add(this.PositionCurrent, "z", -10, 2).name("StartPosZ").step(0.01).listen();

        folder.add(this.VelocityCurrent, "z", -10, 2).name("VelZ").step(0.01).listen();

        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
        folder.add(this, "bActiveThisFrame", 0, 1).listen();
        folder.add(this, "bIntersection", 0, 1).listen();
    }
}
