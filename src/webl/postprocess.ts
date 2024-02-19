//Bloom

import { CreateTextureRT } from "./resourcesUtils";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import {
    GetShaderSourceCombinerPassPS,
    GetShaderSourceFlamePostProcessPS,
    ShaderSourceBloomDownsampleFirstPassPS,
    ShaderSourceBloomDownsamplePS,
    ShaderSourceBloomPrePassPS,
    ShaderSourceBloomUpsamplePS,
    ShaderSourceBlurPassHorizontalPS,
    ShaderSourceBlurPassVerticalPS,
    ShaderSourceFullscreenPassVS,
    ShaderSourcePresentPassPS,
} from "./shaders/shaderPostProcess";
import { GTexturePool } from "./texturePool";
import { Vector2 } from "./types";
import { GTime, MathClamp, MathLerp } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        FirePlanePositionOffset: gl.getUniformLocation(shaderProgram, "FirePlanePositionOffset"),
        SpotlightPos: gl.getUniformLocation(shaderProgram, "SpotlightPos"),
        SpotlightScale: gl.getUniformLocation(shaderProgram, "SpotlightScale"),
        MipLevel: gl.getUniformLocation(shaderProgram, "MipLevel"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        TextureSize: gl.getUniformLocation(shaderProgram, "TextureSize"),
        SourceTexture: gl.getUniformLocation(shaderProgram, "SourceTexture"),
        DestTexelSize: gl.getUniformLocation(shaderProgram, "DestTexelSize"),
        FlameTexture: gl.getUniformLocation(shaderProgram, "FlameTexture"),
        SmokeTexture: gl.getUniformLocation(shaderProgram, "SmokeTexture"),
        SmokeNoiseTexture: gl.getUniformLocation(shaderProgram, "SmokeNoiseTexture"),
        FirePlaneTexture: gl.getUniformLocation(shaderProgram, "FirePlaneTexture"),
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        PointLightsTexture: gl.getUniformLocation(shaderProgram, "PointLightsTexture"),
        LensTexture: gl.getUniformLocation(shaderProgram, "LensTexture"),
        BloomTexture: gl.getUniformLocation(shaderProgram, "BloomTexture"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
        FlameNoiseTexture: gl.getUniformLocation(shaderProgram, "FlameNoiseTexture"),
        FlameNoiseTexture2: gl.getUniformLocation(shaderProgram, "FlameNoiseTexture2"),
    };
    return params;
}

export class RPresentPass {
    public shaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceFullscreenPassVS, ShaderSourcePresentPassPS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(
        gl: WebGL2RenderingContext,
        canvas: HTMLCanvasElement,
        sourceTexture: WebGLTexture,
        sourceMipIndex: number,
        destFramebuffer: WebGLFramebuffer | null,
        destSize: Vector2,
    ) {
        if (destFramebuffer) {
            gl.viewport(0, 0, destSize.x, destSize.y);
            gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);
        } else {
            //Final present
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.clearColor(0.05, 0.05, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgram);

        //Constants
        gl.uniform1f(this.UniformParametersLocationList.MipLevel, sourceMipIndex);

        //Textures
        //TODO: The source texture might be already bound to texture unit
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(this.UniformParametersLocationList.SourceTexture, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

export class RBlurPass {
    public ShaderProgramBlurHorizontal;

    public ShaderProgramBlurVertical;

    public UniformParametersLocationListBlurHorizontal;

    public UniformParametersLocationListBlurVertical;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgramBlurHorizontal = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBlurPassHorizontalPS,
        );
        this.ShaderProgramBlurVertical = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBlurPassVerticalPS,
        );

        //Shader Parameters
        this.UniformParametersLocationListBlurHorizontal = GetUniformParametersList(
            gl,
            this.ShaderProgramBlurHorizontal,
        );
        this.UniformParametersLocationListBlurVertical = GetUniformParametersList(gl, this.ShaderProgramBlurVertical);
    }

