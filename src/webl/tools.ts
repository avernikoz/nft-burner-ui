import { GAudioEngine, SoundSample } from "./audioEngine";
import { GBurningSurface } from "./firePlane";
import { GMeshGenerator } from "./helpers/meshGenerator";
import { GUserInputDesc } from "./input";
import { EParticleShadingMode, ParticlesEmitter } from "./particles";
import { GetEmberParticlesDesc } from "./particlesConfig";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import {
    GetShaderSourceLaserFlareRenderPS,
    GetShaderSourceLightFlareRenderPS,
    GetShaderSourceLightFlareRenderVS,
} from "./shaders/shaderBackgroundScene";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";
import {
    GetShaderSourceAnimatedSpriteRenderPS,
    GetShaderSourceLaserPS,
    GetShaderSourceLaserVS,
    GetShaderSourceSingleFlameRenderVS,
} from "./shaders/shaderTools";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";
import { Vector3 } from "./types";
import {
    GTime,
    MathClamp,
    MathGetVectorLength,
    MathLerp,
    MathLerpColor,
    MathLerpVec3,
    MathMapToRange,
    MathSignedMax,
    MathVector3Add,
    MathVector3Multiply,
    MathVector3Negate,
    MathVector3Normalize,
} from "./utils";

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

/* class CAudioComponent {

} */

export class LighterTool {
    //Render Resources
    ShaderProgram;

    UniformParametersLocationList;

    ColorTexture;

    LUTTexture;

    VAO = CommonRenderingResources.PlaneShapeVAO;

    NumVertices = 6;

    VertexBufferGPU: WebGLBuffer | null = null;

    TexCoordsBufferGPU: WebGLBuffer | null = null;

    //Components
    AnimationComponent = new CAnimationComponent();

    //Particles
    SparksParticles: ParticlesEmitter;

    SmokeParticles: ParticlesEmitter;

    //Base
    bActiveThisFrame = false;

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

        const SparksParticlesDesc = {
            inName: "Sparks Particles",
            inNumSpawners2D: 3,
            inNumParticlesPerSpawner: 1,
            inSpawnRange: { x: 0.0, y: 1000.0 },
            inParticleLife: 1.3,
            inNumLoops: 1.0,
            inTextureFileName: "",
            inFlipbookSizeRC: { x: 16.0, y: 4.0 },
            inDefaultSize: { x: 0.125 * 0.1, y: 0.125 * 0.25 },
            inSizeRangeMinMax: { x: 0.25, y: 1.25 },
            inSizeClampMax: { x: 0.0, y: 0.0 },
            inInitialVelocityScale: 50.0,
            inVelocityFieldForceScale: 100.0,
            inBuoyancyForceScale: 15.0,
            inDownwardForceScale: 1.0,
            inbOriginAtCenter: true,
            inbMotionBasedTransform: true,
            inEFadeInOutMode: 0,
            inESpecificShadingMode: EParticleShadingMode.Embers,
            inEInitialPositionMode: 2,
            inbOneShotParticle: true,
        };

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);

        const LighterSmokeParticleDesc = {
            inName: "Lighter Smoke Particles",
            inNumSpawners2D: 1,
            inNumParticlesPerSpawner: 1,
            inSpawnRange: { x: 0.0, y: 0.1 },
            inParticleLife: 2.0,
            inNumLoops: 1.0,
            inTextureFileName: "CandleSmoke01_20x4",
            inFlipbookSizeRC: { x: 20.0, y: 4.0 },
            inDefaultSize: { x: 2.0 * 0.1, y: 3.525 * 0.15 },
            inSizeRangeMinMax: { x: 0.99, y: 1.01 },
            inSizeClampMax: { x: 1.0, y: 1.0 },
            inInitialVelocityScale: 2.1,
            inVelocityFieldForceScale: 1.0,
            inBuoyancyForceScale: 10,
            inDownwardForceScale: 0.0,
            inbOriginAtCenter: false,
            inbMotionBasedTransform: false,
            inEAlphaFade: 1,
            inAlphaScale: 0.95,
            inBrightness: 0.0,
            inRandomSpawnThres: 1.0,
            inEFadeInOutMode: 0,
            inESpecificShadingMode: EParticleShadingMode.AfterBurnSmoke,
            inInitSpawnPosOffset: { x: 0.2, y: 0.0 },
            inInitialTranslate: { x: 0.0, y: 0.95 },
            inEInitialPositionMode: 2,
            inbOneShotParticle: true,
        };

        this.SmokeParticles = new ParticlesEmitter(gl, LighterSmokeParticleDesc);

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
        //State independent update
        {
            //Position
            const posWS = { x: GUserInputDesc.InputPosCurNDC.x, y: GUserInputDesc.InputPosCurNDC.y };
            posWS.x *= GScreenDesc.ScreenRatio;
            posWS.x /= GSceneDesc.Camera.ZoomScale;
            posWS.y /= GSceneDesc.Camera.ZoomScale;

            posWS.x *= -GSceneDesc.Camera.Position.z + 1.0;
            posWS.y *= -GSceneDesc.Camera.Position.z + 1.0;
            posWS.y += 0.25;

            GSceneDesc.Tool.Position.x = posWS.x;
            GSceneDesc.Tool.Position.y = posWS.y;
            GSceneDesc.Tool.Position.z = -0.3;
        }

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
            if (this.AnimationComponent.FadeInParameter >= 0.99) {
                this.AnimationComponent.FadeOutUpdate();
            }

            if (this.bActiveThisFrame) {
                if (this.AnimationComponent.FadeOutParameter < 0) {
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
            this.SparksParticles.Update(gl, BurningSurface.GetCurFireTexture()!, {
                x: GSceneDesc.Tool.Position.x,
                y: GSceneDesc.Tool.Position.y - 0.275,
            });
            this.SmokeParticles.Update(gl, BurningSurface.GetCurFireTexture()!, {
                x: GSceneDesc.Tool.Position.x,
                y: GSceneDesc.Tool.Position.y - 0.5,
            });

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
        const curInputDir = { x: 0, y: 0 };
        curInputDir.x = GUserInputDesc.InputPosCurNDC.x - GUserInputDesc.InputPosPrevNDC.x;
        curInputDir.y = GUserInputDesc.InputPosCurNDC.y - GUserInputDesc.InputPosPrevNDC.y;
        const inputDirLength = MathGetVectorLength(curInputDir);
        let sizeScale;
        if (GUserInputDesc.bPointerInputMoving == false) {
            sizeScale = 0.005;
            curInputDir.x = 0;
            curInputDir.y = 1;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sizeScale = MathClamp(inputDirLength * 0.5, 0.001, 0.05);
        }

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y + 0.1 },
            { x: 0.0, y: 1.0 },
            0.05,
            2.0 * GTime.Delta,
            true,
        );
        gl.disable(gl.BLEND);
    }

    Render(gl: WebGL2RenderingContext) {
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
    }

    SubmitDebugUI(datGui: dat.GUI) {
        const folder = datGui.addFolder("Tool Params");
        //folder.open();

        folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
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
}

