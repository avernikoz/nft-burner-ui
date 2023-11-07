import { DrawUISingleton } from "./helpers/gui";
import { CreateTexture, CreateTextureRT } from "./resourcesUtils";
import { SceneDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import {
    GetLightsUpdateShaderVS,
    GetShaderSourceBackgroundFloorRenderVS,
    GetShaderSourceBackgroundSpotlightRenderVS,
    LightsUpdatePS,
    GetShaderSourceBackgroundFloorRenderPS,
    ShaderSourceBackgroundSpotlightRenderPS,
} from "./shaders/shaderBackground";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { GTime } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        SmokeNoiseTexture: gl.getUniformLocation(shaderProgram, "SmokeNoiseTexture"),

        FloorRotation: gl.getUniformLocation(shaderProgram, "FloorRotation"),
        FloorScale: gl.getUniformLocation(shaderProgram, "FloorScale"),
        FloorOffset: gl.getUniformLocation(shaderProgram, "FloorOffset"),
        SpotlightTexScale: gl.getUniformLocation(shaderProgram, "SpotlightTexScale"),
        FloorTexScale: gl.getUniformLocation(shaderProgram, "FloorTexScale"),
        FloorBrightness: gl.getUniformLocation(shaderProgram, "FloorBrightness"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
        BloomTexture: gl.getUniformLocation(shaderProgram, "BloomTexture"),
        //Lights
        FireTextureDownsampled: gl.getUniformLocation(shaderProgram, "FireTextureDownsampled"),
        PointLightsTexture: gl.getUniformLocation(shaderProgram, "PointLightsTexture"),
        PuddleTexture: gl.getUniformLocation(shaderProgram, "PuddleTexture"),
        OilTexture: gl.getUniformLocation(shaderProgram, "OilTexture"),
    };
    return params;
}

export class SceneLights {
    public LightsBufferTextureGPU: WebGLTexture;

    public LightsBufferFramebuffer: WebGLTexture;

    public ShaderProgramUpdate;

    public UniformParametersLocationListUpdate;

    NoiseTexture: WebGLTexture;

    kNumLights2D = 4;

    constructor(gl: WebGL2RenderingContext) {
        //create buffers containing all lights intensities
        this.LightsBufferTextureGPU = CreateTextureRT(
            gl,
            { x: this.kNumLights2D, y: this.kNumLights2D },
            gl.R16F,
            gl.RED,
            gl.HALF_FLOAT,
        )!;

        //Framebuffer
        this.LightsBufferFramebuffer = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.LightsBufferFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.LightsBufferTextureGPU, 0);

        //Create Shader Program
        this.ShaderProgramUpdate = CreateShaderProgramVSPS(gl, GetLightsUpdateShaderVS(), LightsUpdatePS);

        this.UniformParametersLocationListUpdate = GetUniformParametersList(gl, this.ShaderProgramUpdate);

        this.NoiseTexture = CreateTexture(gl, 4, "assets/perlinNoise128.png");
    }

    Update(gl: WebGL2RenderingContext, firePlaneTexture: WebGLTexture) {
        gl.bindTexture(gl.TEXTURE_2D, firePlaneTexture);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.viewport(0.0, 0.0, this.kNumLights2D, this.kNumLights2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.LightsBufferFramebuffer);

        gl.useProgram(this.ShaderProgramUpdate);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListUpdate.Time, GTime.Cur);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, firePlaneTexture);
        gl.uniform1i(this.UniformParametersLocationListUpdate.FireTextureDownsampled, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationListUpdate.NoiseTexture, 2);

        gl.drawArrays(gl.POINTS, 0, this.kNumLights2D * this.kNumLights2D);
    }
}

export class RBackgroundRenderPass {
    ShaderProgramSpotlight: WebGLProgram;

    ShaderProgramFloor: WebGLProgram;

    public UniformParametersLocationListSpotlight;

    public UniformParametersLocationListFloor;

    SpotlightTexture: WebGLTexture;

    ColorTexture: WebGLTexture;

    PuddleTexture: WebGLTexture;

    OilTexture: WebGLTexture;

    PointLights: SceneLights;

