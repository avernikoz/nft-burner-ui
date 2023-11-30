import { RFirePlanePass } from "./firePlane";
import { GMeshGenerator } from "./helpers/meshGenerator";
import { GUserInputDesc } from "./input";
import { EParticleShadingMode, ParticlesEmitter } from "./particles";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";
import { GetShaderSourceAnimatedSpriteRenderPS, GetShaderSourceSingleFlameRenderVS } from "./shaders/shaderTools";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";
import { GTime, MathClamp, MathGetVectorLength, MathLerp, MathLerpColor } from "./utils";

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
        LUTTexture: gl.getUniformLocation(shaderProgram, "LUTTexture"),
    };
    return params;
}

class CAnimationComponent {
    Age = 0.0;

    AgeNormalized = 0.0;

    FadeInParameter = 0.0;

    FadeInSpeed = 1.0;

    FadeOutParameter = 1.0;

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
        if (this.FadeInParameter <= 1.0) {
            this.FadeInParameter += GTime.Delta * this.FadeInSpeed;
        }
    }

    FadeOutUpdate() {
        if (this.FadeOutParameter >= 0) {
            this.FadeOutParameter -= GTime.Delta * this.FadeOutSpeed;
        }
    }

    Reset() {
        this.AgeGlobal = 0.0;
        this.Age = 0.0;
        this.AgeNormalized = 0.0;
        this.FadeInParameter = 0.0;
        this.FadeOutParameter = 1.0;
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

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceSingleFlameRenderVS(),
            GetShaderSourceAnimatedSpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ColorTexture = GTexturePool.CreateTexture(gl, false, "assets/sprites/Flame02_16x4.png", true);
        this.LUTTexture = GTexturePool.CreateTexture(gl, false, "assets/flameColorLUT5.png", true);

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
            inInitialVelocityScale: 40.0,
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
            inTextureFileName: "assets/sprites/CandleSmoke01_20x4.png",
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
    }

    RandCur = 0.0;

    ColorLerpParam = 0.0;

    //Executes regardless of state
    UpdateMain(gl: WebGL2RenderingContext, BurningSurface: RFirePlanePass) {
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
            GRenderingStateMachine.GetInstance().currentState !== ERenderingState.BurningFinished &&
            GRenderingStateMachine.GetInstance().bCanBurn &&
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
            if (this.AnimationComponent.FadeInParameter > 1) {
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
            this.AnimationComponent.Speed = MathLerp(1.0, 1.5, (Math.sin(GTime.Cur) + 1.0) * 0.5);
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
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: RFirePlanePass) {
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
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y + 0.1 },
            { x: 0.0, y: 1.0 },
            0.05,
            2.0 * GTime.Delta,
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
        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.Cur);

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