//=============================================================================================================================
// 														LASER
//=============================================================================================================================

function rayAABBIntersection(rayOrigin: Vector3, rayDirection: Vector3, aabbCenter: Vector3, aabbExtent: Vector3) {
    // Calculate the inverse direction of the ray
    const invDirection: Vector3 = {
        x: 1.0 / rayDirection.x,
        y: 1.0 / rayDirection.y,
        z: 1.0 / rayDirection.z,
    };

    // Calculate the minimum and maximum t values for each axis
    const tmin = (aabbCenter.x - aabbExtent.x - rayOrigin.x) * invDirection.x;
    const tmax = (aabbCenter.x + aabbExtent.x - rayOrigin.x) * invDirection.x;
    const tymin = (aabbCenter.y - aabbExtent.y - rayOrigin.y) * invDirection.y;
    const tymax = (aabbCenter.y + aabbExtent.y - rayOrigin.y) * invDirection.y;
    const tzmin = (aabbCenter.z - aabbExtent.z - rayOrigin.z) * invDirection.z;
    const tzmax = (aabbCenter.z + aabbExtent.z - rayOrigin.z) * invDirection.z;

    // Find the maximum and minimum t values for intersection
    const tEnter = Math.max(Math.max(Math.min(tmin, tmax), Math.min(tymin, tymax)), Math.min(tzmin, tzmax));
    const tExit = Math.min(Math.min(Math.max(tmin, tmax), Math.max(tymin, tymax)), Math.max(tzmin, tzmax));

    // Check if the intersection is outside the valid range
    if (tExit < 0 || tEnter > tExit) {
        return false;
    } else {
        return true;
    }
}

export class LaserTool {
    //Render Resources
    ShaderProgram;

    ShaderProgramFlare;

    UniformParametersLocationList;

    UniformParametersLocationListFlare;

    LaserTexture;

    NoiseTexture;

    LightFlareTexture;

    //Components
    AnimationComponent = new CAnimationComponent();

    //Base
    bActiveThisFrame = false;

    bFirstInteraction = true;

    bIntersection = false;

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

    LaserStrength = 5.0 + Math.random() * 5.0;

    LaserBrightness = 4.0;

    LaserColor = { r: 1.0 * this.LaserBrightness, g: 0.4 * this.LaserBrightness, b: 0.2 * this.LaserBrightness };

    LaserGlowZPos = -0.3;

    LaserStartPos = {
        x: MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        y: MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        z: 0.0,
    };

    LaserDir = {
        x: MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        y: MathMapToRange(Math.random(), 0.0, 1.0, -1.0, 1.0) * -10.0,
        z: 0.0,
    };

    constructor(gl: WebGL2RenderingContext) {
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

        this.LaserTexture = GTexturePool.CreateTexture(gl, false, "laserBeam0", false);
        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");
        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `laserGlare0`);

