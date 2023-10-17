import { CreateTexture, CreateTextureRT, FrameBufferCheck } from "./resourcesUtils";
import { SceneDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import {
    GetShaderSourceFireVisualizerVS,
    ShaderSourceApplyFirePS,
    ShaderSourceApplyFireVS,
    ShaderSourceFireUpdatePS,
    ShaderSourceFireVisualizerPS,
} from "./shaders/shaderFirePlane";
import { ShaderSourceFullscreenPassVS } from "./shaders/shaderPostProcess";
import { Vector2 } from "./types";
import { GTime } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        GPositionOffset: gl.getUniformLocation(shaderProgram, "GPositionOffset"),
        SizeScale: gl.getUniformLocation(shaderProgram, "SizeScale"),
        VelocityDir: gl.getUniformLocation(shaderProgram, "VelocityDir"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        FireTexture: gl.getUniformLocation(shaderProgram, "FireTexture"),
        FuelTexture: gl.getUniformLocation(shaderProgram, "FuelTexture"),
        FlameColorLUT: gl.getUniformLocation(shaderProgram, "FlameColorLUT"),
        ImageTexture: gl.getUniformLocation(shaderProgram, "ImageTexture"),
        AshTexture: gl.getUniformLocation(shaderProgram, "AshTexture"),
        AfterBurnTexture: gl.getUniformLocation(shaderProgram, "AfterBurnTexture"),
        DeltaTime: gl.getUniformLocation(shaderProgram, "DeltaTime"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        NoiseTextureInterpolator: gl.getUniformLocation(shaderProgram, "NoiseTextureInterpolator"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
        NoiseTextureLQ: gl.getUniformLocation(shaderProgram, "NoiseTextureLQ"),
    };
    return params;
}

export class RApplyFireRenderPass {
    public colorTexture;

    public shaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext, imageSrc: string | null) {
        //Create Texture
        this.colorTexture = null;

        //Create Shader Program
        if (imageSrc != null) {
            this.colorTexture = CreateTexture(gl, 0, imageSrc);
        }

        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceApplyFireVS, ShaderSourceApplyFirePS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(gl: WebGL2RenderingContext, positionOffset: Vector2, sizeScale: number, velDirection: Vector2) {
        gl.useProgram(this.shaderProgram);
        //VAO
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);
        //Textures
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 0);
        //Bind Constants
        gl.uniform2f(this.UniformParametersLocationList.GPositionOffset, positionOffset.x, positionOffset.y);
        gl.uniform1f(this.UniformParametersLocationList.SizeScale, sizeScale);
        gl.uniform2f(this.UniformParametersLocationList.VelocityDir, velDirection.x, velDirection.y);

        /* Set up blending */
        //gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //gl.disable(gl.BLEND);
    }
}

export class RFirePlanePass {
    public RenderTargetSize;

    public FrameBuffer;

    public FireTexture;

    public FuelTexture;

    public CurrentFireTextureIndex: number;

    public CurrentFuelTextureIndex: number;

    ApplyFirePass: RApplyFireRenderPass;

    shaderProgramFireUpdate: WebGLProgram;

    UniformParametersLocationListFireUpdate;

    NoiseTexture: WebGLTexture;

    NoiseTextureLQ: WebGLTexture;

    NoiseTextureInterpolator: number;

    VisualizerShaderProgram: WebGLProgram;

    public VisualizerUniformParametersLocationList;

    VisualizerFlameColorLUT: WebGLTexture;

    VisualizerImageTexture: WebGLTexture;

    VisualizerAshTexture: WebGLTexture;

    VisualizerAfterBurnNoiseTexture: WebGLTexture;

    VisualizerFirePlaneNoiseTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, inRenderTargetSize = { x: 512, y: 512 }) {
        this.RenderTargetSize = inRenderTargetSize;

        //FBO
        this.FrameBuffer = [];
        this.FrameBuffer[0] = gl.createFramebuffer();
        this.FrameBuffer[1] = gl.createFramebuffer();

        //Fire Texture
        this.FireTexture = [];
        this.FireTexture[0] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);
        this.FireTexture[1] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);

        //Fire Texture
        this.FuelTexture = [];
        this.FuelTexture[0] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);
        this.FuelTexture[1] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);

        //link our RTs to Framebuffers
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[0]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.FireTexture[0], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.FuelTexture[0], 0);

        const drawBuffers = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
        gl.drawBuffers(drawBuffers);

        //Fill Fuel texture with 1.f
        const clearColor1 = new Float32Array([1.0, 1.0, 1.0, 1.0]);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        FrameBufferCheck(gl, "RFirePlanePass");

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.FireTexture[1], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.FuelTexture[1], 0);

        gl.drawBuffers(drawBuffers);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        FrameBufferCheck(gl, "RFirePlanePass");

        this.CurrentFireTextureIndex = 0;
        this.CurrentFuelTextureIndex = 0;

        //========================================================= Apply Fire
        this.ApplyFirePass = new RApplyFireRenderPass(gl, null);

        //================================================ Fire Update Shader

        //Create Shader Program
        this.shaderProgramFireUpdate = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceFireUpdatePS,
        );

        //Shader Parameters
        this.UniformParametersLocationListFireUpdate = GetUniformParametersList(gl, this.shaderProgramFireUpdate);

        this.NoiseTexture = CreateTexture(gl, 4, "assets/perlinNoise1024.png");
        this.NoiseTextureLQ = CreateTexture(gl, 4, "assets/perlinNoise32.png");

        this.NoiseTextureInterpolator = 0;

        //================================================ Fire Visualize Shader

        //Create Shader Program
        this.VisualizerShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceFireVisualizerVS(SceneDesc.FirePlaneSizeScaleNDC, SceneDesc.ViewRatioXY),
            ShaderSourceFireVisualizerPS,
        );

        //Shader Parameters
        this.VisualizerUniformParametersLocationList = GetUniformParametersList(gl, this.VisualizerShaderProgram);

        this.VisualizerFlameColorLUT = CreateTexture(gl, 4, "assets/flameColorLUT5.png");
        this.VisualizerImageTexture = CreateTexture(gl, 5, "assets/example.jpg");
        this.VisualizerAshTexture = CreateTexture(gl, 6, "assets/ashTexture.jpg");
        this.VisualizerAfterBurnNoiseTexture = CreateTexture(gl, 7, "assets/afterBurnNoise2.png");
        this.VisualizerFirePlaneNoiseTexture = CreateTexture(gl, 7, "assets/fireNoise.png");
    }

    bFirstBoot = true;

    ApplyFire(gl: WebGL2RenderingContext, positionOffset: Vector2, sizeScale: number, velDirection: Vector2) {
        const curSourceIndex = this.CurrentFireTextureIndex;
        //Raster particle to current fire texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[curSourceIndex]);
        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);
        this.ApplyFirePass.Execute(gl, positionOffset, sizeScale, velDirection);
        if (this.bFirstBoot) {
            gl.clearColor(0.0, 0.0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.bFirstBoot = false;
        }
    }

    UpdateFire(gl: WebGL2RenderingContext) {
        const curSourceIndex = this.CurrentFireTextureIndex;

        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[1 - curSourceIndex]);

        // Set draw buffers
        const drawBuffers = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
        gl.drawBuffers(drawBuffers);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgramFireUpdate);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListFireUpdate.DeltaTime, GTime.Delta);

        const NoiseTextureInterpolatorSpeed = 0.25;
        const NoiseTextureInterpolatorMax = 3;
        this.NoiseTextureInterpolator += NoiseTextureInterpolatorSpeed * GTime.Delta;
        this.NoiseTextureInterpolator = this.NoiseTextureInterpolator % NoiseTextureInterpolatorMax;
        gl.uniform1f(
            this.UniformParametersLocationListFireUpdate.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.FireTexture[curSourceIndex]);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.FireTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.FuelTexture[this.CurrentFuelTextureIndex]);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.FuelTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.NoiseTexture, 4);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        this.CurrentFireTextureIndex = 1 - this.CurrentFireTextureIndex;
        this.CurrentFuelTextureIndex = 1 - this.CurrentFuelTextureIndex;
    }

    VisualizeFirePlane(gl: WebGL2RenderingContext /* , destFramebuffer: WebGLFramebuffer | null, destSize: Vector2 */) {
        /* gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer); */

        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.VisualizerShaderProgram);

        //Constants
        gl.uniform1f(
            this.VisualizerUniformParametersLocationList.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        gl.uniform1f(this.VisualizerUniformParametersLocationList.Time, GTime.Cur);

        //Textures
        const curSourceIndex = this.CurrentFireTextureIndex;
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.FireTexture[curSourceIndex]);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FireTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.FuelTexture[this.CurrentFuelTextureIndex]);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FuelTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerFlameColorLUT);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FlameColorLUT, 4);

        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerImageTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.ImageTexture, 5);

        gl.activeTexture(gl.TEXTURE0 + 6);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerAshTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.AshTexture, 6);

        gl.activeTexture(gl.TEXTURE0 + 7);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerAfterBurnNoiseTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.AfterBurnTexture, 7);

        gl.activeTexture(gl.TEXTURE0 + 8);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerFirePlaneNoiseTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.NoiseTexture, 8);

        gl.activeTexture(gl.TEXTURE0 + 9);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTextureLQ);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.NoiseTextureLQ, 9);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    GetCurFireTexture() {
        return this.FireTexture[this.CurrentFireTextureIndex];
    }
}
