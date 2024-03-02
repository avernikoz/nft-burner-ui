/* eslint-disable @typescript-eslint/lines-between-class-members */
import {
    GetParticleRenderColorPS,
    GetParticleRenderInstancedVS,
    GetParticleUpdateShaderVS,
    ParticleUpdatePS,
} from "./shaders/shaderParticles";

import { CreateShader, CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { getWebGLProgram } from "./helpers/getWebGLProgram";
import { GTime, showError } from "./utils";
import { GSceneDesc, GScreenDesc } from "./scene";
import { GTexturePool } from "./texturePool";
import { RTexture } from "./texture";
import { GetVec2, GetVec3 } from "./types";

// ====================================================== SHADERS END ======================================================

const GParticleUpdatePassDesc = {
    VertexAttributesList: {
        Position: 0,
        Velocity: 1,
        Age: 2,
        DefaultPosition: 3,
        PrevPosition: 4,
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
    EmbersImpact: 7,
};

export class ParticleEmitterDesc {
    NumSpawners2D = 128;
    NumParticlesPerSpawner = 8;
    SpawnRange = { x: 1, y: 1000 };
    ParticleLife = 10;
    NumLoops = 1;
    TextureFileName = "";
    FlipbookSizeRC = { x: 16.0, y: 4.0 };
    DefaultSize = { x: 1.0, y: 1.0 };
    SizeRangeMinMax = { x: 1.0, y: 1.0 };
    SizeClampMax = { x: 0.0, y: 0.0 };
    RandomSizeChangeSpeed = 1.0;
    InitialVelocityScale = 0.0;
    VelocityFieldForceScale = 0.0;
    BuoyancyForceScale = 0.0;
    DownwardForceScale = 2.5;
    Brightness = 1.0;
    AlphaScale = 0.25; //Currently smoke shading mode specific
    InitialTranslate = { x: 0.0, y: 0.0 };
    bMotionBasedTransform = false;
    EInitialPositionMode = 0; //0:default, 1:random, 2:from Emitter Pos constant
    RandomSpawnThres = 1.0; //higher value - less chances to spawn
    EAlphaFade = 0; //0:disabled, 1:smooth, 2:fast
    EFadeInOutMode = 1; //0-disabled //1-fadeIn only //2-fadeOut only 3-enable all
    ESpecificShadingMode = EParticleShadingMode.Default;
    InitSpawnPosOffset = { x: 0.0, y: 0.0 };
    bOneShotParticle = false;
    bFreeFallParticle = false;
    bUseGravity = false;
    b3DSpace = false;
    bAlwaysRespawn = false;

    Color = GetVec3(1, 1, 1);
    InitialVelocityAddScale = GetVec2(1, 1);
    MotionStretchScale = 1.0;
}

export class ParticlesEmitter {
    Desc: ParticleEmitterDesc;

    TimeBetweenParticleSpawn: number;
    NumActiveParticles: number;

    DynamicBrightness = 1.0;

    InitialPositionsBufferGPU;
    PositionsBufferGPU;
    PrevPositionsBufferGPU;
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

    constructor(gl: WebGL2RenderingContext, inDesc: ParticleEmitterDesc) {
        this.Desc = inDesc;

        const numDimensions = this.Desc.b3DSpace ? 3 : 2;

        this.bUsesTexture = this.Desc.TextureFileName != "";

        this.ColorTexture = new RTexture();

        this.TimeBetweenParticleSpawn = this.Desc.ParticleLife / this.Desc.NumParticlesPerSpawner;

        this.NumActiveParticles = this.Desc.NumSpawners2D * this.Desc.NumSpawners2D * this.Desc.NumParticlesPerSpawner;

        //Allocate Initial Positions Buffer
        const initialPositionsBufferCPU = new Float32Array(this.NumActiveParticles * 2);
        //Generate Initial Positions
        const distanceBetweenParticlesNDC = {
            x: (2 - this.Desc.InitSpawnPosOffset.x * 2) / (this.Desc.NumSpawners2D - 1.0),
            y: (2 - this.Desc.InitSpawnPosOffset.y * 2) / (this.Desc.NumSpawners2D - 1.0),
        };
        const domainStart = { x: -1.0 + this.Desc.InitSpawnPosOffset.x, y: -1.0 + this.Desc.InitSpawnPosOffset.y };
        let count = 0;
        for (let y = 0; y < this.Desc.NumSpawners2D; y++) {
            for (let x = 0; x < this.Desc.NumSpawners2D; x++) {
                const posX = domainStart.x + x * distanceBetweenParticlesNDC.x;
                const posY = domainStart.y + y * distanceBetweenParticlesNDC.y;
                for (let i = 0; i < this.Desc.NumParticlesPerSpawner; i++) {
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
            const positionsBufferCPU = new Float32Array(this.NumActiveParticles * numDimensions);
            this.PositionsBufferGPU = [];
            this.PositionsBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
            this.PositionsBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

            //PrevPosition
            this.PrevPositionsBufferGPU = [];
            this.PrevPositionsBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PrevPositionsBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
            this.PrevPositionsBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PrevPositionsBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

            //Velocity
            const velocitiesBufferCPU = new Float32Array(this.NumActiveParticles * numDimensions);
            this.VelocitiesBufferGPU = [];
            this.VelocitiesBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);
            this.VelocitiesBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);

            //Age
            const ageBufferCPU = new Float32Array(this.NumActiveParticles);
            this.AgeBufferGPU = [];
            this.AgeBufferGPU[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[0]);
            gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);
            this.AgeBufferGPU[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[1]);
            gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);

            this.Reset(gl);
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
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //PrevPosition
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PrevPositionsBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.PrevPosition);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.PrevPosition,
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //Velocity
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[i]);
            gl.enableVertexAttribArray(GParticleUpdatePassDesc.VertexAttributesList.Velocity);
            gl.vertexAttribPointer(
                GParticleUpdatePassDesc.VertexAttributesList.Velocity,
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
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

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, this.PrevPositionsBufferGPU[i]);
        }
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        //Compile Shaders
        {
            const shaderVS = CreateShader(gl, gl.VERTEX_SHADER, GetParticleUpdateShaderVS(this.Desc));
            const shaderPS = CreateShader(gl, gl.FRAGMENT_SHADER, ParticleUpdatePS);

            this.ParticleUpdateShaderProgram = getWebGLProgram(gl);
            gl.attachShader(this.ParticleUpdateShaderProgram, shaderVS);
            gl.attachShader(this.ParticleUpdateShaderProgram, shaderPS);

            // Specify the varyings to capture for transform feedback
            gl.transformFeedbackVaryings(
                this.ParticleUpdateShaderProgram,
                ["outPosition", "outVelocity", "outAge", "outPrevPosition"],
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
        //this.NoiseTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg");
        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise32");
        this.NoiseTextureHQ = GTexturePool.CreateTexture(gl, false, "perlinNoise512");

        this.UniformParametersLocationList = this.GetUniformParametersList(gl, this.ParticleUpdateShaderProgram);

        this.CurrentBufferIndex = 0;

        //========================================================= Allocate Rendering Data

        if (this.bUsesTexture) {
            this.ColorTexture.InnerTexture = GTexturePool.CreateTexture(
                gl,
                false,
                this.Desc.TextureFileName,
                true,
                false,
                false,
                this.ColorTexture,
            );
        }

        if (this.Desc.ESpecificShadingMode === EParticleShadingMode.Flame) {
            this.FlameColorLUTTexture = GTexturePool.CreateTexture(gl, false, "flameColorLUT5", true);
        } else {
            this.FlameColorLUTTexture = null;
        }

        this.ParticleInstancedRenderShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetParticleRenderInstancedVS(this.Desc),
            GetParticleRenderColorPS(this.Desc, this.bUsesTexture),
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
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
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
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
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
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
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
                numDimensions,
                gl.FLOAT,
                false,
                numDimensions * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
            gl.vertexAttribDivisor(GParticleRenderPassDesc.VertexAttributesList.Velocity, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    Reset(gl: WebGL2RenderingContext) {
        const numDimensions = this.Desc.b3DSpace ? 3 : 2;
        //Position
        const positionsBufferCPU = new Float32Array(this.NumActiveParticles * numDimensions);
        for (let i = 0; i < this.NumActiveParticles * numDimensions; i++) {
            positionsBufferCPU[i] = -10000;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionsBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

        //Position Prev
        for (let i = 0; i < this.NumActiveParticles * numDimensions; i++) {
            positionsBufferCPU[i] = -10000;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PrevPositionsBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PrevPositionsBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, positionsBufferCPU, gl.STREAM_DRAW);

        //Velocity
        const velocitiesBufferCPU = new Float32Array(this.NumActiveParticles * numDimensions);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VelocitiesBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, velocitiesBufferCPU, gl.STREAM_DRAW);

        //Age
        const ageBufferCPU = new Float32Array(this.NumActiveParticles);
        const numSpawners = this.Desc.NumSpawners2D * this.Desc.NumSpawners2D;
        for (let i = 0; i < numSpawners; i++) {
            ageBufferCPU[i * this.Desc.NumParticlesPerSpawner] = this.Desc.bOneShotParticle
                ? -0.5
                : this.Desc.ParticleLife + 1.0;
            for (let k = 1; k < this.Desc.NumParticlesPerSpawner; k++) {
                ageBufferCPU[i * this.Desc.NumParticlesPerSpawner + k] = k * this.TimeBetweenParticleSpawn; //so that all particles are considered dead
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[0]);
        gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.AgeBufferGPU[1]);
        gl.bufferData(gl.ARRAY_BUFFER, ageBufferCPU, gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.CurrentBufferIndex = 0;
    }

    SetDynamicBrightness(value: number) {
        this.DynamicBrightness = value;
    }

    Update(gl: WebGL2RenderingContext, fireTexture: WebGLTexture, initialEmitterPosition = GetVec3(0.0, 0.0, 0.0)) {
        if (this.bUsesTexture && !this.ColorTexture.bLoaded) {
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        gl.enable(gl.RASTERIZER_DISCARD);

        gl.useProgram(this.ParticleUpdateShaderProgram);
        gl.bindVertexArray(this.ParticleUpdateVAO[this.CurrentBufferIndex]);

        gl.uniform1f(this.UniformParametersLocationList.DeltaTime, Math.min(1.0 / 60.0, GTime.Delta));
        gl.uniform1f(this.UniformParametersLocationList.ParticleLife, this.Desc.ParticleLife);
        gl.uniform1f(this.UniformParametersLocationList.CurTime, GTime.CurClamped);
        if (this.Desc.b3DSpace) {
            gl.uniform3f(
                this.UniformParametersLocationList.EmitterPosition,
                initialEmitterPosition.x,
                initialEmitterPosition.y,
                initialEmitterPosition.z,
            );
        } else {
            gl.uniform2f(
                this.UniformParametersLocationList.EmitterPosition,
                initialEmitterPosition.x,
                initialEmitterPosition.y,
            );
        }

        gl.uniform1f(this.UniformParametersLocationList.FloorPosY, GSceneDesc.Floor.Position.y);

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
        if (this.bUsesTexture && !this.ColorTexture.bLoaded) {
            return;
        }

        //gl.bindVertexArray(this.ParticleRenderVAO[1 - this.CurrentBufferIndex]);
        gl.bindVertexArray(this.ParticleInstancedRenderVAO[1 - this.CurrentBufferIndex]);

        //gl.useProgram(this.ParticleRenderShaderProgram);
        gl.useProgram(this.ParticleInstancedRenderShaderProgram);

        //Uniforms
        if (this.bUsesTexture) {
            gl.activeTexture(gl.TEXTURE0 + 4);
            gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture.InnerTexture);
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

        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.ParticleLife, this.Desc.ParticleLife);
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.NumLoops, this.Desc.NumLoops);
        gl.uniform2f(
            this.ParticleRenderUniformParametersLocationList.FlipbookSizeRC,
            this.Desc.FlipbookSizeRC.x,
            this.Desc.FlipbookSizeRC.y,
        );
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.CurTime, GTime.CurClamped);
        gl.uniform1f(this.ParticleRenderUniformParametersLocationList.DynamicBrightness, this.DynamicBrightness);

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
            FloorPosY: gl.getUniformLocation(shaderProgram, "FloorPosY"),
            DynamicBrightness: gl.getUniformLocation(shaderProgram, "DynamicBrightness"),
        };
        return params;
    }
}