    ApplyBlur(
        gl: WebGL2RenderingContext,
        sourceTexture: WebGLTexture,
        sourceMIPIndex: number,
        destFramebuffer: WebGLFramebuffer,
        intermediateTexture: WebGLTexture,
        intermediateFramebuffer: WebGLFramebuffer,
        textureSize: Vector2,
    ) {
        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.viewport(0, 0, textureSize.x, textureSize.y);

        //Blur Horizontal
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, intermediateFramebuffer);

            gl.useProgram(this.ShaderProgramBlurHorizontal);

            //Constants
            gl.uniform1f(this.UniformParametersLocationListBlurHorizontal.MipLevel, sourceMIPIndex);
            gl.uniform2f(this.UniformParametersLocationListBlurHorizontal.TextureSize, textureSize.x, textureSize.y);

            //Textures
            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.uniform1i(this.UniformParametersLocationListBlurHorizontal.SourceTexture, 1);

            //Draw
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        //Blur Vertical
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);

            gl.useProgram(this.ShaderProgramBlurVertical);

            //Constants
            gl.uniform1f(this.UniformParametersLocationListBlurVertical.MipLevel, 0);
            gl.uniform2f(this.UniformParametersLocationListBlurVertical.TextureSize, textureSize.x, textureSize.y);

            //Textures
            gl.activeTexture(gl.TEXTURE0 + 2);
            gl.bindTexture(gl.TEXTURE_2D, intermediateTexture);
            gl.uniform1i(this.UniformParametersLocationListBlurVertical.SourceTexture, 2);

            //Draw
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
    }
}

export class RBloomPass {
    public ShaderProgramBloomPrePass;

    public UniformParametersLocationListBloomPrePass;

    public ShaderProgramBloomDownsampleFirstPass;

    public UniformParametersLocationListBloomDownsampleFirstPass;

    public ShaderProgramBloomDownsample;

    public UniformParametersLocationListBloomDownsample;

    public ShaderProgramBloomUpsample;

    public UniformParametersLocationListBloomUpsample;

    //Resources:

    public DownsampleRTMipArr: WebGLTexture[] = [];

    public DownsampleRTMipFrameBufferArr: WebGLFramebuffer[] = [];

    DownsampleRTMipSizes: Vector2[] = [];

    public BloomTexture;

    public BloomTextureIntermediate;

    public BloomTextureFramebuffer;

    public BloomTextureIntermediateFramebuffer;

    public TextureSize: Vector2;

    public IndexOfMipUsedForBloom: number;

    constructor(gl: WebGL2RenderingContext, bloomTextureSize: Vector2, bloomMipIndex: number) {
        //Create Shader Program
        this.ShaderProgramBloomPrePass = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBloomPrePassPS,
        );
        this.UniformParametersLocationListBloomPrePass = GetUniformParametersList(gl, this.ShaderProgramBloomPrePass);

