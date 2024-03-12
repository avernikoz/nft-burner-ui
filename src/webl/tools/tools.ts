/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GAudioEngine, SoundSample } from "../audioEngine";
import { GCameraShakeController, GSpotlightShakeController } from "../animationController";
import { FirePaintDesc, GBurningSurface } from "../firePlane";
import { GMeshGenerator } from "../helpers/meshGenerator";
import { GUserInputDesc } from "../input";
import { EParticleShadingMode, ParticlesEmitter } from "../particles";
import {
    GetAfterBurnAshesParticlesDesc,
    GetAfterBurnSmokeParticlesDesc,
    GetEmberParticlesDesc,
    GetSmokeParticlesDesc,
} from "../particlesConfig";
import { GSceneDesc, GSceneStateDescsArray, GScreenDesc } from "../scene";
import { CreateShaderProgramVSPS } from "../shaderUtils";
import {
    GetShaderSourceGenericSpriteRenderVS,
    GetShaderSourceImpactFlareRenderPS,
    GetShaderSourceLaserFlareRenderPS,
    GetShaderSourceLightFlareRenderVS,
    GetShaderSourceThunderFlareRenderPS,
} from "../shaders/shaderBackgroundScene";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "../shaders/shaderConfig";
import {
    GetShaderSourceAnimatedSpriteRenderPS,
    GetShaderSourceFireballRenderPS,
    GetShaderSourceLaserPS,
    GetShaderSourceLaserVS,
    GetShaderSourceSingleFlameRenderVS,
    GetShaderSourceThunderPS,
} from "../shaders/shaderTools";
import { ERenderingState, GRenderingStateMachine } from "../states";
import { GTexturePool } from "../texturePool";
import { GetVec2, GetVec3, Matrix4x4, SetVec2, Vector3 } from "../types";
import {
    GTime,
    MathClamp,
    MathGetVec2Length,
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
    MathGetVec3Length,
    GetMatrixBasisTransform,
    GetMatrixInverse,
    Vec3MulMatrix,
    Vec4MulMatrix,
    Vec3Cross,
    MathRotateRoll,
    Vec3Dot,
} from "../utils";
import { BindRenderTarget } from "../resourcesUtils";
import {
    RSpatialControllerVisualizationRenderer,
    SpatialControlPoint,
    SpatialControlPointWithTexture,
} from "../spatialController";
import { bifrostWallet } from "@rainbow-me/rainbowkit/dist/wallets/walletConnectors";
import { TransformFromNDCToWorld } from "../transform";
import { CProjectileComponent } from "./components";
import { GUI } from "dat.gui";
import { GRibbonsRenderer, RRibbonMesh } from "../ribbons";
import { RopeBody } from "../physics";
import { GSimpleShapesRenderer } from "../helpers/shapeRender";

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
    AgeGlobal = 0.0;
    Age = 0.0;
    AgeNormalized = 0.0;

    FadeInParameter = 1.0;
    FadeInSpeed = 1.0;

    FadeOutParameter = 0.0;
    FadeOutSpeed = 1.0;

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

enum ELifetimeState {
    Inactive = 0,
    Attack = 1,
    Sustain,
    Release,
}

class CLifetimeComponent {
    AttackDuration = 0.1; //Fade In
    bOneShot = false;
    SustainDuration = 0.0; //Used if bOneShot
    ReleaseDuration = 1.0; //Fade Out

    TimeSinceStart = 0.0; //Global Age
    ParamT = 0.0; //ASR timeline
    StateCurrent = ELifetimeState.Attack;
    ValueCurrent = 0.0; //[0, 1]

    constructor(boneShot: boolean) {
        this.bOneShot = boneShot;

        this.TimeSinceStart = 1000.0;
        this.ParamT = 1000.0;
    }

    GetCurStateAndValue() {
        if (this.ParamT < this.AttackDuration) {
            const t = MathMapToRange(this.ParamT, 0.0, this.AttackDuration, 0.0, 1.0);
            return { state: ELifetimeState.Attack, value: t };
        }
        if (this.ParamT < this.AttackDuration + this.SustainDuration) {
            const t = 1;
            return { state: ELifetimeState.Sustain, value: t };
        }
        if (this.ParamT < this.AttackDuration + this.SustainDuration + this.ReleaseDuration) {
            const t = MathMapToRange(
                this.ParamT,
                this.AttackDuration + this.SustainDuration,
                this.AttackDuration + this.SustainDuration + this.ReleaseDuration,
                1.0,
                0.0,
            );
            return { state: ELifetimeState.Attack, value: t };
        }
        return { state: ELifetimeState.Inactive, value: 0 };
    }

    GetAttackParam() {
        const stateNParam = this.GetCurStateAndValue();
        if (stateNParam.state == ELifetimeState.Attack) {
            return stateNParam.value;
        } else {
            return 1.0;
        }
    }
    GetReleaseParam() {
        const stateNParam = this.GetCurStateAndValue();
        if (stateNParam.state == ELifetimeState.Release) {
            return stateNParam.value;
        } else {
            return 1.0;
        }
    }

    Reset() {
        this.TimeSinceStart = 0.0;
        this.ParamT = 0.0;
        this.ValueCurrent = 0.0;
        this.StateCurrent = ELifetimeState.Attack;
    }

    Update(bActive: boolean) {
        this.TimeSinceStart += GTime.Delta;
        // eslint-disable-next-line prefer-const
        let bUpdateASR = false;
        if (this.bOneShot) {
            bUpdateASR = true;
        } else {
            if (this.ParamT < this.AttackDuration) {
                bUpdateASR = true;
            } else if (!bActive) {
                bUpdateASR = true;
            }
        }
        if (bUpdateASR) {
            this.ParamT += GTime.Delta;
        }

        const statenParam = this.GetCurStateAndValue();
        this.ValueCurrent = statenParam.value;
        this.StateCurrent = statenParam.state;
    }
}

export enum EBurningTool {
    Laser = 0,
    Lighter,
    Thunder,
    Fireball,
    //===
    NUM,
}

export abstract class ToolBase {
    // Render Resources

    // Components
    LifetimeComponent;

    ApplyFireDesc = new FirePaintDesc();

    // Base
    bActiveThisFrame;
    bFirstInteraction;
    bIntersection;
    bIntersectionPrevFrame;

    LastHitPositionWS = new Vector3(0, 0, 0);
    LastImpactStrength = 0.0;

    // Methods
    constructor(bOneShot: boolean) {
        this.LifetimeComponent = new CLifetimeComponent(bOneShot);
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

    IsAllowedToRender() {
        const RenderStateMachine = GRenderingStateMachine.GetInstance();
        return RenderStateMachine.currentState !== ERenderingState.BurningFinished && RenderStateMachine.bCanBurn;
    }

    BaseUpdate() {}

    BaseReset(hitPosWS: Vector3) {
        this.LastHitPositionWS.Set(hitPosWS);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext): void {}

    RenderToFlameRT(gl: WebGL2RenderingContext): void {}

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {}

    SubmitDebugUI(datGui: dat.GUI): GUI {
        const folder = datGui.addFolder("Tool Params");

        folder.open();

        folder.add(this.LifetimeComponent, "ValueCurrent", 0, 1).name("Lifetime Value").step(0.01).listen();

        folder.add(this, "bActiveThisFrame", 0, 1).listen();
        folder.add(this, "bIntersection", 0, 1).listen();

        //folder.add(this, "LastImpactStrength", 0, 100).name("Impact Strngth").step(0.01).listen();
        folder.add(this, "LastImpactStrength", 0, 100).name("Impact Strngth").step(0.01).listen();

        return folder;
    }
}

export class LighterTool extends ToolBase {
    AnimationComponent;

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
        super(false);

