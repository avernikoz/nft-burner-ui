import { GUserInputDesc } from "./input";
import { CreateTextureRT } from "./resourcesUtils";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import {
    GetLightsUpdateShaderVS,
    LightsUpdatePS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GetShaderSourceBackgroundFloorRenderPerspectiveVS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GetShaderSourceBackgroundFloorRenderPerspectivePS,
    GetShaderSourceSpotlightRenderVS,
    GetShaderSourceSpotlightRenderPS,
    GetShaderSourceLightFlareRenderPS,
    GetShaderSourceLightFlareRenderVS,
    GetShaderSourceLightSourceSpriteRenderVS,
    GetShaderSourceLightSourceSpriteRenderPS,
    GetShaderSourceGenericSpriteRenderVS,
    GetShaderSourceGenericSpriteRenderPS,
    GetShaderSourceGlowRenderPS,
} from "./shaders/shaderBackgroundScene";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { GetShaderSourceUISpriteRenderVS } from "./shaders/shaderUI";
import { GTexturePool } from "./texturePool";
import { GTime, MathLerp, MathMapToRange } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        SpotlightPos: gl.getUniformLocation(shaderProgram, "SpotlightPos"),

        SpotlightDirection: gl.getUniformLocation(shaderProgram, "SpotlightDirection"),
        SpotlightDesc: gl.getUniformLocation(shaderProgram, "SpotlightDesc"),
        SpotlightScale: gl.getUniformLocation(shaderProgram, "SpotlightScale"),
        ProjectedLightSizeScale: gl.getUniformLocation(shaderProgram, "ProjectedLightSizeScale"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        NormalTexture: gl.getUniformLocation(shaderProgram, "NormalTexture"),
        RoughnessTexture: gl.getUniformLocation(shaderProgram, "RoughnessTexture"),
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        SmokeNoiseTexture: gl.getUniformLocation(shaderProgram, "SmokeNoiseTexture"),

        FloorScale: gl.getUniformLocation(shaderProgram, "FloorScale"),
        FloorOffset: gl.getUniformLocation(shaderProgram, "FloorOffset"),
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

        Position: gl.getUniformLocation(shaderProgram, "Position"),
        Orientation: gl.getUniformLocation(shaderProgram, "Orientation"),
        Scale: gl.getUniformLocation(shaderProgram, "Scale"),

        ToolPosition: gl.getUniformLocation(shaderProgram, "ToolPosition"),
        ToolRadius: gl.getUniformLocation(shaderProgram, "ToolRadius"),
        ToolColor: gl.getUniformLocation(shaderProgram, "ToolColor"),
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

        this.NoiseTexture = GTexturePool.CreateTexture(gl, false, "perlinNoise128");
    }

    Update(gl: WebGL2RenderingContext, firePlaneTexture: WebGLTexture) {
        gl.viewport(0.0, 0.0, this.kNumLights2D, this.kNumLights2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.LightsBufferFramebuffer);

        gl.useProgram(this.ShaderProgramUpdate);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListUpdate.Time, GTime.CurClamped);

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

export class RSpotlightRenderPass {
    public ShaderProgram;

    public ShaderProgramFlare;

    public ShaderProgramSourceSprite;

    public UniformParametersLocationList;

    public UniformParametersLocationListFlare;

    public UniformParametersLocationListSourceSprite;

    public SpotlightTexture;

    public LightFlareTexture;

    public LightSourceTexture;

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceSpotlightRenderVS(),
            GetShaderSourceSpotlightRenderPS(),
        );
        this.ShaderProgramFlare = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightFlareRenderVS(),
            GetShaderSourceLightFlareRenderPS(),
        );
        this.ShaderProgramSourceSprite = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceLightSourceSpriteRenderVS(),
            GetShaderSourceLightSourceSpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);
        this.UniformParametersLocationListFlare = GetUniformParametersList(gl, this.ShaderProgramFlare);
        this.UniformParametersLocationListSourceSprite = GetUniformParametersList(gl, this.ShaderProgramSourceSprite);

        const spotlightTextureId = Math.floor(Math.random() * 8);
        this.SpotlightTexture = GTexturePool.CreateTexture(gl, false, `spotlightCut` + spotlightTextureId + `_R8`);
        //this.SpotlightTexture = CreateTexture(gl, 5, "assets/example.jpg");

        this.LightFlareTexture = GTexturePool.CreateTexture(gl, false, `lightGlare2`);
        this.LightSourceTexture = GTexturePool.CreateTexture(gl, false, `spotlightMask0`);
    }

    RenderVolumetricLight(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

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
        const spDir = GSceneDesc.Spotlight.GetDirection();
        gl.uniform3f(this.UniformParametersLocationList.SpotlightDirection, spDir.x, spDir.y, spDir.z);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.SpotlightTexture);
        gl.uniform1i(this.UniformParametersLocationList.SpotlightTexture, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    RenderFlare(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFlare);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListFlare.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListFlare.ScreenRatio, GScreenDesc.ScreenRatio);
        const flareSize = { x: 0.5, y: 0.5 };
        gl.uniform2f(this.UniformParametersLocationListFlare.SpotlightScale, flareSize.x, flareSize.y);
        gl.uniform3f(
            this.UniformParametersLocationListFlare.SpotlightPos,
            GSceneDesc.Spotlight.Position.x,
            GSceneDesc.Spotlight.Position.y,
            GSceneDesc.Spotlight.Position.z,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LightFlareTexture);
        gl.uniform1i(this.UniformParametersLocationListFlare.SpotlightTexture, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    RenderSourceSprite(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramSourceSprite);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListSourceSprite.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListSourceSprite.ScreenRatio, GScreenDesc.ScreenRatio);
        const flareSize = { x: 0.5, y: 0.5 };
        gl.uniform2f(this.UniformParametersLocationListSourceSprite.SpotlightScale, flareSize.x, flareSize.y);
        gl.uniform3f(
            this.UniformParametersLocationListSourceSprite.SpotlightPos,
            GSceneDesc.Spotlight.Position.x,
            GSceneDesc.Spotlight.Position.y,
            GSceneDesc.Spotlight.Position.z,
        );
        const spDir = GSceneDesc.Spotlight.GetDirection();
        gl.uniform3f(this.UniformParametersLocationListSourceSprite.SpotlightDirection, spDir.x, spDir.y, spDir.z);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.LightSourceTexture);
        gl.uniform1i(this.UniformParametersLocationListSourceSprite.SpotlightTexture, 1);

        // Enable face culling
        //gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.CULL_FACE);
    }
}