        //Create Shader Program for first pass Downsample
        this.ShaderProgramBloomDownsampleFirstPass = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBloomDownsampleFirstPassPS,
        );
        this.UniformParametersLocationListBloomDownsampleFirstPass = GetUniformParametersList(
            gl,
            this.ShaderProgramBloomDownsampleFirstPass,
        );

        //Create Shader Program for generic Downsample
        this.ShaderProgramBloomDownsample = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBloomDownsamplePS,
        );
        this.UniformParametersLocationListBloomDownsample = GetUniformParametersList(
            gl,
            this.ShaderProgramBloomDownsample,
        );

        //Upsample
        this.ShaderProgramBloomUpsample = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBloomUpsamplePS,
        );
        this.UniformParametersLocationListBloomUpsample = GetUniformParametersList(gl, this.ShaderProgramBloomUpsample);

        this.TextureSize = bloomTextureSize;
        this.IndexOfMipUsedForBloom = bloomMipIndex;
        this.IndexOfMipReturned = Math.min(this.IndexOfMipReturned, bloomMipIndex);
        this.NonConstBlendWeight = MathLerp(0.1, 0.3, Math.random());

        //Shader Parameters

        const textureInternalFormat = gl.R11F_G11F_B10F;
        const textureFormat = gl.RGB;
        const textureType = gl.HALF_FLOAT;
        /* const textureInternalFormat = gl.RGBA8;
        const textureFormat = gl.RGBA;
        const textureType = gl.UNSIGNED_BYTE; */

        gl.activeTexture(gl.TEXTURE0 + 1);
        this.BloomTexture = CreateTextureRT(gl, bloomTextureSize, textureInternalFormat, textureFormat, textureType);
        this.BloomTextureFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.BloomTexture, 0);

        this.DownsampleRTMipFrameBufferArr = [];
        this.DownsampleRTMipArr = [];
        this.DownsampleRTMipSizes = [];

        const MipSize = { x: GScreenDesc.RenderTargetSize.x, y: GScreenDesc.RenderTargetSize.y };
        //this.DownsampleRTMipSizes[0] = { x: GScreenDesc.RenderTargetSize.x, y: GScreenDesc.RenderTargetSize.y };

        for (let i = 0; i <= bloomMipIndex; i++) {
            //console.log(`Allocating Downsample Mip: ` + i + ` SizeX: ` + MipSize.x + ` SizeY: ` + MipSize.y);
            this.DownsampleRTMipArr[i] = CreateTextureRT(
                gl,
                MipSize,
                textureInternalFormat,
                textureFormat,
                textureType,
                false,
            )!;
            this.DownsampleRTMipFrameBufferArr[i] = gl.createFramebuffer()!;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.DownsampleRTMipFrameBufferArr[i]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.DownsampleRTMipArr[i], 0);

            this.DownsampleRTMipSizes[i] = { x: MipSize.x, y: MipSize.y };

            MipSize.x = Math.floor(MipSize.x / 2.0);
            MipSize.y = Math.floor(MipSize.y / 2.0);
        }

        gl.activeTexture(gl.TEXTURE0 + 1);
        this.BloomTextureIntermediate = CreateTextureRT(
            gl,
            bloomTextureSize,
            textureInternalFormat,
            textureFormat,
            textureType,
        );
        this.BloomTextureIntermediateFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureIntermediateFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.BloomTextureIntermediate, 0);
    }

    HQBloomPrePass(gl: WebGL2RenderingContext, flameTexture: WebGLTexture, firePlaneTexture: WebGLTexture) {
        //1. render to MIP 1
        const destSize = {
            x: this.DownsampleRTMipSizes[1].x,
            y: this.DownsampleRTMipSizes[1].y,
        };

        gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.DownsampleRTMipFrameBufferArr[1]);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.ShaderProgramBloomDownsampleFirstPass);

        //Constants
        gl.uniform2f(
            this.UniformParametersLocationListBloomDownsampleFirstPass.DestTexelSize,
            1.0 / destSize.x,
            1.0 / destSize.y,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, flameTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomDownsampleFirstPass.FlameTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, firePlaneTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomDownsampleFirstPass.FirePlaneTexture, 2);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    HQBloomDownsample(gl: WebGL2RenderingContext) {
        //Downsample from Mip1 to Desired Mip

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);
        gl.useProgram(this.ShaderProgramBloomDownsample);

        let destSize = { x: 0, y: 0 };
        for (let passIndex = 1; passIndex < this.IndexOfMipUsedForBloom; passIndex++) {
            destSize = {
                x: this.DownsampleRTMipSizes[passIndex + 1].x,
                y: this.DownsampleRTMipSizes[passIndex + 1].y,
            };

            gl.viewport(0, 0, destSize.x, destSize.y);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.DownsampleRTMipFrameBufferArr[passIndex + 1]);

            //Constants
            gl.uniform2f(
                this.UniformParametersLocationListBloomDownsample.DestTexelSize,
                1.0 / destSize.x,
                1.0 / destSize.y,
            );

            //Textures
            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, this.DownsampleRTMipArr[passIndex]);
            gl.uniform1i(this.UniformParametersLocationListBloomDownsample.SourceTexture, 1);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
    }

    IndexOfMipReturned = 1;

    NonConstBlendWeight = 0.2;

    HQBloomBlurAndUpsample(
        gl: WebGL2RenderingContext,
        flameTexture: WebGLTexture,
        firePlaneTexture: WebGLTexture,
        numBlurPasses: number,
        BlurPass: RBlurPass,
    ) {
        //Blur last MIP
        for (let i = 0; i < numBlurPasses; i++) {
            BlurPass.ApplyBlur(
                gl,
                this.DownsampleRTMipArr[this.IndexOfMipUsedForBloom]!,
                0,
                this.DownsampleRTMipFrameBufferArr[this.IndexOfMipUsedForBloom],
                this.BloomTextureIntermediate!,
                this.BloomTextureIntermediateFramebuffer!,
                this.TextureSize,
            );
        }

        const bConstBlendWeight = true;
        const blendWeight = 0.0375;

        let blendWeightCur = this.NonConstBlendWeight;

        //Upsample
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.CONSTANT_ALPHA);
        if (bConstBlendWeight) {
            gl.blendColor(1.0, 1.0, 1.0, blendWeight);
        }
        gl.blendEquation(gl.FUNC_ADD);
        let destSize = { x: 0, y: 0 };
        for (let passIndex = this.IndexOfMipUsedForBloom; passIndex > this.IndexOfMipReturned; passIndex--) {
            destSize = {
                x: this.DownsampleRTMipSizes[passIndex - 1].x,
                y: this.DownsampleRTMipSizes[passIndex - 1].y,
            };

            gl.useProgram(this.ShaderProgramBloomUpsample);

            if (!bConstBlendWeight) {
                gl.blendColor(1.0, 1.0, 1.0, blendWeightCur);
                blendWeightCur *= blendWeightCur;
            }

            gl.viewport(0, 0, destSize.x, destSize.y);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.DownsampleRTMipFrameBufferArr[passIndex - 1]);

            //Constants
            gl.uniform2f(
                this.UniformParametersLocationListBloomUpsample.DestTexelSize,
                1.0 / destSize.x,
                1.0 / destSize.y,
            );

            //Textures
            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, this.DownsampleRTMipArr[passIndex]);
            gl.uniform1i(this.UniformParametersLocationListBloomUpsample.SourceTexture, 1);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        gl.disable(gl.BLEND);
    }

    GetFinalTexture() {
        return this.DownsampleRTMipArr[this.IndexOfMipReturned];
    }

    GetBloomTextureMIP(mipIndex: number) {
        return this.DownsampleRTMipArr[MathClamp(mipIndex, this.IndexOfMipReturned, this.IndexOfMipUsedForBloom)];
    }

    PrePass(
        gl: WebGL2RenderingContext,
        flameTexture: WebGLTexture,
        firePlaneTexture: WebGLTexture,
        spotLightTexture: WebGLTexture,
        sourceMipIndex: number,
    ) {
        gl.viewport(0, 0, this.TextureSize.x, this.TextureSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.ShaderProgramBloomPrePass);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListBloomPrePass.MipLevel, sourceMipIndex);

        //Textures
        //TODO: The source texture might be already bound to texture unit
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, flameTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomPrePass.FlameTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, firePlaneTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomPrePass.FirePlaneTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, spotLightTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomPrePass.SpotlightTexture, 3);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    Blur(gl: WebGL2RenderingContext, BlurPass: RBlurPass) {
        if (
            this.BloomTexture !== null &&
            this.BloomTextureFramebuffer !== null &&
            this.BloomTextureIntermediate !== null &&
            this.BloomTextureIntermediateFramebuffer !== null
        ) {
            BlurPass.ApplyBlur(
                gl,
                this.BloomTexture,
                0,
                this.BloomTextureFramebuffer,
                this.BloomTextureIntermediate,
                this.BloomTextureIntermediateFramebuffer,
                this.TextureSize,
            );
        }
    }
}

