import {
    GetParticleRenderColorPS,
    GetParticleRenderInstancedVS,
    GetParticleUpdateShaderVS,
    ParticleUpdatePS,
} from "./shaders/shaderParticles";

import { CreateShader, CreateShaderProgramVSPS } from "./shaderUtils";
import { CreateTexture } from "./resourcesUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { getWebGLProgram } from "./helpers/getWebGLProgram";
import { GTime, showError } from "./utils";
import { Vector2 } from "./types";
import { GSceneDesc, GScreenDesc } from "./scene";

// ====================================================== SHADERS END ======================================================

const GParticleUpdatePassDesc = {
    VertexAttributesList: {
        Position: 0,
        Velocity: 1,
        Age: 2,
        DefaultPosition: 3,
    },
};

const GParticleRenderPassDesc = {
    VertexAttributesList: {
        VertexBuffer: 0,
        TexCoordsBuffer: 1,
        Position: 2,
        Age: 3,
        Velocity: 4,
    },
};

export const EParticleShadingMode = {
    Default: 0,
    Flame: 1,
    Embers: 2,
    Smoke: 3,
    Ashes: 4,
    Dust: 5,
    AfterBurnSmoke: 6,
};

export class ParticlesEmitter {
    NumSpawners2D;

    NumParticlesPerSpawner;

    ParticleLife;

    NumLoops;

    FlipbookSizeRC: Vector2;

    TimeBetweenParticleSpawn: number;

    NumActiveParticles: number;

    InitialPositionsBufferGPU;

    PositionsBufferGPU;

    //public SizeBufferGPU;

    VelocitiesBufferGPU;

    AgeBufferGPU;

    ParticleUpdateVAO;

    TransformFeedback;

    ParticleUpdateShaderProgram: WebGLProgram;

    NoiseTexture;

    NoiseTextureHQ;

    UniformParametersLocationList;

    CurrentBufferIndex: number;

    ParticleRenderVAO;

    ParticleInstancedRenderVAO;

    ParticleRenderUniformParametersLocationList;

    ParticleInstancedRenderShaderProgram;

    ColorTexture;

    FlameColorLUTTexture;

    bUsesTexture;

    bOneShotParticle;