        this.AnimationComponent = new CAnimationComponent();

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
            const velocityMagnitude = MathGetVec2Length(GUserInputDesc.InputVelocityCurViewSpace);
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

        SetVec2(this.ApplyFireDesc.PosCur, curInputPos.x, curInputPos.y);
        this.ApplyFireDesc.Size.x = curInputPos.x + Math.asin(Math.sin(GTime.Cur * 7.0)) * 0.005;
        this.ApplyFireDesc.Size.y = curInputPos.y + 0.1;
        this.ApplyFireDesc.Strength = 4.0 * GTime.Delta;
        this.ApplyFireDesc.bMotionBasedTransform = true;
        this.ApplyFireDesc.bApplyFireUseNoise = false;
        this.ApplyFireDesc.bSmoothOutEdges = true;
        this.ApplyFireDesc.Velocity.x = 0.0;
        this.ApplyFireDesc.Velocity.y = 1.0;

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);
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
        const folder = super.SubmitDebugUI(datGui);
        //folder.open();
        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();

        return folder;
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
        super(false);
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

        this.LifetimeComponent.AttackDuration = 1.0;
        this.LifetimeComponent.ReleaseDuration = 1.0;

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

    PositionCurrent = GetVec3(0, 0, 0);
    PositionPrev = GetVec3(0, 0, 0);

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const RenderStateMachine = GRenderingStateMachine.GetInstance();

        this.UpdatePositionMain({ x: 0.0, y: 0.0, z: this.LaserGlowZPos });

        this.PositionPrev.Set(this.PositionCurrent);
        const posWSCur = TransformFromNDCToWorld(GUserInputDesc.InputPosCurNDC);
        this.PositionCurrent.Set(posWSCur);

        BurningSurface.RigidBody.ApplyForce(posWSCur, 3.0);

        //Interactivity check
        this.LaserDir = MathVector3Normalize(
            Vec3Negate(
                GetVec3(GUserInputDesc.InputPosCurViewSpace.x, GUserInputDesc.InputPosCurViewSpace.y, 0.0),
                this.LaserStartPos,
            ),
        );

        /* this.bIntersection = MathIntersectionRayAABB(
            this.LaserStartPos,
            this.LaserDir,
            GSceneDesc.FirePlane.PositionOffset,
            GetVec3(1.0, 1.0, 0.0),
        ); */

        this.bIntersection = Math.abs(posWSCur.x) < 1.0 && Math.abs(posWSCur.y) < 1.0;

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

                this.LifetimeComponent.Reset();

                this.SparksParticles.Reset(gl);

                if (this.bFirstInteraction) {
                    this.LaserStartPos = GetVec3(
                        MathSignedMax(GUserInputDesc.InputPosCurViewSpace.x, 0.5) * 4.0,
                        GUserInputDesc.InputPosCurViewSpace.y * 5.0,
                        -4.0,
                    );

                    this.bFirstInteraction = false;
                }

                this.PositionPrev.Set(this.PositionCurrent);

                this.PlayLaserSound();