export class RCombinerPass {
    public shaderProgram;

    public UniformParametersLocationList;

    NoiseTexture: WebGLTexture;

    SmokeNoiseTexture: WebGLTexture;

    LensTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceFullscreenPassVS, GetShaderSourceCombinerPassPS());

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);

        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");

        this.SmokeNoiseTexture = GTexturePool.CreateTexture(gl, false, "smokeNoiseColor");
        this.LensTexture = GTexturePool.CreateTexture(gl, false, "lensDirt6Edit");
    }

    Execute(
        gl: WebGL2RenderingContext,
        firePlaneTexture: WebGLTexture,
        flameTexture: WebGLTexture,
        bloomTexture: WebGLTexture,
        smokeTexture: WebGLTexture,
        spotlightTexture: WebGLTexture,
        pointLightsTexture: WebGLTexture,
        destFramebuffer: WebGLFramebuffer | null,
        destSize: Vector2,
    ) {
        gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgram);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform3f(
            this.UniformParametersLocationList.FirePlanePositionOffset,
            GSceneDesc.FirePlane.PositionOffset.x,
            GSceneDesc.FirePlane.PositionOffset.y,
            GSceneDesc.FirePlane.PositionOffset.z,
        );

        //Spotlight
        gl.uniform2f(
            this.UniformParametersLocationList.SpotlightScale,
            GSceneDesc.Spotlight.SizeScale.x,
            GSceneDesc.Spotlight.SizeScale.y,
        );
        gl.uniform3f(
            this.UniformParametersLocationList.SpotlightPos,
            GSceneDesc.Spotlight.Position.x,
            GSceneDesc.Spotlight.Position.y,
            GSceneDesc.Spotlight.Position.z,
        );

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, firePlaneTexture);
        gl.uniform1i(this.UniformParametersLocationList.FirePlaneTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, flameTexture);
        gl.uniform1i(this.UniformParametersLocationList.FlameTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, bloomTexture);
        gl.uniform1i(this.UniformParametersLocationList.BloomTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 4);

        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, smokeTexture);
        gl.uniform1i(this.UniformParametersLocationList.SmokeTexture, 5);

        gl.activeTexture(gl.TEXTURE0 + 6);
        gl.bindTexture(gl.TEXTURE_2D, spotlightTexture);
        gl.uniform1i(this.UniformParametersLocationList.SpotlightTexture, 6);

        gl.activeTexture(gl.TEXTURE0 + 7);
        gl.bindTexture(gl.TEXTURE_2D, this.SmokeNoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.SmokeNoiseTexture, 7);

        gl.activeTexture(gl.TEXTURE0 + 8);
        gl.bindTexture(gl.TEXTURE_2D, pointLightsTexture);
        gl.uniform1i(this.UniformParametersLocationList.PointLightsTexture, 8);

        gl.activeTexture(gl.TEXTURE0 + 9);
        gl.bindTexture(gl.TEXTURE_2D, this.LensTexture);
        gl.uniform1i(this.UniformParametersLocationList.LensTexture, 9);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

export class RFlamePostProcessPass {
    public shaderProgram;

    public UniformParametersLocationList;

    NoiseTexture;

    FlameNoiseTexture;

    FlameNoiseTexture2;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        const randValsVec = { x: Math.random(), y: Math.random(), z: Math.random() };
        this.shaderProgram = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            GetShaderSourceFlamePostProcessPS(randValsVec),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);

        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");
        this.FlameNoiseTexture = GTexturePool.CreateTexture(gl, false, "flameNoise1_R8");
        this.FlameNoiseTexture2 = GTexturePool.CreateTexture(gl, false, "flameNoise2_R8");
    }

    Execute(
        gl: WebGL2RenderingContext,
        flameTexture: WebGLTexture,
        destFramebuffer: WebGLFramebuffer,
        destSize: Vector2,
    ) {
        gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgram);

        //Constants
        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);

        gl.uniform4f(
            this.UniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, flameTexture);
        gl.uniform1i(this.UniformParametersLocationList.FlameTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.FlameNoiseTexture);
        gl.uniform1i(this.UniformParametersLocationList.FlameNoiseTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.FlameNoiseTexture2);
        gl.uniform1i(this.UniformParametersLocationList.FlameNoiseTexture2, 4);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}