    constructor(
        gl: WebGL2RenderingContext,
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            inName = "Particles",
            inNumSpawners2D = 128,
            inNumParticlesPerSpawner = 8,
            inSpawnRange = { x: 1, y: 1000 },
            inParticleLife = 10,
            inNumLoops = 1,
            inTextureFileName = "",
            inFlipbookSizeRC = { x: 16.0, y: 4.0 },
            inDefaultSize = { x: 1.0, y: 1.0 },
            inSizeRangeMinMax = { x: 1.0, y: 1.0 },
            inSizeClampMax = { x: 1.0, y: 1.0 },
            inRandomSizeChangeSpeed = 1.0,
            inInitialVelocityScale = 0.0,
            inVelocityFieldForceScale = 0.0,
            inBuoyancyForceScale = 0.0,
            inDownwardForceScale = 2.5,
            inBrightness = 1.0,
            inAlphaScale = 0.25, //Currently smoke shading mode specific
            inInitialTranslate = { x: 0.0, y: 0.0 },
            inbMotionBasedTransform = false,
            inEInitialPositionMode = 0, //0:default, 1:random, 2:from Emitter Pos constant
            inRandomSpawnThres = 1.0, //higher value - less chances to spawn
            inEAlphaFade = 0, //0:disabled, 1:smooth, 2:fast
            inEFadeInOutMode = 1, //0-disabled //1-fadeIn only //2-fadeOut only 3-enable all
            inESpecificShadingMode = EParticleShadingMode.Default,
            inInitSpawnPosOffset = { x: 0.0, y: 0.0 },
            inbOneShotParticle = false,
        },
    ) {
        this.bOneShotParticle = inbOneShotParticle;
        this.NumSpawners2D = inNumSpawners2D;
        this.NumParticlesPerSpawner = inNumParticlesPerSpawner;
        this.ParticleLife = inParticleLife;
        this.NumLoops = inNumLoops;
        this.FlipbookSizeRC = inFlipbookSizeRC;

        this.bUsesTexture = inTextureFileName != "";

        this.TimeBetweenParticleSpawn = this.ParticleLife / this.NumParticlesPerSpawner;

        this.NumActiveParticles = this.NumSpawners2D * this.NumSpawners2D * this.NumParticlesPerSpawner;

        //Allocate Initial Positions Buffer
        const initialPositionsBufferCPU = new Float32Array(this.NumActiveParticles * 2);
        //Generate Initial Positions
        const distanceBetweenParticlesNDC = {
            x: (2 - inInitSpawnPosOffset.x * 2) / (this.NumSpawners2D - 1.0),
            y: (2 - inInitSpawnPosOffset.y * 2) / (this.NumSpawners2D - 1.0),
        };
        const domainStart = { x: -1.0 + inInitSpawnPosOffset.x, y: -1.0 + inInitSpawnPosOffset.y };
        let count = 0;
        for (let y = 0; y < this.NumSpawners2D; y++) {
            for (let x = 0; x < this.NumSpawners2D; x++) {
                const posX = domainStart.x + x * distanceBetweenParticlesNDC.x;
                const posY = domainStart.y + y * distanceBetweenParticlesNDC.y;
                for (let i = 0; i < this.NumParticlesPerSpawner; i++) {
                    initialPositionsBufferCPU[count] = posX;
                    initialPositionsBufferCPU[count + 1] = posY;
                    count += 2;
                }
            }
        }
        this.InitialPositionsBufferGPU = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.InitialPositionsBufferGPU);
        gl.bufferData(gl.ARRAY_BUFFER, initialPositionsBufferCPU, gl.STATIC_DRAW);

        //========================================================= Allocate Particle Data
        //Position, Velocity, Age, Size
        {
            //Position
            const positionsBufferCPU = new Float32Array(this.NumActiveParticles * 2);
            for (let i = 0; i < this.NumActiveParticles * 2; i++) {
                positionsBufferCPU[i] = -10000;
            }
            this.PositionsBufferGPU = [];
            this.PositionsBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
            this.PositionsBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

            //Velocity
            const velocitiesBufferCPU = new Float32Array(this.NumActiveParticles * 2);
            this.VelocitiesBufferGPU = [];
            this.VelocitiesBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);
            this.VelocitiesBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);

            //Age
            const ageBufferCPU = new Float32Array(this.NumActiveParticles);
            const numSpawners = this.NumSpawners2D * this.NumSpawners2D;
            for (let i = 0; i < numSpawners; i++) {
                ageBufferCPU[i * this.NumParticlesPerSpawner] = this.bOneShotParticle ? 0.0 : this.ParticleLife + 1.0;
                for (let k = 1; k < this.NumParticlesPerSpawner; k++) {
                    ageBufferCPU[i * this.NumParticlesPerSpawner + k] = k * this.TimeBetweenParticleSpawn;
                }
            }
            this.AgeBufferGPU = [];
            this.AgeBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);
            this.AgeBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);
        }

        //VAO
        this.ParticleUpdateVAO = [];

        for (let i = 0; i < 2; i++) {
            this.ParticleUpdateVAO[i] = gl.createVertexArray();
            gl.bindVertexArray(this.ParticleUpdateVAO[i]);

            //Position
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.Position);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.Position,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Velocity
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.Velocity);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.Velocity,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Age
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.Age);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.Age,
                1,
                gl.FLOAT,
                false,
                1 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Default Position
            gl.bindBuffer(gl.ARRAY_BUFFER, this.InitialPositionsBufferGPU);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.DefaultPosition);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.DefaultPosition,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.TransformFeedback = [];
        for (let i = 0; i < 2; i++) {
            this.TransformFeedback[i] = gl.createTransformFeedback();
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.TransformFeedback[i]);

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.PositionsBufferGPU[i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.VelocitiesBufferGPU[i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, this.AgeBufferGPU[i]);
        }
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        //Compile Shaders
        {
            const shaderVS = CreateShader(
                gl,
                gl.VERTEX_SHADER,
                GetParticleUpdateShaderVS(
                    inSpawnRange,
                    inInitialVelocityScale,
                    inVelocityFieldForceScale,
                    inBuoyancyForceScale,
                    inDownwardForceScale,
                    inEInitialPositionMode,
                    inRandomSpawnThres,
                    inbOneShotParticle,
                ),
            );
            const shaderPS = CreateShader(gl, gl.FRAGMENT_SHADER, ParticleUpdatePS);

            this.ParticleUpdateShaderProgram = getWebGLProgram(gl);
            gl.attachShader(this.ParticleUpdateShaderProgram, shaderVS);
            gl.attachShader(this.ParticleUpdateShaderProgram, shaderPS);

            // Specify the varyings to capture for transform feedback
            gl.transformFeedbackVaryings(
                this.ParticleUpdateShaderProgram,
                ["outPosition", "outVelocity", "outAge"],
                gl.SEPARATE_ATTRIBS,
            );

            gl.linkProgram(this.ParticleUpdateShaderProgram);
            if (!gl.getProgramParameter(this.ParticleUpdateShaderProgram, gl.LINK_STATUS)) {
                const linkError = gl.getProgramInfoLog(this.ParticleUpdateShaderProgram);
                showError(`Failed to LINK shaders - ${linkError}`);
                gl.deleteProgram(this.ParticleUpdateShaderProgram);

                throw new Error("Failed to link shader");
            }

            gl.detachShader(this.ParticleUpdateShaderProgram, shaderVS);
            gl.detachShader(this.ParticleUpdateShaderProgram, shaderPS);
            gl.deleteShader(shaderVS);
            gl.deleteShader(shaderPS);
        }

        //Noise Texture
        //TODO: Use Static Noise Texture, not a texture per Particle System
        //this.NoiseTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg");
        this.NoiseTexture = CreateTexture(gl, 4, "assets/perlinNoise32.png");
        this.NoiseTextureHQ = CreateTexture(gl, 5, "assets/perlinNoise512.png");

        this.UniformParametersLocationList = this.GetUniformParametersList(gl, this.ParticleUpdateShaderProgram);

        this.CurrentBufferIndex = 0;

        //========================================================= Allocate Rendering Data

        if (this.bUsesTexture) {
            this.ColorTexture = CreateTexture(gl, 4, inTextureFileName, true);
        }

        if (inESpecificShadingMode === EParticleShadingMode.Flame) {
            this.FlameColorLUTTexture = CreateTexture(gl, 5, "assets/flameColorLUT5.png", true);
        } else {
            this.FlameColorLUTTexture = null;
        }

        this.ParticleInstancedRenderShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetParticleRenderInstancedVS(
                this.bUsesTexture,
                inDefaultSize,
                inEFadeInOutMode,
                inSizeRangeMinMax,
                inSizeClampMax,
                inInitialTranslate,
                inbMotionBasedTransform,
                inRandomSizeChangeSpeed,
            ),
            GetParticleRenderColorPS(
                inESpecificShadingMode,
                this.bUsesTexture,
                inEAlphaFade,
                inAlphaScale,
                inBrightness,
                0.5,
            ),
        );

        this.ParticleRenderUniformParametersLocationList = this.GetUniformParametersList(
            gl,
            this.ParticleInstancedRenderShaderProgram,
        );

        //VAO
        this.ParticleRenderVAO = [];
        for (let i = 0; i < 2; i++) {
            this.ParticleRenderVAO[i] = gl.createVertexArray();
            gl.bindVertexArray(this.ParticleRenderVAO[i]);

            //Position
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Position);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Position,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Age
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Age);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Age,
                1,
                gl.FLOAT,
                false,
                1 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Velocity
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Velocity);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Velocity,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        this.ParticleInstancedRenderVAO = [];
        for (let i = 0; i < 2; i++) {
            this.ParticleInstancedRenderVAO[i] = gl.createVertexArray();
            gl.bindVertexArray(this.ParticleInstancedRenderVAO[i]);

            //VertexBuffer
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeVertexBufferGPU);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.VertexBuffer);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.VertexBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //TexCoords
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeTexCoordsBufferGPU);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.TexCoordsBuffer);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.TexCoordsBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Position
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Position);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Position,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
            gl.vertexAttribDivisor(GParticleRenderPassDesc.VertexAttributesList.Position, 1);

            //Age
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Age);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Age,
                1,
                gl.FLOAT,
                false,
                1 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
            gl.vertexAttribDivisor(GParticleRenderPassDesc.VertexAttributesList.Age, 1);

            //Velocity
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleRenderPassDesc.VertexAttributesList.Velocity);
            gl.vertexAttribPointer(
                GParticleRenderPassDesc.VertexAttributesList.Velocity,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
            gl.vertexAttribDivisor(GParticleRenderPassDesc.VertexAttributesList.Velocity, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    Reset(gl: WebGL2RenderingContext) {
        //Position
        const positionsBufferCPU = new Float32Array(this.NumActiveParticles * 2);
        for (let i = 0; i < this.NumActiveParticles * 2; i++) {
            positionsBufferCPU[i] = -10000;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

        //Velocity
        const velocitiesBufferCPU = new Float32Array(this.NumActiveParticles * 2);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);

        //Age
        const ageBufferCPU = new Float32Array(this.NumActiveParticles);
        const numSpawners = this.NumSpawners2D * this.NumSpawners2D;
        for (let i = 0; i < numSpawners; i++) {
            ageBufferCPU[i * this.NumParticlesPerSpawner] = this.bOneShotParticle ? -0.25 : this.ParticleLife + 1.0;
            for (let k = 1; k < this.NumParticlesPerSpawner; k++) {
                ageBufferCPU[i * this.NumParticlesPerSpawner + k] = k * this.TimeBetweenParticleSpawn; //so that all particles are considered dead
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.CurrentBufferIndex = 0;
    }

    Update(gl: WebGL2RenderingContext, fireTexture: WebGLTexture, initialEmitterPosition = { x: 0.0, y: 0.0 }) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        gl.enable(gl.RASTERIZER_DISCARD);

        gl.useProgram(this.ParticleUpdateShaderProgram);
        gl.bindVertexArray(this.ParticleUpdateVAO[this.CurrentBufferIndex]);

        gl.uniform1f(this.UniformParametersLocationList.DeltaTime, GTime.Delta);
        gl.uniform1f(this.UniformParametersLocationList.ParticleLife, this.ParticleLife);
        gl.uniform1f(this.UniformParametersLocationList.CurTime, GTime.Cur);
        gl.uniform2f(
            this.UniformParametersLocationList.EmitterPosition,
            initialEmitterPosition.x,
            initialEmitterPosition.y,
        );

        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTextureHQ);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTextureHQ, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, fireTexture);
        gl.uniform1i(this.UniformParametersLocationList.FireTexture, 3);

        const outputIndex = 1 - this.CurrentBufferIndex;

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.TransformFeedback[outputIndex]);

        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.NumActiveParticles);
        gl.endTransformFeedback();

        gl.disable(gl.RASTERIZER_DISCARD);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        this.CurrentBufferIndex = 1 - this.CurrentBufferIndex;
    }

    Render(gl: WebGL2RenderingContext, blendMode: number, blendSource: number, blendDest: number) {
        //gl.bindVertexArray(this.ParticleRenderVAO[1 - this.CurrentBufferIndex]);
        gl.bindVertexArray(this.ParticleInstancedRenderVAO[1 - this.CurrentBufferIndex]);

        //gl.useProgram(this.ParticleRenderShaderProgram);
        gl.useProgram(this.ParticleInstancedRenderShaderProgram);

        //Uniforms
        if (this.bUsesTexture && this.ColorTexture) {
            gl.activeTexture(gl.TEXTURE0 + 4);
            gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
            gl.uniform1i(this.ParticleRenderUniformParametersLocationList.ColorTexture, 4);
        }

        if (this.FlameColorLUTTexture) {
            gl.activeTexture(gl.TEXTURE0 + 5);
            gl.bindTexture(gl.TEXTURE_2D, this.FlameColorLUTTexture);
            gl.uniform1i(this.ParticleRenderUniformParametersLocationList.FlameColorLUT, 5);
        }

        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.ParticleRenderUniformParametersLocationList.NoiseTexture, 1);

        //Constants
        gl.uniform4f(
            this.ParticleRenderUniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform3f(
            this.ParticleRenderUniformParametersLocationList.FirePlanePositionOffset,
            GSceneDesc.FirePlane.PositionOffset.x,
            GSceneDesc.FirePlane.PositionOffset.y,
            GSceneDesc.FirePlane.PositionOffset.z,
        );

        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.ParticleLife, this.ParticleLife);
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.NumLoops, this.NumLoops);
        gl.uniform2f(
            this.ParticleRenderUniformParametersLocationList.FlipbookSizeRC,
            this.FlipbookSizeRC.x,
            this.FlipbookSizeRC.y,
        );
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.CurTime, GTime.Cur);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendFunc(blendSource, blendDest);
        gl.blendEquation(blendMode);

        //gl.drawArrays(gl.POINTS, 0, this.NumActiveParticles);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.NumActiveParticles);

        gl.disable(gl.BLEND);
    }

    private GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
        const params = {
            CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
            ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
            FirePlanePositionOffset: gl.getUniformLocation(shaderProgram, "FirePlanePositionOffset"),
            DeltaTime: gl.getUniformLocation(shaderProgram, "DeltaTime"),
            CurTime: gl.getUniformLocation(shaderProgram, "CurTime"),
            ParticleLife: gl.getUniformLocation(shaderProgram, "ParticleLife"),
            NumLoops: gl.getUniformLocation(shaderProgram, "NumLoops"),
            FlipbookSizeRC: gl.getUniformLocation(shaderProgram, "FlipbookSizeRC"),
            NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
            NoiseTextureHQ: gl.getUniformLocation(shaderProgram, "NoiseTextureHQ"),
            FireTexture: gl.getUniformLocation(shaderProgram, "FireTexture"),
            ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
            FlameColorLUT: gl.getUniformLocation(shaderProgram, "FlameColorLUT"),
            EmitterPosition: gl.getUniformLocation(shaderProgram, "EmitterPosition"),
        };
        return params;
    }
}