                GCameraShakeController.ShakeCameraFast(0.5);
            }
        } else {
            if (GUserInputDesc.bPointerInputPressedPrevFrame || this.bIntersectionPrevFrame) {
                //start fade out logic
                this.ForceStopLaserSound();
            }
            /* if (this.AnimationComponent.IsFadeInFinished()) {
                this.AnimationComponent.FadeOutUpdate();
            }

            if (this.bActiveThisFrame) {
                if (this.AnimationComponent.IsFadeOutFinished()) {
                    this.bActiveThisFrame = false;
                }
            } */
        }

        this.LifetimeComponent.Update(this.bActiveThisFrame);

        if (this.bActiveThisFrame) {
            //Animation
            /* this.AnimationComponent.Update();
            this.AnimationComponent.FadeInUpdate(); */

            //Color
            GSceneDesc.Tool.Color = this.LaserColor;
            GSceneDesc.Tool.Radius = 2.0 * this.LifetimeComponent.ValueCurrent;

            this.SparksParticles.Update(
                gl,
                BurningSurface.GetCurFireTexture()!,
                GetVec3(GSceneDesc.Tool.Position.x, GSceneDesc.Tool.Position.y, 0.0),
            );

            //Apply Fire
            /* if (this.AnimationComponent.IsFadeInFinished()) {
                this.RenderToFireSurface(gl, BurningSurface);
            } */
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
        const sizeScale = 0.01;

        //BurningSurface.Reset(gl);

        BurningSurface.BindFireRT(gl);

        SetVec2(this.ApplyFireDesc.PosCur, this.PositionCurrent.x, this.PositionCurrent.y);
        this.ApplyFireDesc.Size.x = sizeScale;
        this.ApplyFireDesc.Size.y = sizeScale;
        this.ApplyFireDesc.Strength = this.LaserStrength;
        this.ApplyFireDesc.bMotionBasedTransform = true;
        this.ApplyFireDesc.Velocity.x = GUserInputDesc.InputVelocityCurViewSpace.x;
        this.ApplyFireDesc.Velocity.y = GUserInputDesc.InputVelocityCurViewSpace.y;

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);
        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        return;
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

        const posEndFinal = MathLerpVec3(posStart, posEnd, this.LifetimeComponent.ValueCurrent);
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
            /* this.AnimationComponent.IsFadeInFinished() &&
            this.AnimationComponent.FadeOutParameter >= 0.99 && */
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
        const folder = super.SubmitDebugUI(datGui);
        //folder.open();

        /* folder.add(this.PositionCurrent, "x", -2, 5).name("StartPosX").step(0.01).listen();
        folder.add(this.PositionCurrent, "y", -3, 10).name("StartPosY").step(0.01).listen();
        folder.add(this.PositionCurrent, "z", -10, 2).name("StartPosZ").step(0.01).listen(); */

        return folder;
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        return;
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
    UniformParametersLocationList;

    ShaderProgramFlare;
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
    Color = GetVec3(0.2, 0.2, 1.0);

    GlowZPos = -0.3;

    ThunderStartPos = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    Dir = GetVec3(
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        0.0,
    );

    CamHeightOffset = -0.8;
    Projectile: CProjectileComponent;

    constructor(gl: WebGL2RenderingContext) {
        super(true);
        this.LifetimeComponent.AttackDuration = 0.1;
        this.LifetimeComponent.SustainDuration = 0.5;
        this.LifetimeComponent.ReleaseDuration = 0.1;

        const projectilePos = GetVec3(0.0, this.CamHeightOffset - 0.33, 0.0);
        this.Projectile = new CProjectileComponent(gl, this.Color, projectilePos, 0.125);

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
        SparksParticlesDesc.bUseGravity = true;
        //SparksParticlesDesc.bAlwaysRespawn = true;
        SparksParticlesDesc.b3DSpace = true;
        SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

        const brihgtness = 1.0;
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

    StuckPosTangentSpace = GetVec3(0, 0, 0);
    StuckCounter = 0.0;

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        if (this.IsAllowedToRender()) {
            if (!this.Projectile.bStuck) {
                this.Projectile.OnUpdate(gl);
            } else {
                //from tangent to world
                const verts = BurningSurface.RigidBody.Points;
                const transformMat = GetMatrixBasisTransform(
                    verts[0].PositionCur,
                    verts[1].PositionCur,
                    verts[2].PositionCur,
                    verts[3].PositionCur,
                );
                const posWS = Vec4MulMatrix(this.StuckPosTangentSpace, transformMat);
                this.Projectile.PositionCurrent.Set(posWS);
                GSceneDesc.Tool.Position.x = this.Projectile.PositionCurrent.x;
                GSceneDesc.Tool.Position.y = this.Projectile.PositionCurrent.y;
                GSceneDesc.Tool.Position.z = this.Projectile.PositionCurrent.z - 0.2;
                this.Projectile.ParentSpaceMatrix = transformMat;

                this.StuckCounter += GTime.Delta;
            }
        }

        /* const posWSCur = TransformFromNDCToWorld(GUserInputDesc.InputPosCurNDC);
        BurningSurface.RigidBody.ApplyForce(posWSCur, 5.0, 2.0); */

        this.BaseUpdate();

        //this.bIntersection = this.Projectile.CheckInteresctionWithPlane();
        this.bIntersection = MathIntersectionAABBSphere(
            this.Projectile.PositionCurrent,
            this.Projectile.Scale * 0.5,
            GSceneDesc.FirePlane.PositionOffset,
            GetVec3(1.0, 1.0, 0.0),
        );

        if (this.Projectile.bLaunched || this.Projectile.bStuck) {
            let bInteracted = false;
            if (!this.Projectile.bStuck) {
                bInteracted = this.IsAllowedToRender() && this.bIntersection;

                if (bInteracted) {
                    this.Projectile.bStuck = true;
                    this.StuckCounter = 0.0;
                    //cache local space pos
                    const verts = BurningSurface.RigidBody.Points;
                    const transformMat = GetMatrixBasisTransform(
                        verts[0].PositionCur,
                        verts[1].PositionCur,
                        verts[2].PositionCur,
                        verts[3].PositionCur,
                    );
                    const invTrans = GetMatrixInverse(transformMat);
                    if (invTrans) {
                        //this.Projectile.PositionCurrent.z = 0.0;
                        this.StuckPosTangentSpace = Vec4MulMatrix(this.Projectile.PositionCurrent, invTrans);
                        this.StuckPosTangentSpace.z = 0.0;
                    }
                    this.LastImpactStrength =
                        this.Projectile.VelocityCurrent.z +
                        MathGetVec2Length(
                            GetVec2(this.Projectile.VelocityCurrent.x, this.Projectile.VelocityCurrent.y),
                        ) *
                            0.2;
                    GBurningSurface.GInstance?.RigidBody.ApplyForce(
                        this.Projectile.PositionCurrent,
                        5.0 * this.LastImpactStrength,
                        2.0,
                    );

                    this.Projectile.bLaunched = false;
                }

                bInteracted = false;
            } else {
                if (this.StuckCounter > 0.6) {
                    bInteracted = true;
                }
            }

            if (bInteracted) {
                this.Projectile.bStuck = false;
                this.bActiveThisFrame = true;

                const hitPos = this.Projectile.PositionCurrent;
                this.BaseReset(hitPos);
                this.LifetimeComponent.Reset();

                this.SparksParticles.Reset(gl);
                this.SmokeParticles.Reset(gl);

                this.ThunderStartPos = GetVec3(MathSignedMax(hitPos.x, 0.5) * 6.0, 3 + Math.max(0, hitPos.y), 0.1);

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

                /* GCameraShakeController.ShakeCameraFast();
                GSpotlightShakeController.ShakeSpotlight(1.0); */
                {
                    this.LastImpactStrength =
                        this.Projectile.VelocityCurrent.z +
                        MathGetVec2Length(
                            GetVec2(this.Projectile.VelocityCurrent.x, this.Projectile.VelocityCurrent.y),
                        ) *
                            0.2;
                    const impactAmount = Math.min(this.LastImpactStrength * 0.25, 1.5);
                    const camShakeScale = MathClamp(
                        MathMapToRange(this.LastImpactStrength, 0.0, 8.0, 0.0, 2.0),
                        0.0,
                        2.0,
                    );
                    GCameraShakeController.ShakeCameraFast(camShakeScale);
                    GSpotlightShakeController.ShakeSpotlight(impactAmount);
                    /* const colorScale = MathClamp(
                        MathMapToRange(this.LastImpactStrength, 0.0, 12.0, 0.0, 1.5),
                        0.0,
                        1.5,
                    );
                    this.SparksParticles.SetDynamicBrightness(colorScale); */
                }

                GBurningSurface.GInstance?.RigidBody.ApplyForce(
                    this.Projectile.PositionCurrent,
                    this.LastImpactStrength * 20.0,
                    2.0,
                );

                this.RenderToFireSurface(gl, BurningSurface);

                this.Projectile.Reset();
            }
        }

        this.LifetimeComponent.Update(this.bActiveThisFrame);

        if (this.LifetimeComponent.GetCurStateAndValue().state !== ELifetimeState.Inactive) {
            this.bActiveThisFrame = true;
        } else {
            this.bActiveThisFrame = false;
        }

        if (this.bActiveThisFrame) {
            this.Thickness = Math.max(0.7, this.Thickness - 4.0 * GTime.Delta);

            this.Brightness = Math.max(10.0, this.Brightness - 50.0 * GTime.Delta);

            //Color
            /* const additionToolScale = 0.2;
            GSceneDesc.Tool.Color.r = this.Color.x * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Color.g = this.Color.y * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Color.b = this.Color.z * this.Brightness * additionToolScale;
            GSceneDesc.Tool.Radius = 2.5 * this.LifetimeComponent.ValueCurrent; */
        } else {
            //GSceneDesc.Tool.Radius = 0.0;
        }

        if (this.LifetimeComponent.TimeSinceStart < this.SparksParticles.Desc.ParticleLife) {
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
        const curInputPos = this.Projectile.PositionCurrent;
        //const sizeScale = this.Scale * 0.5;
        const sizeScale = this.Projectile.Scale;

        //BurningSurface.Reset(gl);

        BurningSurface.BindFireRT(gl);

        SetVec2(this.ApplyFireDesc.PosCur, curInputPos.x, curInputPos.y);
        this.ApplyFireDesc.Size.x = sizeScale;
        this.ApplyFireDesc.Size.y = sizeScale;
        this.ApplyFireDesc.Strength = this.LastImpactStrength * 5.0;
        this.ApplyFireDesc.bMotionBasedTransform = false;
        this.ApplyFireDesc.bApplyFireUseNoise = false;
        this.ApplyFireDesc.bSmoothOutEdges = false;
        this.ApplyFireDesc.Velocity.x = this.Projectile.VelocityCurrent.x * GTime.Delta * 0.001;
        this.ApplyFireDesc.Velocity.y = this.Projectile.VelocityCurrent.y * GTime.Delta * 0.001;
        this.ApplyFireDesc.pMaskTexture = this.Projectile.MaskTexture;
        this.ApplyFireDesc.Orientation.Set(this.Projectile.Orientation);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);

        this.ApplyFireDesc.Size.x = sizeScale * 2.0;
        this.ApplyFireDesc.Size.y = sizeScale * 2.0;
        this.ApplyFireDesc.pMaskTexture = null;
        this.ApplyFireDesc.bApplyFireUseNoise = true;
        this.ApplyFireDesc.Strength = this.LastImpactStrength * 0.5;

        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);

        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        /* if (!this.bIntersection) {
            return;
        } */

        if (this.IsAllowedToRender()) {
            if (!this.Projectile.bStuck) {
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LESS);
            }

            this.Projectile.Render(gl);

            if (!this.Projectile.bStuck) {
                gl.disable(gl.DEPTH_TEST);
            }
        }

        if (this.bActiveThisFrame) {
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

            const posStart = this.ThunderStartPos;
            gl.uniform3f(this.UniformParametersLocationList.PositionStart, posStart.x, posStart.y, posStart.z);

            {
                const colorParam = MathClamp(
                    Math.max(0.0, this.LifetimeComponent.TimeSinceStart - 0.4) / 1.0,
                    0.0,
                    1.0,
                );

                const colorScaleAdd = 1.0;

                const colorBright = {
                    r: this.Color.x * Math.max(1.0, this.Brightness),
                    g: this.Color.y * Math.max(1.0, this.Brightness),
                    b: this.Color.z * Math.max(this.Brightness),
                };

                const colorNew = MathLerpColor(
                    colorBright,
                    { r: 0.05 * colorScaleAdd, g: 0.05 * colorScaleAdd, b: 0.1 * colorScaleAdd },
                    colorParam + (1 - this.LifetimeComponent.ValueCurrent),
                );

                gl.uniform3f(this.UniformParametersLocationList.ColorScale, colorNew.r, colorNew.g, colorNew.b);
            }

            gl.uniform1f(this.UniformParametersLocationList.LineThickness, this.Thickness);

            gl.uniform1f(this.UniformParametersLocationList.LineColorCutThreshold, this.LifetimeComponent.ValueCurrent);

            const posEnd = this.LastHitPositionWS;
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

            ///////////////////////////////////////////////////////////////////Render Second Thunder
            //if (this.AnimationComponent.AgeGlobal < 0.1)
            {
                //Textures
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, this.ThunderTexture2);
                gl.uniform1i(this.UniformParametersLocationList.LaserTexture, 1);

                const colorParam = MathClamp(this.LifetimeComponent.TimeSinceStart / 0.5, 0.0, 1.0);

                const asrValue = this.LifetimeComponent.ValueCurrent;
                const colorScaleAdd = 0.5 * (1 - asrValue) * (1 - asrValue);

                const colorBright = {
                    r: this.Color.x * Math.max(1.0, this.Brightness * 0.1),
                    g: this.Color.y * Math.max(this.Brightness * 0.1),
                    b: this.Color.z * Math.max(this.Brightness * 0.1),
                };

                const colorNew = MathLerpColor(
                    colorBright,
                    { r: 0.05 * colorScaleAdd, g: 0.05 * colorScaleAdd, b: 0.1 * colorScaleAdd },
                    colorParam + (1 - asrValue),
                );
                /* const colorNew = MathLerpColor(
                    colorBright,
                    { r: 0.05 * colorScaleAdd, g: 0.05 * colorScaleAdd, b: 0.1 * colorScaleAdd },
                    1.0,
                ); */

                gl.uniform3f(this.UniformParametersLocationList.ColorScale, colorNew.r, colorNew.g, colorNew.b);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            if (this.LifetimeComponent.TimeSinceStart < 0.4) {
                this.RenderFlare(gl);
            }

            //gl.disable(gl.BLEND);
        }
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

        if (this.LifetimeComponent.TimeSinceStart > 0.2) {
            sizeScale = 1.0 - (this.LifetimeComponent.TimeSinceStart - 0.2) * 10.0;
        }

        const finalGlareSize = this.GlareSizeDefault * sizeScale;

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize * 1.5, finalGlareSize);

        gl.uniform1f(this.UniformParametersLocationListFlare.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            this.LastHitPositionWS.x,
            this.LastHitPositionWS.y,
            -0.05,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LightFlareTexture);
        gl.uniform1i(this.UniformParametersLocationListFlare.SpotlightTexture, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = super.SubmitDebugUI(datGui);
        //folder.open();

        return folder;
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame || this.LifetimeComponent.TimeSinceStart < this.SparksParticles.Desc.ParticleLife) {
            this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
        }
    }

    RenderToSmokeRT(gl: WebGL2RenderingContext): void {
        if (this.bActiveThisFrame || this.LifetimeComponent.TimeSinceStart < this.SmokeParticles.Desc.ParticleLife) {
            this.SmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }
}