        this.AnimationComponent.Speed = 1.0;
        this.AnimationComponent.FadeInSpeed = 15.0;
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
        SparksParticlesDesc.inNumSpawners2D = 32;
        SparksParticlesDesc.inSpawnRange.x = 0.0;
        SparksParticlesDesc.inParticleLife = 0.5;
        //SparksParticlesDesc.inDefaultSize.x *= 2.0;
        //SparksParticlesDesc.inDefaultSize.y *= 0.5;
        SparksParticlesDesc.inInitialVelocityScale *= 0.5;
        //SparksParticlesDesc.inVelocityFieldForceScale *= 10.0;
        SparksParticlesDesc.inEInitialPositionMode = 2;
        SparksParticlesDesc.inRandomSpawnThres = 0.5;
        SparksParticlesDesc.inbOneShotParticle = true;

        this.SparksParticles = new ParticlesEmitter(gl, SparksParticlesDesc);
    }

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const RenderStateMachine = GRenderingStateMachine.GetInstance();
        //State independent update
        {
            //Position
            const posWS = { x: GUserInputDesc.InputPosCurNDC.x, y: GUserInputDesc.InputPosCurNDC.y };
            posWS.x *= GScreenDesc.ScreenRatio;
            posWS.x /= GSceneDesc.Camera.ZoomScale;
            posWS.y /= GSceneDesc.Camera.ZoomScale;

            posWS.x *= -GSceneDesc.Camera.Position.z + 1.0;
            posWS.y *= -GSceneDesc.Camera.Position.z + 1.0;
            //posWS.y += 0.25;

            GSceneDesc.Tool.Position.x = posWS.x;
            GSceneDesc.Tool.Position.y = posWS.y;
            GSceneDesc.Tool.Position.z = this.LaserGlowZPos;
        }

        //Interactivity check

        this.LaserDir = MathVector3Normalize(
            MathVector3Negate(
                { x: GUserInputDesc.InputPosCurViewSpace.x, y: GUserInputDesc.InputPosCurViewSpace.y, z: 0.0 },
                this.LaserStartPos,
            ),
        );

        this.bIntersection = rayAABBIntersection(
            this.LaserStartPos,
            this.LaserDir,
            GSceneDesc.FirePlane.PositionOffset,
            { x: 0.4, y: 0.4, z: 0.0 },
        );

        const bInteracted =
            RenderStateMachine.currentState !== ERenderingState.BurningFinished &&
            RenderStateMachine.bCanBurn &&
            GUserInputDesc.bPointerInputPressedCurFrame &&
            this.bIntersection;

        if (bInteracted) {
            this.bActiveThisFrame = true;
            if (!GUserInputDesc.bPointerInputPressedPrevFrame) {
                //start fade in logic

                this.AnimationComponent.Reset();

                this.SparksParticles.Reset(gl);

                if (this.bFirstInteraction) {
                    this.LaserStartPos = {
                        x: MathSignedMax(GUserInputDesc.InputPosCurViewSpace.x, 0.5) * 4.0,
                        y: GUserInputDesc.InputPosCurViewSpace.y * 5.0,
                        z: -4.0,
                    };

                    this.bFirstInteraction = false;
                }

                this.PlayLaserSound();
            }
        } else {
            if (GUserInputDesc.bPointerInputPressedPrevFrame) {
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

            this.SparksParticles.Update(gl, BurningSurface.GetCurFireTexture()!, {
                x: GSceneDesc.Tool.Position.x,
                y: GSceneDesc.Tool.Position.y,
            });

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
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: GBurningSurface) {
        const curInputPos = GUserInputDesc.InputPosCurNDC;
        const curInputDir = { x: 0, y: 0 };
        curInputDir.x = GUserInputDesc.InputPosCurNDC.x - GUserInputDesc.InputPosPrevNDC.x;
        curInputDir.y = GUserInputDesc.InputPosCurNDC.y - GUserInputDesc.InputPosPrevNDC.y;
        const inputDirLength = MathGetVectorLength(curInputDir);
        let sizeScale;
        if (GUserInputDesc.bPointerInputMoving == false) {
            sizeScale = 0.005;
            curInputDir.x = 0;
            curInputDir.y = 1;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sizeScale = MathClamp(inputDirLength * 0.5, 0.001, 0.05);
        }

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
            0.0035 /* 0.05 */,
            this.LaserStrength,
            true,
        );
        gl.disable(gl.BLEND);
    }

    Render(gl: WebGL2RenderingContext) {
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

        let posEnd = { x: GSceneDesc.Tool.Position.x, y: GSceneDesc.Tool.Position.y, z: 0.0 };
        if (!this.bIntersection) {
            posEnd = MathVector3Add(posStart, MathVector3Multiply(this.LaserDir, 10));
        }

        let posEndFinal = MathLerpVec3(posStart, posEnd, this.AnimationComponent.FadeInParameter);
        if (this.AnimationComponent.FadeOutParameter < 1.0) {
            posEndFinal = MathLerpVec3(posStart, posEnd, this.AnimationComponent.FadeOutParameter);
        }
        gl.uniform3f(this.UniformParametersLocationList.PositionEnd, posEndFinal.x, posEndFinal.y, posEndFinal.z);

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

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

        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, finalGlareSize, finalGlareSize);

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
}
