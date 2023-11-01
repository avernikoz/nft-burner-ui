import { DrawUISingleton } from "./helpers/gui";
import { CreateTexture, CreateTextureRT, FrameBufferCheck } from "./resourcesUtils";
import { SceneDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import {
    GetShaderSourceFireVisualizerVS,
    ShaderSourceApplyFirePS,
    ShaderSourceApplyFireVS,
    ShaderSourceFireUpdatePS,
    GetShaderSourceFireVisualizerPS,
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
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        PointLightsTexture: gl.getUniformLocation(shaderProgram, "PointLightsTexture"),
        RoughnessTexture: gl.getUniformLocation(shaderProgram, "RoughnessTexture"),
        NormalsTexture: gl.getUniformLocation(shaderProgram, "NormalsTexture"),
        LightPosNDC: gl.getUniformLocation(shaderProgram, "LightPosNDC"),
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

    RoughnessTexture: WebGLTexture;

    NormalsTexture: WebGLTexture;

    SurfaceMaterialColorTexture: WebGLTexture;

    VisualizerAfterBurnNoiseTexture: WebGLTexture;

    VisualizerFirePlaneNoiseTexture: WebGLTexture;

    //Paper
    LightPosNDC = { x: 0.0, y: 5.5, z: -2.5 };

    RoughnessParams = { Scale: 1.0, Add: 0.0, Contrast: 1.0, Min: 0.0 }; //Use variadic contrast [from 1 to 2]

    ShadingParams = { SpecularIntensity: 0.9, SpecularPower: 2.0, DiffuseIntensity: 1.0 };

    MaterialUVOffset = { x: 0.0, y: 0.0 };

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
            GetShaderSourceFireVisualizerPS(SceneDesc.FirePlaneSizeScaleNDC, SceneDesc.ViewRatioXY),
        );

        //Shader Parameters
        this.VisualizerUniformParametersLocationList = GetUniformParametersList(gl, this.VisualizerShaderProgram);

        this.VisualizerFlameColorLUT = CreateTexture(gl, 4, "assets/flameColorLUT5.png");
        //this.VisualizerImageTexture = CreateTexture(gl, 5, "assets/example.jpg");
        this.VisualizerImageTexture = CreateTexture(gl, 5, "assets/apeBlue.png");
        this.VisualizerImageTexture = CreateTexture(gl, 5, "assets/example2.png");
        this.VisualizerAshTexture = CreateTexture(gl, 6, "assets/ashTexture.jpg");
        this.VisualizerAfterBurnNoiseTexture = CreateTexture(gl, 7, "assets/afterBurnNoise2.png");
        //this.VisualizerAfterBurnNoiseTexture = CreateTexture(gl, 7, "assets/cracksNoise.png");
        this.VisualizerFirePlaneNoiseTexture = CreateTexture(gl, 7, "assets/fireNoise.png");

        const matName = `copper`;
        const fileFormat = `.png`;

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

        this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, `assets/background/` + matName + `DFS` + fileFormat);
        this.NormalsTexture = CreateTexture(gl, 7, `assets/background/` + matName + `NRM` + fileFormat);
        this.RoughnessTexture = CreateTexture(gl, 7, `assets/background/` + matName + `RGH` + fileFormat);

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/oxidCopperRGH.png");

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/redMetalRGH.png");

        //this.RoughnessTexture = CreateTexture(gl, 7, "assets/background/foil2RGH.png");

        const roughnessTextureId = Math.floor(Math.random() * 4);
        this.RoughnessTexture = CreateTexture(gl, 7, `assets/background/cdCoverRGH` + roughnessTextureId + `.png`);
        this.RoughnessParams.Contrast = 1.0 + Math.random();

        this.SurfaceMaterialColorTexture = CreateTexture(gl, 7, "assets/background/oxidCopperRGH.png");

        const matOffsetSign = { x: 1, y: 1 };
        if (Math.random() < 0.25) {
            matOffsetSign.x = -1;
        }
        if (Math.random() < 0.25) {
            matOffsetSign.y = -1;
        }
        this.MaterialUVOffset.x = Math.random() * matOffsetSign.x;
        this.MaterialUVOffset.y = Math.random() * matOffsetSign.y;

        this.DrawUI();
    }

    DrawUI() {
        const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
        const folder = GDatGUI.addFolder("Shading");
        folder.open();
        folder.add(this.LightPosNDC, "x", -2, 2).name("LightPosX").step(0.01);
        folder.add(this.LightPosNDC, "y", -3, 10).name("LightPosY").step(0.01);
        folder.add(this.LightPosNDC, "z", -10, 2).name("LightPosZ").step(0.01);

        folder.add(this.RoughnessParams, "Scale", 0, 20).name("RGHScale").step(0.01);
        folder.add(this.RoughnessParams, "Add", 0, 1).name("RGHAdd").step(0.01);
        folder.add(this.RoughnessParams, "Contrast", 0, 20).name("RGHContrast").step(0.01);
        folder.add(this.RoughnessParams, "Min", 0, 1).name("RGHMin").step(0.01);

        folder.add(this.ShadingParams, "DiffuseIntensity", 0.75, 1.25).name("DFSIntensity").step(0.01);
        folder.add(this.ShadingParams, "SpecularIntensity", 0, 2).name("SPCIntensity").step(0.01);
        folder.add(this.ShadingParams, "SpecularPower", 0, 64).name("SPCPower").step(2.0);
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

    VisualizeFirePlane(gl: WebGL2RenderingContext, pointLightsTexture: WebGLTexture, spotlightTexture: WebGLTexture) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.VisualizerShaderProgram);

        //Constants
        gl.uniform1f(
            this.VisualizerUniformParametersLocationList.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        gl.uniform1f(this.VisualizerUniformParametersLocationList.Time, GTime.Cur);

        gl.uniform3f(
            this.VisualizerUniformParametersLocationList.LightPosNDC,
            this.LightPosNDC.x,
            this.LightPosNDC.y,
            this.LightPosNDC.z,
        );
        gl.uniform4f(
            this.VisualizerUniformParametersLocationList.RoughnessScaleAddContrastMin,
            this.RoughnessParams.Scale,
            this.RoughnessParams.Add,
            this.RoughnessParams.Contrast,
            this.RoughnessParams.Min,
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
}