//=============================================================================================================================
// 														_FIREBALL
//=============================================================================================================================

export class FireballTool extends ToolBase {
    ShaderProgramFlare;
    UniformParametersLocationListFlare;

    //Resources
    LightFlareTexture;

    //Audio

    //Particles
    SparksParticles: ParticlesEmitter;
    SmokeParticles: ParticlesEmitter;

    //Desc
    ColorInitial = GetVec3(1.0, 0.7, 0.35);

    CamHeightOffset = -0.8;

    //Projectile
    Projectile: CProjectileComponent;

    //Ribbon
    RibbonUp = new RRibbonMesh(40);
    RibbonDown = new RRibbonMesh(40);
    RibbonUpPos = GetVec3(0, 0, 0);
    RibbonDownPos = GetVec3(0, 0, 0);
    RibbonSourceOffsetScale = 0.5;
    RibbonBrightness = 0.15;
    RibbonColor = GetVec3(this.RibbonBrightness, this.RibbonBrightness, this.RibbonBrightness);
    RibbonSize = 0.4;

    UpdateRibbonSourcePos(pos: Vector3, offset: number) {
        // this.RibbonSourceOffsetScale = 0.5 + (Math.sin(GTime.Cur * 2.0) + 1.0) * 0.5;
        pos.Set3(0, 0, 0);
        pos.y += offset * this.RibbonSourceOffsetScale;
        MathRotateRoll(pos, -this.Projectile.Orientation.z);
        pos.Add(this.Projectile.PositionCurrent);
    }

