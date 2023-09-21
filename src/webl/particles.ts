import {
  GetParticleUpdateShaderVS,
  ParticleRenderColorPS,
  ParticleRenderInstancedVS,
  ParticleUpdatePS,
} from "./shaders/shaderParticles";

import { DrawUISingleton } from "./helpers/gui";
import { CreateShader, CreateShaderProgramVSPS } from "./shaderUtils";
import { CreateTexture } from "./resourcesUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { getWebGLProgram } from "./helpers/getWebGLProgram";
import { GTime, showError } from "./utils";

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
  },
};

export class ParticlesEmitter {
  public NumSpawners2D;

  public NumParticlesPerSpawner;

  public ParticleLife;

  public TimeBetweenParticleSpawn: number;

  public NumActiveParticles: number;

  public InitialPositionsBufferGPU;

  public PositionsBufferGPU;

  public VelocitiesBufferGPU;

  public AgeBufferGPU;

  public ParticleUpdateVAO;

  public TransformFeedback;

  public ParticleUpdateShaderProgram: WebGLProgram;

  public NoiseTexture;

  public NoiseTextureHQ;

  public UniformParametersLocationList;

  public CurrentBufferIndex: number;

  public ParticleRenderVAO;

  public ParticleInstancedRenderVAO;

  public ParticleRenderUniformParametersLocationList;

  public ParticleInstancedRenderShaderProgram;

  public ColorTexture;

  public FlameColorLUTTexture;

  constructor(
    gl: WebGL2RenderingContext,
    { inName = "Particles", inNumSpawners2D = 128, inNumParticlesPerSpawner = 8, inParticleLife = 10 },
  ) {
    this.NumSpawners2D = inNumSpawners2D;
    this.NumParticlesPerSpawner = inNumParticlesPerSpawner;
    this.ParticleLife = inParticleLife;

    this.TimeBetweenParticleSpawn = this.ParticleLife / this.NumParticlesPerSpawner;

    this.NumActiveParticles = this.NumSpawners2D * this.NumSpawners2D * this.NumParticlesPerSpawner;

    //Allocate Initial Positions Buffer
    const initialPositionsBufferCPU = new Float32Array(this.NumActiveParticles * 2);
    //Generate Initial Positions
    const distanceBetweenParticlesNDC = 2 / (this.NumSpawners2D - 1.0);
    const domainStart = -1.0;
    let count = 0;
    for (let y = 0; y < this.NumSpawners2D; y++) {
      for (let x = 0; x < this.NumSpawners2D; x++) {
        const posX = domainStart + x * distanceBetweenParticlesNDC;
        const posY = domainStart + y * distanceBetweenParticlesNDC;
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
    //Position, Velocity, Age
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
        ageBufferCPU[i * this.NumParticlesPerSpawner] = this.ParticleLife + 1.0;
        for (let k = 1; k < this.NumParticlesPerSpawner; k++) {
          ageBufferCPU[i * this.NumParticlesPerSpawner + k] = k * this.TimeBetweenParticleSpawn; //so that all particles are considered dead
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
      const shaderVS = CreateShader(gl, gl.VERTEX_SHADER, GetParticleUpdateShaderVS());
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
    this.NoiseTexture = CreateTexture(gl, 4, "assets/smokeNoiseColor.jpg");
    //this.NoiseTexture = CreateTexture(gl, 4, "assets/perlinNoise32.png");
    this.NoiseTextureHQ = CreateTexture(gl, 5, "assets/perlinNoise512.png");

    this.UniformParametersLocationList = this.GetUniformParametersList(gl, this.ParticleUpdateShaderProgram);

    this.CurrentBufferIndex = 0;

    //========================================================= Allocate Rendering Data

    //this.ColorTexture = CreateTexture(gl, 4, "assets/sprites/Flame02_16x4.png");
    this.ColorTexture = CreateTexture(gl, 4, "assets/sprites/Flame03_16x4.png");
    this.FlameColorLUTTexture = CreateTexture(gl, 5, "assets/flameColorLUT2.jpg", true);

    //this.ParticleRenderShaderProgram = CreateShaderProgramVSPS(gl, ParticleRenderVS, ParticleRenderColorPS);
    this.ParticleInstancedRenderShaderProgram = CreateShaderProgramVSPS(
      gl,
      ParticleRenderInstancedVS,
      ParticleRenderColorPS,
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

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    this.DrawUI(inName);
  }

  Update(gl: WebGL2RenderingContext, fireTexture: WebGLTexture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.useProgram(this.ParticleUpdateShaderProgram);
    gl.bindVertexArray(this.ParticleUpdateVAO[this.CurrentBufferIndex]);

    gl.uniform1f(this.UniformParametersLocationList.DeltaTime, GTime.Delta);
    gl.uniform1f(this.UniformParametersLocationList.ParticleLife, this.ParticleLife);
    gl.uniform1f(this.UniformParametersLocationList.CurTime, GTime.Cur);

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

  Render(gl: WebGL2RenderingContext) {
    //gl.bindVertexArray(this.ParticleRenderVAO[1 - this.CurrentBufferIndex]);
    gl.bindVertexArray(this.ParticleInstancedRenderVAO[1 - this.CurrentBufferIndex]);

    //gl.useProgram(this.ParticleRenderShaderProgram);
    gl.useProgram(this.ParticleInstancedRenderShaderProgram);

    //Uniforms
    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
    gl.uniform1i(this.ParticleRenderUniformParametersLocationList.ColorTexture, 4);

    gl.activeTexture(gl.TEXTURE0 + 5);
    gl.bindTexture(gl.TEXTURE_2D, this.FlameColorLUTTexture);
    gl.uniform1i(this.ParticleRenderUniformParametersLocationList.FlameColorLUT, 5);

    //Constants
    gl.uniform1f(this.ParticleRenderUniformParametersLocationList.ParticleLife, this.ParticleLife);

    /* Set up blending */
    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.blendEquation(gl.MAX);

    //gl.drawArrays(gl.POINTS, 0, this.NumActiveParticles);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.NumActiveParticles);

    gl.disable(gl.BLEND);
  }

  DrawUI(name: string) {
    const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
    const folder = GDatGUI.addFolder(name);
    folder.open();
    folder
      .add({ NumberOfActiveParticles: this.NumActiveParticles }, "NumberOfActiveParticles", 0, 65000)
      .step(1)
      .listen();
  }

  private GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
      DeltaTime: gl.getUniformLocation(shaderProgram, "DeltaTime"),
      CurTime: gl.getUniformLocation(shaderProgram, "CurTime"),
      ParticleLife: gl.getUniformLocation(shaderProgram, "ParticleLife"),
      NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
      NoiseTextureHQ: gl.getUniformLocation(shaderProgram, "NoiseTextureHQ"),
      FireTexture: gl.getUniformLocation(shaderProgram, "FireTexture"),
      ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
      FlameColorLUT: gl.getUniformLocation(shaderProgram, "FlameColorLUT"),
    };
    return params;
  }
}
