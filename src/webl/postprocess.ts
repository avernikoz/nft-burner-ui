//Bloom

import { CreateTextureRT } from "./resourcesUtils";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { ShaderSourceFullscreenPassVS } from "./shaders/shaderFirePlane";
import {
    ShaderSourceBloomPrePassPS,
    ShaderSourceBlurPassHorizontalPS,
    ShaderSourceBlurPassVerticalPS,
    ShaderSourceCombinerPassPS,
    ShaderSourcePresentPassPS,
} from "./shaders/shaderPostProcess";
import { Vector2 } from "./types";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        MipLevel: gl.getUniformLocation(shaderProgram, "MipLevel"),
        TextureSize: gl.getUniformLocation(shaderProgram, "TextureSize"),
        SourceTexture: gl.getUniformLocation(shaderProgram, "SourceTexture"),
        FlameTexture: gl.getUniformLocation(shaderProgram, "FlameTexture"),
        BloomTexture: gl.getUniformLocation(shaderProgram, "BloomTexture"),
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

    public BloomTexture;

    public BloomTextureIntermediate;

    public BloomTextureFramebuffer;

    public BloomTextureIntermediateFramebuffer;

    public TextureSize: Vector2;

    constructor(gl: WebGL2RenderingContext, bloomTextureSize: Vector2) {
        //Create Shader Program
        this.ShaderProgramBloomPrePass = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceBloomPrePassPS,
        );

        this.TextureSize = bloomTextureSize;

        //Shader Parameters
        this.UniformParametersLocationListBloomPrePass = GetUniformParametersList(gl, this.ShaderProgramBloomPrePass);

        gl.activeTexture(gl.TEXTURE0 + 1);
        this.BloomTexture = CreateTextureRT(gl, bloomTextureSize, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
        this.BloomTextureFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.BloomTexture, 0);

        gl.activeTexture(gl.TEXTURE0 + 1);
        this.BloomTextureIntermediate = CreateTextureRT(gl, bloomTextureSize, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
        this.BloomTextureIntermediateFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureIntermediateFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.BloomTextureIntermediate, 0);
    }

    PrePass(gl: WebGL2RenderingContext, sourceTexture: WebGLTexture, sourceMipIndex: number) {
        gl.viewport(0, 0, this.TextureSize.x, this.TextureSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.BloomTextureFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.ShaderProgramBloomPrePass);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListBloomPrePass.MipLevel, sourceMipIndex);

        //Textures
        //TODO: The source texture might be already bound to texture unit
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(this.UniformParametersLocationListBloomPrePass.SourceTexture, 1);
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

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceFullscreenPassVS, ShaderSourceCombinerPassPS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(
        gl: WebGL2RenderingContext,
        flameTexture: WebGLTexture,
        bloomTexture: WebGLTexture,
        destFramebuffer: WebGLFramebuffer | null,
        destSize: Vector2,
    ) {
        gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgram);

        //Constants

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, flameTexture);
        gl.uniform1i(this.UniformParametersLocationList.FlameTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, bloomTexture);
        gl.uniform1i(this.UniformParametersLocationList.BloomTexture, 2);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}