    constructor(gl: WebGL2RenderingContext) {
        super(true);
        //Create Shader Program

        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceImpactFlareRenderPS(),
        );
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);

        //Shader Parameters

        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `lightGlare2`);

        //Audio

        //Particles
        {
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
            SparksParticlesDesc.bUseGravity = true;
            //SparksParticlesDesc.bAlwaysRespawn = true;
            SparksParticlesDesc.b3DSpace = true;
            SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

            // eslint-disable-next-line prefer-const
            let sparksBrightness = 0.75;
            SparksParticlesDesc.Color = GetVec3(
                this.ColorInitial.x * sparksBrightness,
                this.ColorInitial.y * sparksBrightness,
                this.ColorInitial.z * sparksBrightness,
            );
            SparksParticlesDesc.MotionStretchScale = 1.3;
            SparksParticlesDesc.InitialVelocityAddScale = GetVec2(0.6, 1.5);

            this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);
        }

        {
            const SmokeParticlesDesc = GetSmokeParticlesDesc();
            SmokeParticlesDesc.NumSpawners2D = 3;
            SmokeParticlesDesc.ParticleLife = 1.8;
            SmokeParticlesDesc.DefaultSize.x *= 1.0;
            SmokeParticlesDesc.DefaultSize.y *= 1.4;
            SmokeParticlesDesc.BuoyancyForceScale *= 0.1;
            SmokeParticlesDesc.bOneShotParticle = true;
            SmokeParticlesDesc.EInitialPositionMode = 2;
            SmokeParticlesDesc.EAlphaFade = 1;
            SmokeParticlesDesc.InitialVelocityScale = 15.0;
            SmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
            SmokeParticlesDesc.EFadeInOutMode = 1;
            SmokeParticlesDesc.AlphaScale = 0.5 + Math.random() * 0.5;
            SmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };

            this.SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
        }

        const projectilePos = GetVec3(0.0, this.CamHeightOffset - 0.33, 0.0);
        this.Projectile = new CProjectileComponent(gl, this.ColorInitial, projectilePos, 0.15);

        GSceneStateDescsArray[ERenderingState.BurningReady].CameraPosition.y = this.CamHeightOffset;
        GSceneStateDescsArray[ERenderingState.BurningReady + 1].CameraPosition.y = this.CamHeightOffset;
        GSceneStateDescsArray[ERenderingState.BurningReady].CameraPosition.y = this.CamHeightOffset;
    }

    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface): void {
        if (this.IsAllowedToRender()) {
            this.Projectile.OnUpdate(gl);
        } else {
            this.Projectile.bLaunched = false;
        }

        this.BaseUpdate();

        //Trail Ribbons
        {
            this.UpdateRibbonSourcePos(this.RibbonUpPos, this.Projectile.Scale);
            this.RibbonUp.OnUpdate(this.RibbonUpPos);

            this.UpdateRibbonSourcePos(this.RibbonDownPos, -this.Projectile.Scale);
            this.RibbonDown.OnUpdate(this.RibbonDownPos);

            const spreadRibbon = (pos: Vector3): void => {
                const dir = Vec3Negate(pos, this.Projectile.PositionCurrent);
                dir.Normalize();
                dir.Mul(1.5 * GTime.Delta);
                pos.Add(dir);
                pos.z -= 1.5 * GTime.Delta;
            };

            this.RibbonUp.ForEachPos(spreadRibbon);
            this.RibbonDown.ForEachPos(spreadRibbon);
        }

        if (this.Projectile.bLaunched) {
            this.bIntersection = this.Projectile.CheckInteresctionWithPlane();

            const bInteracted = this.IsAllowedToRender() && this.bIntersection;

            if (bInteracted) {
                this.bActiveThisFrame = true;

                this.BaseReset(this.Projectile.PositionCurrent);
                this.LifetimeComponent.Reset();

                this.SparksParticles.Reset(gl);
                this.SmokeParticles.Reset(gl);

                this.LastImpactStrength =
                    this.Projectile.VelocityCurrent.z +
                    MathGetVec2Length(GetVec2(this.Projectile.VelocityCurrent.x, this.Projectile.VelocityCurrent.y)) *
                        0.2;
                const impactAmount = Math.min(this.LastImpactStrength * 0.25, 1.5);
                const camShakeScale = MathClamp(MathMapToRange(this.LastImpactStrength, 4.0, 12.0, 0.0, 1.0), 0.0, 1.0);
                GCameraShakeController.ShakeCameraFast(camShakeScale);
                GSpotlightShakeController.ShakeSpotlight(impactAmount);
                const colorScale = MathClamp(MathMapToRange(this.LastImpactStrength, 0.0, 12.0, 0.0, 1.5), 0.0, 1.5);
                this.SparksParticles.SetDynamicBrightness(colorScale);

                GBurningSurface.GInstance?.RigidBody.ApplyForce(
                    this.Projectile.PositionCurrent,
                    this.LastImpactStrength * 20.0,
                    2.0,
                );

                this.RenderToFireSurface(gl, BurningSurface);

                this.Projectile.Reset();
            } else {
            }
        } else {
            //GSceneDesc.Tool.Radius = 0.0;
        }

        this.LifetimeComponent.Update(this.bActiveThisFrame);

        if (this.LifetimeComponent.TimeSinceStart < this.SparksParticles.Desc.ParticleLife + 0.1) {
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

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const curInputPos = this.Projectile.PositionCurrent;
        //const sizeScale = this.Scale * 0.5;
        const sizeScale = this.Projectile.Scale;

        //BurningSurface.Reset(gl);

        BurningSurface.BindFireRT(gl);

        SetVec2(this.ApplyFireDesc.PosCur, curInputPos.x, curInputPos.y);
        this.ApplyFireDesc.Size.x = sizeScale;
        this.ApplyFireDesc.Size.y = sizeScale;
        this.ApplyFireDesc.Strength = this.LastImpactStrength * 5.0;
        this.ApplyFireDesc.bMotionBasedTransform = false;
        this.ApplyFireDesc.bApplyFireUseNoise = false;
        this.ApplyFireDesc.bSmoothOutEdges = false;
        this.ApplyFireDesc.Velocity.x = this.Projectile.VelocityCurrent.x * GTime.Delta * 0.001;
        this.ApplyFireDesc.Velocity.y = this.Projectile.VelocityCurrent.y * GTime.Delta * 0.001;
        this.ApplyFireDesc.pMaskTexture = this.Projectile.MaskTexture;
        this.ApplyFireDesc.Orientation.Set(this.Projectile.Orientation);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);

        this.ApplyFireDesc.Size.x = sizeScale * 2.0;
        this.ApplyFireDesc.Size.y = sizeScale * 2.0;
        this.ApplyFireDesc.pMaskTexture = null;
        this.ApplyFireDesc.bApplyFireUseNoise = true;
        this.ApplyFireDesc.Strength = this.LastImpactStrength * 0.33;

        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);

        gl.disable(gl.BLEND);
    }

    RenderTrailRibbons(gl: WebGL2RenderingContext) {
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        GRibbonsRenderer.GInstance!.Render(
            gl,
            this.RibbonUp.DataCPU.bufferPos,
            this.RibbonUp.DataCPU.bufferVel,
            this.RibbonColor,
            this.RibbonSize,
            true,
        );
        GRibbonsRenderer.GInstance!.Render(
            gl,
            this.RibbonDown.DataCPU.bufferPos,
            this.RibbonDown.DataCPU.bufferVel,
            this.RibbonColor,
            this.RibbonSize,
            true,
        );

        gl.disable(gl.BLEND);
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext) {
        if (this.IsAllowedToRender()) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            this.Projectile.Render(gl);

            gl.disable(gl.DEPTH_TEST);
        }

        {
            this.RenderFlare(gl);
        }

        if (this.Projectile.bLaunched) {
            this.RenderTrailRibbons(gl);
        }
    }

    RenderToFlameRT(gl: WebGL2RenderingContext): void {
        if (this.IsAllowedToRender()) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            if (this.Projectile.bLaunched) {
                this.Projectile.TrailSparksParticles.Render(gl, gl.MAX, gl.ONE, gl.ONE);
            }
            gl.disable(gl.DEPTH_TEST);
        }

        if (this.bActiveThisFrame || this.LifetimeComponent.TimeSinceStart < this.SparksParticles.Desc.ParticleLife) {
            this.SparksParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE);
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
            this.ColorInitial.x,
            this.ColorInitial.y,
            this.ColorInitial.z,
        );

        gl.uniform1f(this.UniformParametersLocationListFlare.ScreenRatio, GScreenDesc.ScreenRatio);

        let t = 0.0;
        const startThres = 0.01;
        const sustainThres = 0.2;
        const endThres = sustainThres + 0.001;
        /* if (this.TimeSinceLastInteraction < startThres) {
            t = MathMapToRange(this.TimeSinceLastInteraction, 0.0, startThres, 0.0, 1.0);
        } else  */ if (this.LifetimeComponent.TimeSinceStart < sustainThres) {
            t = 1.0;
        } else if (this.LifetimeComponent.TimeSinceStart < endThres) {
            t = MathMapToRange(this.LifetimeComponent.TimeSinceStart, sustainThres, endThres, 1.0, 0.0);
        }

        const sizeScale = 1.0 * MathClamp(t, 0.0, 1.0) * (0.6 + (Math.sin(GTime.Cur * 12.0) + 1.0) * 0.2);

        /* if (this.AnimationComponent.AgeGlobal > 0.2) {
            sizeScale = 1.0 - (this.AnimationComponent.AgeGlobal - 0.2) * 10.0;
        } */

        const finalGlareSize = 2.0 * sizeScale;

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize * 2.0, finalGlareSize);

        gl.uniform1f(this.UniformParametersLocationListFlare.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            this.LastHitPositionWS.x,
            this.LastHitPositionWS.y,
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

        if (this.Projectile.bLaunched) {
            this.Projectile.TrailSmokeParticles.Render(gl, gl.FUNC_ADD, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = super.SubmitDebugUI(datGui);
        //folder.open();

        /* folder.add(this.PositionCurrent, "x", -2, 5).name("StartPosX").step(0.01).listen();
        folder.add(this.PositionCurrent, "y", -3, 10).name("StartPosY").step(0.01).listen();
        folder.add(this.PositionCurrent, "z", -10, 2).name("StartPosZ").step(0.01).listen(); */

        //folder.add(this.VelocityCurrent, "z", -10, 2).name("VelZ").step(0.01).listen();

        return folder;
    }
}

//=============================================================================================================================
// 														_SCORPION
//=============================================================================================================================

export class ScorpionTool extends ToolBase {
    Rope = new RopeBody();

    //Controller
    SpatialController;
    ControllerInitialPos = GetVec2(0.0, -0.8);

    SpatialControlTailPoint;

    VelocityCurrent = GetVec3(0, 0, 0);

    TrailRibbon = new RRibbonMesh(40);
    RibbonSourceOffsetScale = 0.5;
    RibbonBrightness = 1.0;
    RibbonColor = GetVec3(1.0 * this.RibbonBrightness, 0.3 * this.RibbonBrightness, 0.1 * this.RibbonBrightness);
    RibbonSize = 10.0;

    constructor(gl: WebGL2RenderingContext, bOneShot = true) {
        super(bOneShot);
        this.SpatialController = new SpatialControlPoint(this.ControllerInitialPos, 0.075, true);

        this.SpatialControlTailPoint = new SpatialControlPoint(this.ControllerInitialPos, 0.075, true);
    }

    ControllerTraction(bInstant = false) {
        const sideThrow = true;

        const vsPos = GetVec3(0, 0, 0);
        if (sideThrow) {
            vsPos.Set3(
                this.SpatialController.PositionViewSpace.x,
                MathMapToRange(
                    this.SpatialController.PositionNDCSpace.y,
                    this.ControllerInitialPos.y,
                    1.0,
                    this.ControllerInitialPos.y + 0.2,
                    0.0,
                ),
                MathMapToRange(this.SpatialController.PositionNDCSpace.y, this.ControllerInitialPos.y, 1.0, 0.5, 3.0),
            );
        } else {
            vsPos.Set3(
                this.SpatialController.PositionViewSpace.x,
                MathMapToRange(
                    this.SpatialController.PositionNDCSpace.y,
                    this.ControllerInitialPos.y,
                    1.0,
                    this.ControllerInitialPos.y,
                    0.4,
                ),
                MathMapToRange(this.SpatialController.PositionNDCSpace.y, this.ControllerInitialPos.y, 1.0, 1.0, 3.0),
            );
        }

        //vsPos.y = this.ControllerInitialPos.y + 0.25;

        const worldPos = GetVec3(
            GSceneDesc.Camera.Position.x + vsPos.x,
            GSceneDesc.Camera.Position.y + vsPos.y,
            GSceneDesc.Camera.Position.z + vsPos.z,
        );

        const cp = this.Rope.ControlPoint!.PositionCur;

        if (bInstant) {
            cp.x = worldPos.x;
            cp.y = worldPos.y;
            cp.z = worldPos.z;
        } else {
            /* this.PositionCurrent.x = MathLerp(this.PositionCurrent.x, worldPos.x, 0.25);
            this.PositionCurrent.y = MathLerp(this.PositionCurrent.y, worldPos.y, 0.25);
            this.PositionCurrent.z = MathLerp(this.PositionCurrent.z, worldPos.z, 0.25); */

            const dt = Math.min(1 / 60, GTime.Delta);
            SetPositionSmooth(cp, this.VelocityCurrent, worldPos, dt, 200.0, 15.0);
        }
    }

    bLaunched = false;

    AttemptLaunch(gl: WebGL2RenderingContext) {
        /* let bCanLaunch = this.VelocityCurrent.z > 2.0;
        bCanLaunch = bCanLaunch || (this.VelocityCurrent.z > 1.0 && Math.abs(this.VelocityCurrent.x) > 2); */
        const bCanLaunch = true;
        if (bCanLaunch) {
            //Higher when hit from the side
            //this.VelocityCurrent.y *= 1.0 + Math.abs(this.PositionCurrent.x) * 0.75;

            this.bLaunched = true;

            this.Rope.ControlPoint!.bIsPinned = false;

            const p0 = this.Rope.LastPoint!;
            const p1 = this.Rope.PrevLastPoint!;

            //push the apex a bit further if it is behind the tail
            p0.PositionCur.z += 0.05;

            /* if (p1.PositionCur.z > p0.PositionCur.z) {
                p1.PositionCur.z = p0.PositionCur.z - 0.1;
                p1.PositionPrev.z = p1.PositionCur.z;
            } */

            p0.PositionPrev.x = p0.PositionCur.x;

            if (p1.PositionCur.z < p0.PositionCur.z) {
                p1.PositionCur.x = MathLerp(p1.PositionCur.x, p0.PositionCur.x, 0.75);
                //p1.PositionCur.x = p0.PositionCur.x;
            }
            p1.PositionPrev.x = p1.PositionCur.x;

            p0.bHasMass = true;
            p1.bHasMass = true;
        } else {
        }

        this.SpatialController.PositionViewSpace.x = this.ControllerInitialPos.x;
        this.SpatialController.PositionViewSpace.y = this.ControllerInitialPos.y;
    }

    Reset(bReturnBack: boolean) {
        this.Rope.ControlPoint!.bIsPinned = true;

        this.Rope.PrevLastPoint!.bHasMass = false;
        this.Rope.LastPoint!.bHasMass = false;

        if (bReturnBack) {
            this.SpatialController.PositionViewSpace.x = GUserInputDesc.InputPosCurViewSpace.x;
            this.SpatialController.PositionViewSpace.y = GUserInputDesc.InputPosCurViewSpace.y;
        } else {
            this.SpatialController.PositionViewSpace.x = this.ControllerInitialPos.x;
            this.SpatialController.PositionViewSpace.y = this.ControllerInitialPos.y;
        }

        this.VelocityCurrent.x = 0.0;
        this.VelocityCurrent.y = 0.0;
        this.VelocityCurrent.z = 0.0;

        this.bLaunched = false;
        this.ProjectileStuck = false;
    }

    ProjectileStuck = false;
    StuckPosTangentSpace = GetVec3(0, 0, 0);
    StuckCounter = 0.0;
    ParentSpaceMatrix = new Matrix4x4();
    SpearDir = new Vector3(0, 0, 0);

    //Painter
    bSurfacePaintedPrevFrame = false;
    SurfacePaintPrevFramePos = GetVec3(0, 0, 0);

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const sizeScale = 0.01;

        BurningSurface.BindFireRT(gl);

        //BurningSurface.Reset(gl);

        const p = this.Rope.LastPoint!.PositionCur;
        const v = this.Rope.LastPoint!.PrevVelocity;

        const vBoost = 1.0;

        SetVec2(this.ApplyFireDesc.PosCur, p.x, p.y);
        this.ApplyFireDesc.Size.x = sizeScale;
        this.ApplyFireDesc.Size.y = sizeScale;
        this.ApplyFireDesc.Strength = 1.0;
        this.ApplyFireDesc.bMotionBasedTransform = true;
        this.ApplyFireDesc.Velocity.x = v.x * vBoost;
        this.ApplyFireDesc.Velocity.y = v.y * vBoost;

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(gl, this.ApplyFireDesc);
        gl.disable(gl.BLEND);
    }

    TailControllerTraction() {
        //Get WS pos of the controller
        /* const wsPos = GetVec3(
            this.SpatialControlTailPoint.PositionViewSpace.x,
            this.SpatialControlTailPoint.PositionViewSpace.y,
            0.0,
        ); */
        /* wsPos.x += GSceneDesc.Camera.Position.x;
        wsPos.y += GSceneDesc.Camera.Position.y;
        wsPos.z += GSceneDesc.Camera.Position.z; */

        const wsPos = TransformFromNDCToWorld(this.SpatialControlTailPoint.PositionNDCSpace, 0);

        const cp = this.Rope.Points[0]!.PositionCur;

        cp.x = wsPos.x;
        cp.y = wsPos.y;
        cp.z = wsPos.z;
    }

    TailControlBegin() {
        //assign the viewpos of the tail to the controller
        const tailInitPosVS = GetVec3(0, -0.3, 0.0);
        this.SpatialControlTailPoint.PositionViewSpace.x = tailInitPosVS.x;
        this.SpatialControlTailPoint.PositionViewSpace.y = tailInitPosVS.y;
    }

    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface): void {
        if (!this.ProjectileStuck) {
            this.SpatialController.OnUpdate();

            if (this.SpatialController.bReleasedThisFrame) {
                this.AttemptLaunch(gl);
            } else {
                if (!this.bLaunched) {
                    this.ControllerTraction(true);
                }
            }
        } else {
            //from tangent to world
            const verts = BurningSurface.RigidBody.Points;
            const transformMat = GetMatrixBasisTransform(
                verts[0].PositionCur,
                verts[1].PositionCur,
                verts[2].PositionCur,
                verts[3].PositionCur,
            );
            const posWS = Vec4MulMatrix(this.StuckPosTangentSpace, transformMat);
            this.Rope.LastPoint!.PositionCur.Set(posWS);

            //remove translation
            transformMat.elements[3][0] = 0.0;
            transformMat.elements[3][1] = 0.0;
            transformMat.elements[3][2] = 0.0;
            const dirWS = Vec4MulMatrix(this.SpearDir, transformMat);
            dirWS.Mul(this.Rope.Constraints[this.Rope.Constraints.length - 1].RestLength);
            this.Rope.PrevLastPoint!.PositionCur.Set(Vec3Add(posWS, dirWS));

            this.ParentSpaceMatrix = transformMat;

            /* this.SpatialControlTailPoint.OnUpdate();
            this.TailControllerTraction(); */

            this.StuckCounter += GTime.Delta;
        }

        //remove movement in x dir
        if (0) {
            const xDampAmount = 0.05;
            this.Rope.LastPoint!.PositionPrev.x = MathLerp(
                this.Rope.LastPoint!.PositionPrev.x,
                this.Rope.LastPoint!.PositionCur.x,
                xDampAmount,
            );
            this.Rope.PrevLastPoint!.PositionPrev.x = MathLerp(
                this.Rope.PrevLastPoint!.PositionPrev.x,
                this.Rope.PrevLastPoint!.PositionCur.x,
                xDampAmount,
            );
        }

        //Trail Ribbon
        {
            const middle = GetVec3(0, 0, 0);
            //middle.Set(this.Rope.PrevLastPoint!.PositionCur);
            middle.Set(this.Rope.Points[this.Rope.Points.length - 5]!.PositionCur);
            middle.Add(this.Rope.LastPoint!.PositionCur);
            middle.Mul(0.5);
            let tangent = GetVec3(0, 0, 0);
            tangent.Set(this.Rope.LastPoint!.PositionCur);
            tangent.Negate(this.Rope.PrevLastPoint!.PositionCur);
            tangent.Normalize();
            const vecZ = GetVec3(0, 0, -1);
            tangent = Vec3Cross(tangent, vecZ);
            this.TrailRibbon.OnUpdate(middle, tangent);
        }

        //Compute Spear Params
        if (!this.ProjectileStuck) {
            this.SpearDir.Set(this.Rope.LastPoint!.PositionCur);
            this.SpearDir.Negate(this.Rope.PrevLastPoint!.PositionCur);
            this.SpearDir.Normalize();
        }

        //Painter
        if (this.SpatialController.bDragState) {
            //make sure it looks forward
            if (this.Rope.LastPoint!.PositionCur.z > this.Rope.PrevLastPoint!.PositionCur.z) {
                const rayOrigin = this.Rope.LastPoint!.PositionCur;
                const rayDir = GetVec3(-this.SpearDir.x, -this.SpearDir.y, -this.SpearDir.z);
                /* this.bIntersection = MathIntersectionAABBSphere(
                this.Rope.LastPoint!.PositionCur,
                0.5,
                GSceneDesc.FirePlane.PositionOffset,
                GetVec3(1.0, 1.0, 0.0),
            ); */

                const bPaintIntersection = MathIntersectionRayAABB(
                    rayOrigin,
                    rayDir,
                    GSceneDesc.FirePlane.PositionOffset,
                    GetVec3(1.0, 1.0, 0.0),
                );

                if (bPaintIntersection) {
                    this.RenderToFireSurface(gl, BurningSurface);

                    GCameraShakeController.ShakeCameraFast(0.5);
                }

                this.bSurfacePaintedPrevFrame = bPaintIntersection;
            }
        }

        if (this.bLaunched || this.ProjectileStuck) {
            //attempt to return back
            if (GUserInputDesc.bPointerInputPressedCurFrame) {
                this.Reset(true);
            }

            if (!this.ProjectileStuck) {
                //damp angular diff
                /* {
                    const angularDampAmount = 0.05;
                    const pHead = this.Rope.LastPoint!;
                    const pTail = this.Rope.PrevLastPoint!;
                    pHead.PositionPrev.x = MathLerp(pHead.PositionPrev.x, pHead.PositionCur.x, angularDampAmount);
                    pTail.PositionCur.x = MathLerp(pTail.PositionCur.x, pHead.PositionCur.x, angularDampAmount);
                    pTail.PositionPrev.x = MathLerp(pTail.PositionPrev.x, pTail.PositionCur.x, angularDampAmount);
                } */

                this.bIntersection = MathIntersectionAABBSphere(
                    this.Rope.LastPoint!.PositionCur,
                    0.1,
                    GSceneDesc.FirePlane.PositionOffset,
                    GetVec3(1.0, 1.0, 0.0),
                );

                let bBounceCollision = false;

                if (this.bIntersection) {
                    //check if current spear dir is aligned
                    const cosAngle = Vec3Dot(this.SpearDir, GetVec3(0, 0, 1));

                    //should be fast enough to stick
                    this.LastImpactStrength =
                        Math.abs(this.Rope.LastPoint!.PositionCur.z - this.Rope.LastPoint!.PositionPrev.z) /
                        this.Rope.DeltaTime;

                    if (cosAngle > 0.8 && this.LastImpactStrength > 4.0) {
                        //intersection
                    } else {
                        this.bIntersection = false;
                        //The blade wont penetrate but just bounce away
                        const bounceStrength = 0.1;
                        this.Rope.LastPoint!.PositionCur.z = -bounceStrength;
                        this.Rope.PrevLastPoint!.PositionCur.z = -bounceStrength;

                        bBounceCollision = true;
                    }
                }

                if (this.bIntersection) {
                    this.ProjectileStuck = true;
                    this.StuckCounter = 0.0;

                    //this.TailControlBegin();

                    //offset spear
                    /* this.Rope.LastPoint!.PositionCur.z = 0.2;
                    this.Rope.LastPoint!.PositionPrev.z = 0.2; */

                    //cache local space pos
                    const verts = BurningSurface.RigidBody.Points;
                    const transformMat = GetMatrixBasisTransform(
                        verts[0].PositionCur,
                        verts[1].PositionCur,
                        verts[2].PositionCur,
                        verts[3].PositionCur,
                    );
                    const invTrans = GetMatrixInverse(transformMat);
                    if (invTrans) {
                        //this.Projectile.PositionCurrent.z = 0.0;
                        this.StuckPosTangentSpace = Vec4MulMatrix(this.Rope.LastPoint!.PositionCur, invTrans);

                        //stick deeper into the surface
                        this.StuckPosTangentSpace.z = MathLerp(
                            -0.05,
                            -0.2,
                            MathClamp(MathMapToRange(this.LastImpactStrength, 5.0, 15.0, 0.0, 1.0), 0.0, 1.0),
                        );
                    }

                    //Apply force
                    {
                        const camShakeScale = MathClamp(
                            MathMapToRange(this.LastImpactStrength, 0.0, 20.0, 0.0, 1.0),
                            0.0,
                            1.0,
                        );
                        GCameraShakeController.ShakeCameraFast(camShakeScale * 0.5);
                        /* const colorScale = MathClamp(
							MathMapToRange(this.LastImpactStrength, 0.0, 12.0, 0.0, 1.5),
							0.0,
							1.5,
						);
						this.SparksParticles.SetDynamicBrightness(colorScale); */
                    }

                    this.bLaunched = false;
                }

                if (this.bIntersection || bBounceCollision) {
                    GBurningSurface.GInstance?.RigidBody.ApplyForce(
                        this.Rope.LastPoint!.PositionCur,
                        this.LastImpactStrength * 20.0 * (bBounceCollision ? 0.2 : 1.0),
                        2.0,
                    );
                }
            } else {
                /* if (this.StuckCounter > 2.6) {
                    this.ProjectileStuck = false;
                    this.Reset(false);
                } */
            }
        }

        this.Rope.OnUpdateBase();

        if (this.IsOutOfBounds()) {
            this.Reset(false);
        }
    }

    IsOutOfBounds() {
        const head = this.Rope.LastPoint!.PositionCur;
        return (
            head.z > 3.0 ||
            head.z < GSceneDesc.Camera.Position.z - 1.0 ||
            Math.abs(head.x) > 5.0 ||
            Math.abs(head.y) > 5.0 ||
            head.y < GSceneDesc.Floor.Position.y
        );
    }

    RenderToFirePlaneRT(gl: WebGL2RenderingContext): void {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.depthMask(false);

        this.Rope.Render(gl);

        if (!this.bLaunched && !this.ProjectileStuck) {
            GSimpleShapesRenderer.GInstance!.RenderPoint(gl, this.Rope.ControlPoint!.PositionCur, 0.025);
        }

        if (this.ProjectileStuck) {
            const color = GetVec3(1.0, 0.0, 0.2);
            if (this.SpatialControlTailPoint.bIntersectionThisFrame) {
                color.y = 1.0;
            }

            GSimpleShapesRenderer.GInstance!.RenderPoint(gl, this.Rope.Points[0]!.PositionCur, 0.025, color);
        }

        const points = this.Rope.Points;
        const numPoints = points.length;

        const spearStart = points[numPoints - 2].PositionCur;
        const spearEnd = points[numPoints - 1].PositionCur;

        const spearDir = Vec3Negate(this.Rope.LastPoint!.PositionCur, this.Rope.PrevLastPoint!.PositionCur);
        spearDir.Normalize();
        const finColor = GetVec3(10.0, 0.4, 0.4);
        finColor.Mul(2.0);

        //gl.disable(gl.BLEND);

        //Triangle
        const v0 = spearEnd;
        const dToCam = GetVec3(0, 0, -1);
        /* dToCam.x = GSceneDesc.Camera.Position.x;
        dToCam.y = GSceneDesc.Camera.Position.y;
        dToCam.z = GSceneDesc.Camera.Position.z;
        dToCam.Negate(spearStart); */
        const n = Vec3Cross(spearDir, dToCam);
        n.Normalize();
        n.Mul(0.04);
        const v1 = GetVec3(0, 0, 0);
        v1.Set(spearStart);
        v1.Add(n);
        const v2 = GetVec3(0, 0, 0);
        v2.Set(spearStart);
        v2.Negate(n);

        GSimpleShapesRenderer.GInstance!.RenderTriangle(gl, v0, v1, v2, finColor);

        gl.depthMask(true);
        gl.disable(gl.DEPTH_TEST);

        GSceneDesc.Tool.Position.x = spearStart.x;
        GSceneDesc.Tool.Position.y = spearStart.y;
        GSceneDesc.Tool.Position.z = spearStart.z;
        const toolBright = 0.85;
        finColor.Set3(1.0, 0.5, 0.1);
        GSceneDesc.Tool.Color.r = finColor.x * toolBright;
        GSceneDesc.Tool.Color.g = finColor.y * toolBright;
        GSceneDesc.Tool.Color.b = finColor.z * toolBright;
        GSceneDesc.Tool.Radius = 1.0;

        GRibbonsRenderer.GInstance!.Render(
            gl,
            this.TrailRibbon.DataCPU.bufferPos,
            this.TrailRibbon.DataCPU.bufferVel,
            this.RibbonColor,
            this.RibbonSize,
            true,
        );
    }

    SubmitDebugUI(datGui: GUI): GUI {
        const folder = super.SubmitDebugUI(datGui);

        this.Rope.SubmitDebugUI(datGui);

        return folder;
    }
}

