import { CreateTextureRT, FrameBufferCheck } from "./resourcesUtils";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import {
    GetShaderSourceFireVisualizerVS,
    ShaderSourceApplyFirePS,
    ShaderSourceApplyFireVS,
    ShaderSourceFireUpdatePS,
    GetShaderSourceFireVisualizerPS,
    GetShaderSourceFirePlanePreProcess,
} from "./shaders/shaderFirePlane";
import { ShaderSourceFullscreenPassVS } from "./shaders/shaderPostProcess";
import { GUserInputDesc } from "./input";
import { Vector2 } from "./types";
import { GTime, MathClamp, MathGetVectorLength, MathVector2Normalize } from "./utils";
import { GTexturePool } from "./texturePool";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        SpotlightPos: gl.getUniformLocation(shaderProgram, "SpotlightPos"),
        ToolPosition: gl.getUniformLocation(shaderProgram, "ToolPosition"),
        ToolRadius: gl.getUniformLocation(shaderProgram, "ToolRadius"),
        ToolColor: gl.getUniformLocation(shaderProgram, "ToolColor"),
        OrientationEuler: gl.getUniformLocation(shaderProgram, "OrientationEuler"),
        SpotlightScale: gl.getUniformLocation(shaderProgram, "SpotlightScale"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        FirePlanePositionOffset: gl.getUniformLocation(shaderProgram, "FirePlanePositionOffset"),
        PointerPositionOffset: gl.getUniformLocation(shaderProgram, "PointerPositionOffset"),
        SizeScale: gl.getUniformLocation(shaderProgram, "SizeScale"),
        AppliedFireStrength: gl.getUniformLocation(shaderProgram, "AppliedFireStrength"),
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
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        PointLightsTexture: gl.getUniformLocation(shaderProgram, "PointLightsTexture"),
        RoughnessTexture: gl.getUniformLocation(shaderProgram, "RoughnessTexture"),
        NormalsTexture: gl.getUniformLocation(shaderProgram, "NormalsTexture"),
        MaterialUVOffset: gl.getUniformLocation(shaderProgram, "MaterialUVOffset"),
        SpecularIntensityAndPower: gl.getUniformLocation(shaderProgram, "SpecularIntensityAndPower"),
        DiffuseIntensity: gl.getUniformLocation(shaderProgram, "DiffuseIntensity"),
        RoughnessScaleAddContrastMin: gl.getUniformLocation(shaderProgram, "RoughnessScaleAddContrastMin"),
        SurfaceMaterialColorTexture: gl.getUniformLocation(shaderProgram, "SurfaceMaterialColorTexture"),
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
            this.colorTexture = GTexturePool.CreateTexture(gl, false, imageSrc);
        }

        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceApplyFireVS, ShaderSourceApplyFirePS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(
        gl: WebGL2RenderingContext,
        positionOffset: Vector2,
        velDirection: Vector2,
        sizeScale: number,
        strength: number,
    ) {
        gl.useProgram(this.shaderProgram);

        //VAO
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        //Bind Constants
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

        gl.uniform2f(this.UniformParametersLocationList.PointerPositionOffset, positionOffset.x, positionOffset.y);
        gl.uniform1f(this.UniformParametersLocationList.SizeScale, sizeScale);
        gl.uniform1f(this.UniformParametersLocationList.AppliedFireStrength, strength);
        gl.uniform2f(this.UniformParametersLocationList.VelocityDir, velDirection.x, velDirection.y);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

export class RFirePlanePass {
    public RenderTargetSize;

    public FrameBuffer;

    public FireTextureHighestMIPFrameBuffer;

    public FireTexture;

    public FuelTexture;

    public CurrentFireTextureIndex: number;

    public CurrentFuelTextureIndex: number;

    ApplyFirePass: RApplyFireRenderPass;

    shaderProgramFireUpdate: WebGLProgram;

    UniformParametersLocationListFireUpdate;

    UniformParametersLocationListPreProcess;

    NoiseTexture: WebGLTexture;

    NoiseTextureLQ: WebGLTexture;

    NoiseTextureInterpolator: number;

    VisualizerShaderProgram: WebGLProgram;

    ImagePreProcessShaderProgram: WebGLProgram;

    public VisualizerUniformParametersLocationList;

    VisualizerFlameColorLUT: WebGLTexture;

    VisualizerImageTexture: WebGLTexture;

    CurrentImageTextureSrc: string;

    VisualizerAshTexture: WebGLTexture;

    RoughnessTexture: WebGLTexture;

    NormalsTexture: WebGLTexture;

    SurfaceMaterialColorTexture: WebGLTexture;

    VisualizerAfterBurnNoiseTexture: WebGLTexture;

    VisualizerFirePlaneNoiseTexture: WebGLTexture;

    ProcessedImageTexture: WebGLTexture;

    ProcessedImageTextureFBO: WebGLFramebuffer;

    ProcessedImageTextureSize: number;

    //Paper

    RoughnessParams = { Scale: 1.0, Add: 0.0, Contrast: 1.0, Min: 0.0 }; //Use variadic contrast [from 1 to 2]

    ShadingParams = { SpecularIntensity: 0.6, SpecularPower: 8.0, DiffuseIntensity: 1.05 };

    MaterialUVOffset = { x: 0.0, y: 0.0 };

    Reset(gl: WebGL2RenderingContext) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[0]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        //Fill Fuel texture with 1.f
        const clearColor0 = new Float32Array([0.0, 0.0, 0.0, 0.0]);
        const clearColor1 = new Float32Array([1.0, 1.0, 1.0, 1.0]);
        gl.clearBufferfv(gl.COLOR, 0, clearColor0);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    }

    SetToBurned(gl: WebGL2RenderingContext) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[0]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        //Fill Fuel texture with 1.f
        const clearColor0 = new Float32Array([0.01, 0.01, 0.01, 0.01]);
        const clearColor1 = new Float32Array([0.01, 0.01, 0.01, 0.01]);
        gl.clearBufferfv(gl.COLOR, 0, clearColor0);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    }

    constructor(gl: WebGL2RenderingContext, inRenderTargetSize = { x: 512, y: 512 }) {
        this.RenderTargetSize = inRenderTargetSize;

        //FBO
        this.FrameBuffer = [];
        this.FrameBuffer[0] = gl.createFramebuffer();
        this.FrameBuffer[1] = gl.createFramebuffer();

        //Fire Texture
        this.FireTexture = [];
        this.FireTexture[0] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT, true);
        this.FireTexture[1] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT, true);

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

        //To read fire value
        const highestMipLevel = Math.log2(inRenderTargetSize.x);
        this.FireTextureHighestMIPFrameBuffer = [];
        this.FireTextureHighestMIPFrameBuffer[0] = gl.createFramebuffer();
        this.FireTextureHighestMIPFrameBuffer[1] = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FireTextureHighestMIPFrameBuffer[0]);
        gl.framebufferTexture2D(
            gl.READ_FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.FireTexture[0],
            highestMipLevel,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FireTextureHighestMIPFrameBuffer[1]);
        gl.framebufferTexture2D(
            gl.READ_FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.FireTexture[1],
            highestMipLevel,
        );
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

        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise1024");
        this.NoiseTextureLQ = GTexturePool.CreateTexture(gl, false, "perlinNoise32");

        this.NoiseTextureInterpolator = 0;

        //================================================ PreProcess Shader

        this.ProcessedImageTextureSize = 1024;

        this.ProcessedImageTexture = CreateTextureRT(
            gl,
            { x: this.ProcessedImageTextureSize, y: this.ProcessedImageTextureSize },
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            true,
        )!;

        this.ProcessedImageTextureFBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ProcessedImageTextureFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.ProcessedImageTexture, 0);

        this.ImagePreProcessShaderProgram = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            GetShaderSourceFirePlanePreProcess(),
        );

        //Shader Parameters
        this.UniformParametersLocationListPreProcess = GetUniformParametersList(gl, this.ImagePreProcessShaderProgram);

        //================================================ Fire Visualize Shader

        //Create Shader Program
        this.VisualizerShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceFireVisualizerVS(),
            GetShaderSourceFireVisualizerPS(),
        );

        //Shader Parameters
        this.VisualizerUniformParametersLocationList = GetUniformParametersList(gl, this.VisualizerShaderProgram);

        this.VisualizerFlameColorLUT = GTexturePool.CreateTexture(gl, false, "flameColorLUT5");
        //this.CurrentImageTextureSrc = "assets/example.jpg";
        this.CurrentImageTextureSrc = "apeBlue";
        //this.CurrentImageTextureSrc = "assets/example2.png";
        this.VisualizerImageTexture = GTexturePool.CreateTexture(gl, false, this.CurrentImageTextureSrc, true, true);
        this.FirePlaneImagePreProcess(gl);
        this.VisualizerAshTexture = GTexturePool.CreateTexture(gl, false, "ashTexture_R8", true);

        this.VisualizerAfterBurnNoiseTexture = GTexturePool.CreateTexture(gl, false, "afterBurnNoise2_R8");
        //this.VisualizerAfterBurnNoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise128");
        //this.VisualizerAfterBurnNoiseTexture = CreateTexture(gl, 7, "assets/cracksNoise.png");

        this.VisualizerFirePlaneNoiseTexture = GTexturePool.CreateTexture(gl, false, "fireNoise_R8");

        const matName = `copper`;

        /* this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/marbleYellow.png");
        this.NormalsTexture = CreateTexture(gl, 7, "assets/grainNoise3.png");
        this.RoughnessTexture = CreateTexture(gl, 7, "assets/grainNoise3.png"); */

        /* this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/greenWoodDFS.jpg");
        this.NormalsTexture = CreateTexture(gl, 7, "assets/background/greenWoodNRM.jpg");
        this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/greenWoodRGH.jpg"); */

        /* this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/blueWoodDFS.jpg");
        this.NormalsTexture = CreateTexture(gl, 7, "assets/background/blueWoodNRM.jpg");
        this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/blueWoodRGH.jpg"); */

        /* this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/blueWoodDFS2.jpg");
        this.NormalsTexture = CreateTexture(gl, 7, "assets/background/blueWoodNRM2.jpg");
        this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/blueWoodRGH2.jpg"); */

        /* this.SurfaceMaterialColorTexture = GTexturePool.CreateTexture(
            gl,
            false,
            `assets/background/` + matName + `DFS` + fileFormat,
            true,
        ); */
        this.NormalsTexture = GTexturePool.CreateTexture(gl, false, matName + `NRM`, true, true);
        //this.RoughnessTexture = CreateTexture(gl, 7, `assets/background/` + matName + `RGH` + fileFormat, true);

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/oxidCopperRGH.png");

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/redMetalRGH.png");

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/foil2RGH.png");

        const roughnessTextureId = Math.floor(Math.random() * 4);
        this.RoughnessTexture = GTexturePool.CreateTexture(
            gl,
            false,
            `cdCoverRGH` + roughnessTextureId + `_R8`,
            true,
            true,
        );
        this.RoughnessParams.Contrast = 1.0 + Math.random();

        this.SurfaceMaterialColorTexture = GTexturePool.CreateTexture(gl, false, "oxidCopperRGH", true);
        //this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/paperRGH.png");

        const matOffsetSign = { x: 1, y: 1 };
        if (Math.random() < 0.25) {
            matOffsetSign.x = -1;
        }
        if (Math.random() < 0.25) {
            matOffsetSign.y = -1;
        }
        this.MaterialUVOffset.x = Math.random() * matOffsetSign.x;
        this.MaterialUVOffset.y = Math.random() * matOffsetSign.y;
    }

    SubmitDebugUI(datGui: dat.GUI) {
        {
            const folder = datGui.addFolder("Fire Surface Shading");
            //folder.open();

            folder.add(this.RoughnessParams, "Scale", 0, 20).name("RGHScale").step(0.01);
            folder.add(this.RoughnessParams, "Add", 0, 1).name("RGHAdd").step(0.01);
            folder.add(this.RoughnessParams, "Contrast", 0, 20).name("RGHContrast").step(0.01);
            folder.add(this.RoughnessParams, "Min", 0, 1).name("RGHMin").step(0.01);

            folder.add(this.ShadingParams, "DiffuseIntensity", 0.75, 3).name("DFSIntensity").step(0.01);
            folder.add(this.ShadingParams, "SpecularIntensity", 0, 2).name("SPCIntensity").step(0.01);
            folder.add(this.ShadingParams, "SpecularPower", 0, 64).name("SPCPower").step(2.0);
        }
    }

    ApplyFire(gl: WebGL2RenderingContext, pos: Vector2, direction: Vector2, size: number, strength: number) {
        this.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        this.ApplyFirePass.Execute(gl, pos, direction, size, strength);
        gl.disable(gl.BLEND);
    }

    ApplyFireFromInput(gl: WebGL2RenderingContext) {
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
            sizeScale = MathClamp(inputDirLength * 0.5, 0.001, 0.05);
        }

        this.ApplyFire(gl, curInputPos, MathVector2Normalize(curInputDir), sizeScale, 0.5);
    }

    ApplyFireAuto(gl: WebGL2RenderingContext, pos: Vector2, size: number) {
        const curInputPos = pos;
        const curInputDir = { x: 1, y: 1 };

        const curSourceIndex = this.CurrentFireTextureIndex;
        //Raster particle to current fire texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[curSourceIndex]);
        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);
        this.ApplyFirePass.Execute(gl, curInputPos, MathVector2Normalize(curInputDir), size, 1.5);
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
        gl.uniform1f(this.UniformParametersLocationListFireUpdate.Time, GTime.Cur);

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

    UpdatePlaneSurfaceImage(gl: WebGL2RenderingContext, inImage: TexImageSource, inImageSrc: string) {
        if (inImageSrc !== this.CurrentImageTextureSrc) {
            this.CurrentImageTextureSrc = inImageSrc;

            gl.activeTexture(gl.TEXTURE0 + 5);
            gl.bindTexture(gl.TEXTURE_2D, this.VisualizerImageTexture);

            //Load Image
            const texRef = this.VisualizerImageTexture;

            gl.bindTexture(gl.TEXTURE_2D, texRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inImage);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            this.FirePlaneImagePreProcess(gl);
        }
    }

    FirePlaneImagePreProcess(gl: WebGL2RenderingContext) {
        gl.viewport(0, 0, this.ProcessedImageTextureSize, this.ProcessedImageTextureSize);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ProcessedImageTextureFBO);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.ImagePreProcessShaderProgram);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerImageTexture);
        gl.uniform1i(this.UniformParametersLocationListPreProcess.ImageTexture, 5);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindTexture(gl.TEXTURE_2D, this.ProcessedImageTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    VisualizeFirePlane(gl: WebGL2RenderingContext, pointLightsTexture: WebGLTexture, spotlightTexture: WebGLTexture) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.VisualizerShaderProgram);

        //Constants
        gl.uniform4f(
            this.VisualizerUniformParametersLocationList.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.VisualizerUniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.FirePlanePositionOffset,
            GSceneDesc.FirePlane.PositionOffset.x,
            GSceneDesc.FirePlane.PositionOffset.y,
            GSceneDesc.FirePlane.PositionOffset.z,
        );
        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.OrientationEuler,
            GSceneDesc.FirePlane.OrientationEuler.pitch,
            GSceneDesc.FirePlane.OrientationEuler.yaw,
            GSceneDesc.FirePlane.OrientationEuler.roll,
        );

        gl.uniform1f(
            this.VisualizerUniformParametersLocationList.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        gl.uniform1f(this.VisualizerUniformParametersLocationList.Time, GTime.Cur);

        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.SpotlightPos,
            GSceneDesc.Spotlight.Position.x,
            GSceneDesc.Spotlight.Position.y,
            GSceneDesc.Spotlight.Position.z,
        );
        gl.uniform4f(
            this.VisualizerUniformParametersLocationList.RoughnessScaleAddContrastMin,
            this.RoughnessParams.Scale,
            this.RoughnessParams.Add,
            this.RoughnessParams.Contrast,
            this.RoughnessParams.Min,
        );

        //Tool
        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.ToolPosition,
            GSceneDesc.Tool.Position.x,
            GSceneDesc.Tool.Position.y,
            GSceneDesc.Tool.Position.z,
        );
        gl.uniform1f(this.VisualizerUniformParametersLocationList.ToolRadius, GSceneDesc.Tool.Radius);
        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.ToolColor,
            GSceneDesc.Tool.Color.r,
            GSceneDesc.Tool.Color.g,
            GSceneDesc.Tool.Color.b,
        );

        gl.uniform2f(
            this.VisualizerUniformParametersLocationList.SpecularIntensityAndPower,
            this.ShadingParams.SpecularIntensity,
            this.ShadingParams.SpecularPower,
        );
        gl.uniform2f(
            this.VisualizerUniformParametersLocationList.MaterialUVOffset,
            this.MaterialUVOffset.x,
            this.MaterialUVOffset.y,
        );

        gl.uniform1f(
            this.VisualizerUniformParametersLocationList.DiffuseIntensity,
            this.ShadingParams.DiffuseIntensity,
        );

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
        //gl.bindTexture(gl.TEXTURE_2D, this.VisualizerImageTexture);
        gl.bindTexture(gl.TEXTURE_2D, this.ProcessedImageTexture);
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

        gl.activeTexture(gl.TEXTURE0 + 10);
        gl.bindTexture(gl.TEXTURE_2D, pointLightsTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.PointLightsTexture, 10);

        gl.activeTexture(gl.TEXTURE0 + 11);
        gl.bindTexture(gl.TEXTURE_2D, this.RoughnessTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.RoughnessTexture, 11);

        gl.activeTexture(gl.TEXTURE0 + 12);
        gl.bindTexture(gl.TEXTURE_2D, this.SurfaceMaterialColorTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.SurfaceMaterialColorTexture, 12);

        gl.activeTexture(gl.TEXTURE0 + 13);
        gl.bindTexture(gl.TEXTURE_2D, this.NormalsTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.NormalsTexture, 13);

        gl.activeTexture(gl.TEXTURE0 + 14);
        gl.bindTexture(gl.TEXTURE_2D, spotlightTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.SpotlightTexture, 14);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    GetCurFireTexture() {
        return this.FireTexture[this.CurrentFireTextureIndex];
    }

    GetCurFireTextureHighestMipFramebuffer() {
        return this.FireTextureHighestMIPFrameBuffer[this.CurrentFireTextureIndex];
    }

    BindFireRT(gl: WebGL2RenderingContext) {
        const curSourceIndex = this.CurrentFireTextureIndex;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[curSourceIndex]);
        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);
    }
}