    FloorTransform = {
        Rotation: 1.446,
        Translation: 0.0,
        Scale: { x: 1.0, y: 1.0 },
        FloorTexScale: 1.0,
        LightTexScale: { x: 1.0, y: 2.4 },
        FloorBrightness: 1.0,
    };

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgramSpotlight = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceBackgroundSpotlightRenderVS(SceneDesc.FirePlaneSizeScaleNDC, SceneDesc.ViewRatioXY),
            ShaderSourceBackgroundSpotlightRenderPS,
        );

        this.ShaderProgramFloor = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceBackgroundFloorRenderVS(SceneDesc.FirePlaneSizeScaleNDC, SceneDesc.ViewRatioXY),
            GetShaderSourceBackgroundFloorRenderPS(SceneDesc.FirePlaneSizeScaleNDC, SceneDesc.ViewRatioXY),
        );

        //Shader Parameters
        this.UniformParametersLocationListSpotlight = GetUniformParametersList(gl, this.ShaderProgramSpotlight);
        this.UniformParametersLocationListFloor = GetUniformParametersList(gl, this.ShaderProgramFloor);

        this.SpotlightTexture = CreateTexture(gl, 4, "assets/background/floorLight.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleBlack1024.png", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/hexTilesDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleTiles.png", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/redConcreteDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleWhiteDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleGreenDFS.jpg", true, true);

        this.ColorTexture = CreateTexture(gl, 5, "assets/background/foil2RGH.png", true, true);
        this.PuddleTexture = CreateTexture(gl, 5, "assets/background/floorAsphaltHeight.jpg", true, true);
        //this.PuddleTexture = CreateTexture(gl, 5, "assets/background/floorAsphaltRGH.jpg", true, true);
        this.OilTexture = CreateTexture(gl, 5, "assets/background/oil/oil4.jpeg", true, true);

        /* this.ColorTexture = CreateTexture(gl, 5, "assets/background/copperRGH.png", true, true);
        this.ColorTexture = CreateTexture(gl, 5, "assets/background/goldRGH.png", true, true); */

        this.PointLights = new SceneLights(gl);

        this.DrawUI();
    }

    DrawUI() {
        const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
        const folder = GDatGUI.addFolder("Plane Transform");
        //folder.open();
        folder.add(this.FloorTransform, "Rotation", 0, 3.14).step(0.001);
        folder.add(this.FloorTransform, "Translation", -1, 1).step(0.001);
        folder.add(this.FloorTransform.Scale, "x", 0.01, 5).name("FloorScaleX").step(0.01);
        folder.add(this.FloorTransform.Scale, "y", 0.01, 1).name("FloorScaleY").step(0.01);
        folder.add(this.FloorTransform, "FloorTexScale", 0.01, 10);
        folder.add(this.FloorTransform.LightTexScale, "x", 0.01, 10).name("LightTexScaleX").step(0.01);
        folder.add(this.FloorTransform.LightTexScale, "y", 0.01, 10).name("LightTexScaleY").step(0.01);
        folder.add(this.FloorTransform, "FloorBrightness", 0.01, 5);
    }

    RenderSpotlight(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramSpotlight);

        //Constants

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.SpotlightTexture);
        gl.uniform1i(this.UniformParametersLocationListSpotlight.SpotlightTexture, 3);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    RenderFloor(gl: WebGL2RenderingContext, bloomTexture: WebGLTexture, smokeNoiseTexture: WebGLTexture) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFloor);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorOffset, this.FloorTransform.Translation);
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorRotation, this.FloorTransform.Rotation);
        gl.uniform2f(
            this.UniformParametersLocationListFloor.FloorScale,
            this.FloorTransform.Scale.x,
            this.FloorTransform.Scale.x,
        );
        gl.uniform2f(
            this.UniformParametersLocationListFloor.SpotlightTexScale,
            this.FloorTransform.LightTexScale.x,
            this.FloorTransform.LightTexScale.y,
        );
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorTexScale, this.FloorTransform.FloorTexScale);
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorBrightness, this.FloorTransform.FloorBrightness);
        gl.uniform1f(this.UniformParametersLocationListFloor.Time, GTime.Cur);

        //Textures

        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.SpotlightTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.SpotlightTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.ColorTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.PointLights.LightsBufferTextureGPU);
        gl.uniform1i(this.UniformParametersLocationListFloor.PointLightsTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, bloomTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.BloomTexture, 4);

        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, smokeNoiseTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.SmokeNoiseTexture, 5);

        gl.activeTexture(gl.TEXTURE0 + 6);
        gl.bindTexture(gl.TEXTURE_2D, this.PuddleTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.PuddleTexture, 6);

        gl.activeTexture(gl.TEXTURE0 + 7);
        gl.bindTexture(gl.TEXTURE_2D, this.OilTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.OilTexture, 7);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