class CImpactComponent {
    ShaderProgramFlare;
    UniformParametersLocationListFlare;

    //Particles
    SparksParticles: ParticlesEmitter;
    SmokeParticles: ParticlesEmitter;

    //Resources
    LightFlareTexture;

    constructor(gl: WebGL2RenderingContext, color: Vector3, brightness = 1.0) {
        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceImpactFlareRenderPS(),
        );
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);

        //Shader Parameters

        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `lightGlare2`);

        //Particles
        {
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
            SparksParticlesDesc.bUseGravity = true;
            //SparksParticlesDesc.bAlwaysRespawn = true;
            SparksParticlesDesc.b3DSpace = true;
            SparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;

            // eslint-disable-next-line prefer-const
            let sparksBrightness = brightness;
            SparksParticlesDesc.Color = GetVec3(
                color.x * sparksBrightness,
                color.y * sparksBrightness,
                color.z * sparksBrightness,
            );
            SparksParticlesDesc.MotionStretchScale = 1.3;
            SparksParticlesDesc.InitialVelocityAddScale = GetVec2(0.6, 1.5);

            this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);
        }

        {
            const SmokeParticlesDesc = GetSmokeParticlesDesc();
            SmokeParticlesDesc.NumSpawners2D = 3;
            SmokeParticlesDesc.ParticleLife = 1.8;
            SmokeParticlesDesc.DefaultSize.x *= 1.0;
            SmokeParticlesDesc.DefaultSize.y *= 1.4;
            SmokeParticlesDesc.BuoyancyForceScale *= 0.1;
            SmokeParticlesDesc.bOneShotParticle = true;
            SmokeParticlesDesc.EInitialPositionMode = 2;
            SmokeParticlesDesc.EAlphaFade = 1;
            SmokeParticlesDesc.InitialVelocityScale = 15.0;
            SmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
            SmokeParticlesDesc.EFadeInOutMode = 1;
            SmokeParticlesDesc.AlphaScale = 0.5 + Math.random() * 0.5;
            SmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };

            this.SmokeParticles = new ParticlesEmitter(gl, SmokeParticlesDesc);
        }
    }
}

export class FireworkTool {
    //Multiple trail projectiles
}