export class RBurntStampVisualizer {
    ShaderProgram;

    UniformParametersLocationList;

    ColorTexture;

    Position = { x: 0.0, y: 0.0, z: 0.0 };

    Orientation = { pitch: 0.0, yaw: 0.0, roll: 0.0 };

    Scale = 1.0;

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(),
            GetShaderSourceGenericSpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ColorTexture = GTexturePool.CreateTexture(gl, false, "burntStamp");

        const offsetMax = 0.05;
        this.Position.x = MathMapToRange(Math.random(), 0.0, 1.0, -offsetMax, offsetMax);
        this.Position.y = MathMapToRange(Math.random(), 0.0, 1.0, -offsetMax, offsetMax);

        const rollOffsetMax = Math.PI / 4;
        this.FinalOrientation = MathMapToRange(Math.random(), 0.0, 1.0, -rollOffsetMax, rollOffsetMax);
    }

    Render(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

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
        gl.uniform1f(this.UniformParametersLocationList.Scale, this.Scale);
        gl.uniform3f(this.UniformParametersLocationList.Position, this.Position.x, this.Position.y, this.Position.z);
        gl.uniform3f(
            this.UniformParametersLocationList.Orientation,
            this.Orientation.pitch,
            this.Orientation.yaw,
            this.Orientation.roll,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    AnimationT = 0.0;

    AnimationSpeed = 5.0;

    PositionStart = -5;

    FinalOrientation = 0.0;

    AnimationFinishedEventProcessed = false;

    RunAnimation() {
        if (this.AnimationT <= 1.0) {
            this.Position.z = MathLerp(this.PositionStart, 0.0, this.AnimationT);
            this.Orientation.roll = MathLerp(
                this.FinalOrientation - Math.PI / 2,
                this.FinalOrientation,
                this.AnimationT,
            );

            this.AnimationT += GTime.Delta * this.AnimationSpeed;
        }
    }
}

export class RBackgroundRenderPass {
    ShaderProgramFloor: WebGLProgram;

    public UniformParametersLocationListFloor;

    SpotlightTexture: WebGLTexture;

    ColorTexture: WebGLTexture;

    NormalTexture: WebGLTexture;

    RoughnessTexture: WebGLTexture;

    PuddleTexture: WebGLTexture | null = null;

    OilTexture: WebGLTexture | null = null;

    PointLights: SceneLights;

    FloorTransform = {
        FloorTexScale: 1.0,
        FloorBrightness: 1.0,
    };

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgramFloor = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceBackgroundFloorRenderPerspectiveVS(),
            GetShaderSourceBackgroundFloorRenderPerspectivePS(),
        );

        //Shader Parameters
        this.UniformParametersLocationListFloor = GetUniformParametersList(gl, this.ShaderProgramFloor);

        this.SpotlightTexture = GTexturePool.CreateTexture(gl, false, "spotlightMask0", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleBlack1024.png", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/hexTilesDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/redConcreteDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleWhiteDFS.jpg", true, true);
        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/marbleGreenDFS.jpg", true, true);

        const matName = `goldTiles`;
        //const fileFormat = `.jpg`;
        this.ColorTexture = GTexturePool.CreateTexture(gl, false, matName + `DFS`, true, true);
        this.NormalTexture = GTexturePool.CreateTexture(gl, false, matName + `NRM`, true, true);
        this.RoughnessTexture = GTexturePool.CreateTexture(gl, false, matName + `RGH_R8`, true, true);
        //this.RoughnessTexture = CreateTexture(gl, 5, "assets/background/goldRGH.png", true, true);

        //this.ColorTexture = CreateTexture(gl, 5, "assets/background/foil2RGH.png", true, true);
        /* this.PuddleTexture = GTexturePool.CreateTexture(
            gl,
            false,
            "assets/background/floorAsphaltHeight.jpg",
            true,
            true,
        ); */
        //this.PuddleTexture = CreateTexture(gl, 5, "assets/background/floorAsphaltRGH.jpg", true, true);
        //this.OilTexture = GTexturePool.CreateTexture(gl, false, "assets/background/oil/oil4.jpeg", true, true);

        // this.ColorTexture = CreateTexture(gl, 5, "assets/background/copperRGH.png", true, true);
        // this.ColorTexture = CreateTexture(gl, 5, "assets/background/goldRGH.png", true, true);

        this.PointLights = new SceneLights(gl);
    }

    SubmitDebugUI(datGui: dat.GUI) {
        {
            const folder = datGui.addFolder("Plane Transform");
            //folder.open();
            folder.add(this.FloorTransform, "FloorTexScale", 0.01, 10);
            //folder.add(this.FloorTransform.LightTexScale, "y", 0.01, 10).name("LightTexScaleY").step(0.01);
            folder.add(this.FloorTransform, "FloorBrightness", 0.01, 5);
        }
    }

    RenderFloor(gl: WebGL2RenderingContext, bloomTexture: WebGLTexture, smokeNoiseTexture: WebGLTexture) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramFloor);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListFloor.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListFloor.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorOffset, GSceneDesc.Floor.Position.y);
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorScale, GSceneDesc.Floor.SizeScale);
        gl.uniform1f(this.UniformParametersLocationListFloor.FloorTexScale, this.FloorTransform.FloorTexScale);

        gl.uniform1f(this.UniformParametersLocationListFloor.FloorBrightness, this.FloorTransform.FloorBrightness);
        gl.uniform1f(this.UniformParametersLocationListFloor.Time, GTime.CurClamped);

        gl.uniform3f(
            this.UniformParametersLocationListFloor.SpotlightPos,
            GSceneDesc.Spotlight.Position.x,
            GSceneDesc.Spotlight.Position.y,
            GSceneDesc.Spotlight.Position.z,
        );
        const spDir = GSceneDesc.Spotlight.GetDirection();
        gl.uniform3f(this.UniformParametersLocationListFloor.SpotlightDirection, spDir.x, spDir.y, spDir.z);
        gl.uniform3f(
            this.UniformParametersLocationListFloor.SpotlightDesc,
            GSceneDesc.Spotlight.Radius,
            Math.cos(Math.min(GSceneDesc.Spotlight.ConeAngles.x, GSceneDesc.Spotlight.ConeAngles.y - 0.01)),
            Math.cos(GSceneDesc.Spotlight.ConeAngles.y),
        );
        gl.uniform2f(
            this.UniformParametersLocationListFloor.ProjectedLightSizeScale,
            GSceneDesc.Spotlight.ProjectedLightSizeScale.x,
            GSceneDesc.Spotlight.ProjectedLightSizeScale.y,
        );

        //Tool
        gl.uniform3f(
            this.UniformParametersLocationListFloor.ToolPosition,
            GSceneDesc.Tool.Position.x,
            GSceneDesc.Tool.Position.y,
            GSceneDesc.Tool.Position.z,
        );
        gl.uniform1f(this.UniformParametersLocationListFloor.ToolRadius, GSceneDesc.Tool.Radius);
        gl.uniform3f(
            this.UniformParametersLocationListFloor.ToolColor,
            GSceneDesc.Tool.Color.r,
            GSceneDesc.Tool.Color.g,
            GSceneDesc.Tool.Color.b,
        );

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

        if (this.PuddleTexture) {
            gl.activeTexture(gl.TEXTURE0 + 6);
            gl.bindTexture(gl.TEXTURE_2D, this.PuddleTexture);
            gl.uniform1i(this.UniformParametersLocationListFloor.PuddleTexture, 6);

            gl.activeTexture(gl.TEXTURE0 + 7);
            gl.bindTexture(gl.TEXTURE_2D, this.OilTexture);
            gl.uniform1i(this.UniformParametersLocationListFloor.OilTexture, 7);
        }

        gl.activeTexture(gl.TEXTURE0 + 8);
        gl.bindTexture(gl.TEXTURE_2D, this.NormalTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.NormalTexture, 8);

        gl.activeTexture(gl.TEXTURE0 + 9);
        gl.bindTexture(gl.TEXTURE_2D, this.RoughnessTexture);
        gl.uniform1i(this.UniformParametersLocationListFloor.RoughnessTexture, 9);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

export class RRenderGlow {
    public ShaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceUISpriteRenderVS(),
            GetShaderSourceGlowRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = this.GetUniformParametersList(gl, this.ShaderProgram);
    }

    Render(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationList.Size, 0.1);
        gl.uniform2f(
            this.UniformParametersLocationList.Position,
            GUserInputDesc.InputPosCurViewSpace.x,
            GUserInputDesc.InputPosCurViewSpace.y,
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
        const params = {
            ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
            Size: gl.getUniformLocation(shaderProgram, "Size"),
            Position: gl.getUniformLocation(shaderProgram, "Position"),
            ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        };
        return params;
    }
}
