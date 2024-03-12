/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GBurningSurface } from "../firePlane";
import { EParticleShadingMode, ParticlesEmitter } from "../particles";
import { GetEmberParticlesDesc, GetSmokeParticlesDesc } from "../particlesConfig";
import { GSceneDesc, GScreenDesc } from "../scene";
import { CreateShaderProgramVSPS } from "../shaderUtils";
import {
    GetShaderSourceGenericSpriteParentSpaceRenderVS,
    GetShaderSourceGenericSpriteRenderVS,
} from "../shaders/shaderBackgroundScene";
import { CommonRenderingResources } from "../shaders/shaderConfig";
import { GetShaderSourceFireballRenderPS } from "../shaders/shaderTools";
import { SpatialControlPoint } from "../spatialController";
import { GTexturePool } from "../texturePool";
import { GetVec2, GetVec3, Matrix4x4, Vector3 } from "../types";
import {
    GTime,
    MathClamp,
    MathGetVec2Length,
    MathGetVec3Length,
    MathIntersectionAABBSphere,
    MathMapToRange,
    MathVector3Normalize,
    SetPositionSmooth,
} from "../utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        Position: gl.getUniformLocation(shaderProgram, "Position"),
        Velocity: gl.getUniformLocation(shaderProgram, "Velocity"),
        FadeInOutParameters: gl.getUniformLocation(shaderProgram, "FadeInOutParameters"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        AnimationFrameIndex: gl.getUniformLocation(shaderProgram, "AnimationFrameIndex"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        LaserTexture: gl.getUniformLocation(shaderProgram, "LaserTexture"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
        LUTTexture: gl.getUniformLocation(shaderProgram, "LUTTexture"),
        PositionStart: gl.getUniformLocation(shaderProgram, "PositionStart"),
        PositionEnd: gl.getUniformLocation(shaderProgram, "PositionEnd"),
        SpotlightScale: gl.getUniformLocation(shaderProgram, "SpotlightScale"),
        SpotlightPos: gl.getUniformLocation(shaderProgram, "SpotlightPos"),
        SpotlightTexture: gl.getUniformLocation(shaderProgram, "SpotlightTexture"),
        ColorScale: gl.getUniformLocation(shaderProgram, "ColorScale"),
        LineThickness: gl.getUniformLocation(shaderProgram, "LineThickness"),
        LineColorCutThreshold: gl.getUniformLocation(shaderProgram, "LineColorCutThreshold"),
        Orientation: gl.getUniformLocation(shaderProgram, "Orientation"),
        Scale: gl.getUniformLocation(shaderProgram, "Scale"),
        Color: gl.getUniformLocation(shaderProgram, "Color"),
        CurrentState: gl.getUniformLocation(shaderProgram, "CurrentState"),
        OrientationParent: gl.getUniformLocation(shaderProgram, "OrientationParent"),
    };
    return params;
}

export class CProjectileComponent {
    //Desc
    ColorInitial;
    ColorCurrent = GetVec3(1, 1, 1);
    PositionInitial;
    PositionCurrent = GetVec3(0, 0, 0);
    VelocityCurrent = GetVec3(0.0, 0.0, 0.0);
    Scale = 0.15;
    RotationSpeed = 0.0;
    Orientation = GetVec3(0, 0, 0);
    ParentSpaceMatrix = new Matrix4x4();

    TargetConstraintStrength = 5.0;
    LaunchVelocityX = 0.0;
    bLaunched = false;
    bStuck = false;

    //Particles
    TrailSparksParticles: ParticlesEmitter;
    TrailSmokeParticles: ParticlesEmitter;

    //Controller
    SpatialController;
    ControllerInitialPos = GetVec2(0.0, -0.8);

    //Render
    ShaderProgram;
    UniformParametersLocationList;

    //Resources
    MaskTexture;

    constructor(gl: WebGL2RenderingContext, colorInitial: Vector3, positionInitial: Vector3, scale: number) {
        {
            this.ColorInitial = colorInitial;
            this.PositionInitial = positionInitial;
            this.Scale = scale;

            this.SpatialController = new SpatialControlPoint(this.ControllerInitialPos, 0.075, true);

            this.SpatialController.MinBoundsNDC = GetVec2(-0.95, -1.0);
            this.SpatialController.MaxBoundsNDC = GetVec2(0.95, -0.25);

            this.ShaderProgram = CreateShaderProgramVSPS(
                gl,
                GetShaderSourceGenericSpriteParentSpaceRenderVS(),
                GetShaderSourceFireballRenderPS(),
            );
            this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

            //Resources
            this.MaskTexture = GTexturePool.CreateTexture(gl, false, "crossIcon_R8");

            //Particles
            const TrailSparksParticlesDesc = GetEmberParticlesDesc();
            TrailSparksParticlesDesc.NumSpawners2D = 2;
            TrailSparksParticlesDesc.NumParticlesPerSpawner = 32;
            /* TrailSparksParticlesDesc.DefaultSize.y *= 0.75;
        	TrailSparksParticlesDesc.DefaultSize.x *= 0.75; */
            TrailSparksParticlesDesc.DefaultSize.y *= 0.5;
            TrailSparksParticlesDesc.ParticleLife = 0.4;
            TrailSparksParticlesDesc.SizeRangeMinMax.x = 0.25;

            TrailSparksParticlesDesc.EInitialPositionMode = 2;
            TrailSparksParticlesDesc.bOneShotParticle = true;
            TrailSparksParticlesDesc.bAlwaysRespawn = true;
            TrailSparksParticlesDesc.b3DSpace = true;
            TrailSparksParticlesDesc.ESpecificShadingMode = EParticleShadingMode.EmbersImpact;
            /* TrailSparksParticlesDesc.InitialVelocityAddScale.y *= 0.75;
        	TrailSparksParticlesDesc.InitialVelocityAddScale.x *= 0.75; */

            TrailSparksParticlesDesc.bFreeFallParticle = true;
            TrailSparksParticlesDesc.bUseGravity = false;
            TrailSparksParticlesDesc.InitialVelocityScale = 6;
            TrailSparksParticlesDesc.MotionStretchScale = 2.3;
            TrailSparksParticlesDesc.VelocityFieldForceScale = 100.0;

            //TrailSparksParticlesDesc.Color = GetVec3(1.0, 0.6, 0.1);
            const sparksBrightness = 0.75;
            TrailSparksParticlesDesc.Color = GetVec3(
                colorInitial.x * sparksBrightness,
                colorInitial.y * sparksBrightness,
                colorInitial.z * sparksBrightness,
            );

            this.TrailSparksParticles = new ParticlesEmitter(gl, TrailSparksParticlesDesc);
        }

        {
            const TrailSmokeParticlesDesc = GetSmokeParticlesDesc();
            TrailSmokeParticlesDesc.NumSpawners2D = 1;
            TrailSmokeParticlesDesc.NumParticlesPerSpawner = 64;
            TrailSmokeParticlesDesc.ParticleLife = 1.2;
            TrailSmokeParticlesDesc.DefaultSize.x *= 0.25;
            TrailSmokeParticlesDesc.DefaultSize.y *= 0.25;
            TrailSmokeParticlesDesc.BuoyancyForceScale *= 0.1;

            TrailSmokeParticlesDesc.EInitialPositionMode = 2;
            TrailSmokeParticlesDesc.EAlphaFade = 1.0;
            TrailSmokeParticlesDesc.InitialVelocityScale = 10.0;
            TrailSmokeParticlesDesc.VelocityFieldForceScale *= 0.5;
            TrailSmokeParticlesDesc.EFadeInOutMode = 0;
            TrailSmokeParticlesDesc.AlphaScale = 0.1;
            TrailSmokeParticlesDesc.InitialTranslate = { x: 0.0, y: 0.25 };
            TrailSmokeParticlesDesc.bOneShotParticle = true;
            TrailSmokeParticlesDesc.b3DSpace = true;
            TrailSmokeParticlesDesc.bAlwaysRespawn = true;
            TrailSmokeParticlesDesc.bFreeFallParticle = false;

            this.TrailSmokeParticles = new ParticlesEmitter(gl, TrailSmokeParticlesDesc);
        }

        this.ControllerTraction(true);

        this.Reset();
    }

    CheckInteresctionWithPlane() {
        return MathIntersectionAABBSphere(
            this.PositionCurrent,
            this.Scale * 0.5,
            GSceneDesc.FirePlane.PositionOffset,
            GetVec3(1.0, 1.0, 0.0),
        );
    }

    ControllerTraction(bInstant = false) {
        const vsPos = GetVec3(
            this.SpatialController.PositionViewSpace.x,
            MathMapToRange(
                this.SpatialController.PositionNDCSpace.y,
                this.ControllerInitialPos.y,
                1.0,
                this.ControllerInitialPos.y,
                0.4,
            ),
            MathMapToRange(this.SpatialController.PositionNDCSpace.y, this.ControllerInitialPos.y, 1.0, 1.0, 3.0),
        );

        const worldPos = GetVec3(
            GSceneDesc.Camera.Position.x + vsPos.x,
            GSceneDesc.Camera.Position.y + vsPos.y,
            GSceneDesc.Camera.Position.z + vsPos.z,
        );

        if (bInstant) {
            this.PositionCurrent.x = worldPos.x;
            this.PositionCurrent.y = worldPos.y;
            this.PositionCurrent.z = worldPos.z;
        } else {
            /* this.PositionCurrent.x = MathLerp(this.PositionCurrent.x, worldPos.x, 0.25);
            this.PositionCurrent.y = MathLerp(this.PositionCurrent.y, worldPos.y, 0.25);
            this.PositionCurrent.z = MathLerp(this.PositionCurrent.z, worldPos.z, 0.25); */

            const dt = Math.min(1 / 60, GTime.Delta);
            SetPositionSmooth(this.PositionCurrent, this.VelocityCurrent, worldPos, dt, 200.0, 15.0);
        }
    }

    AttemptLaunch(gl: WebGL2RenderingContext) {
        let bCanLaunch = this.VelocityCurrent.z > 2.0;
        bCanLaunch = bCanLaunch || (this.VelocityCurrent.z > 1.0 && Math.abs(this.VelocityCurrent.x) > 2);
        if (bCanLaunch) {
            //Higher when hit from the side
            this.VelocityCurrent.y *= 1.0 + Math.abs(this.PositionCurrent.x) * 0.75;

            this.LaunchVelocityX = this.VelocityCurrent.x;

            this.TrailSparksParticles.Reset(gl);

            this.bLaunched = true;
        } else {
        }

        this.SpatialController.PositionViewSpace.x = this.ControllerInitialPos.x;
        this.SpatialController.PositionViewSpace.y = this.ControllerInitialPos.y;
    }

    Reset() {
        this.PositionCurrent.x = this.PositionInitial.x;
        this.PositionCurrent.y = this.PositionInitial.y;
        this.PositionCurrent.z = this.PositionInitial.z;

        this.VelocityCurrent.x = 0.0;
        this.VelocityCurrent.y = 0.0;
        this.VelocityCurrent.z = 0.0;

        this.bLaunched = false;
    }

    LaunchUpdate() {
        const dt = Math.min(1 / 60, GTime.Delta);

        {
            //aim to fire plane
            const curTargetPos = GSceneDesc.FirePlane.PositionOffset;

            const diff = GetVec3(
                curTargetPos.x - this.PositionCurrent.x,
                curTargetPos.y - 1 - this.PositionCurrent.y,
                curTargetPos.z - this.PositionCurrent.z,
            );

            let curDist = MathGetVec2Length(diff) * this.TargetConstraintStrength;
            curDist *= curDist;
            const dir = MathVector3Normalize(diff);

            curDist *= 0.25 + Math.min(1.0, this.VelocityCurrent.z * 0.1);

            this.VelocityCurrent.x += dir.x * curDist * dt * 0.75;
            if (dir.y < 0.0) {
                this.VelocityCurrent.y += dir.y * curDist * dt * 0.5;
            }
            /* const zScale = 0.1;
            this.VelocityCurrent.z += dir.z * zScale * curDist * dt; */
        }

        //Integrate
        this.PositionCurrent.x += this.VelocityCurrent.x * dt;
        this.PositionCurrent.y += this.VelocityCurrent.y * dt;
        this.PositionCurrent.z += this.VelocityCurrent.z * dt;
    }

    UpdateRotation() {
        if (!this.bLaunched) {
            this.RotationSpeed = Math.abs(this.VelocityCurrent.x) * 10.0;
            this.Orientation.z =
                (this.Orientation.z - Math.sign(this.VelocityCurrent.x) * this.RotationSpeed * GTime.Delta) %
                (Math.PI * 2.0);
        } else {
            this.RotationSpeed = MathClamp(Math.abs(this.VelocityCurrent.x), 0.5, 1.25) * 40.0;
            this.Orientation.z =
                (this.Orientation.z - Math.sign(this.LaunchVelocityX) * this.RotationSpeed * GTime.Delta) %
                (Math.PI * 2.0);
        }
    }

    OnUpdate(gl: WebGL2RenderingContext) {
        this.SpatialController.OnUpdate();
        this.UpdateRotation();

        //Selected
        if (this.SpatialController.bSelectedThisFrame) {
            this.TrailSmokeParticles.Reset(gl);
        }

        //Dragged
        let velLengthScale = 0.75;
        if (this.SpatialController.bDragState) {
            velLengthScale = velLengthScale + Math.min(0.85, MathGetVec3Length(this.VelocityCurrent) * 0.3);
        } else {
            velLengthScale = velLengthScale + Math.min(0.25, MathGetVec3Length(this.VelocityCurrent) * 0.2);
        }
        /* this.ColorCurrent.Set(
            this.ColorInitial.x * velLengthScale,
            this.ColorInitial.y * velLengthScale,
            this.ColorInitial.z * velLengthScale,
        ); */
        this.ColorCurrent.Set(this.ColorInitial);
        this.ColorCurrent.Mul(velLengthScale);

        //Released
        if (this.SpatialController.bReleasedThisFrame) {
            this.AttemptLaunch(gl);
        } else {
            if (!this.bLaunched) {
                this.ControllerTraction();
            }
        }

        //Launched
        if (this.bLaunched) {
            this.LaunchUpdate();
            this.TrailSparksParticles.Update(gl, GBurningSurface.GInstance!.GetCurFireTexture()!, this.PositionCurrent);
        }

        //Update Tool
        GSceneDesc.Tool.Position.x = this.PositionCurrent.x;
        GSceneDesc.Tool.Position.y = this.PositionCurrent.y;
        GSceneDesc.Tool.Position.z = this.PositionCurrent.z;
        const toolBright = 0.85;
        GSceneDesc.Tool.Color.r = this.ColorCurrent.x * toolBright;
        GSceneDesc.Tool.Color.g = this.ColorCurrent.y * toolBright;
        GSceneDesc.Tool.Color.b = this.ColorCurrent.z * toolBright;

        if (this.bLaunched || this.SpatialController.bDragState) {
            this.TrailSmokeParticles.Update(gl, GBurningSurface.GInstance!.GetCurFireTexture()!, this.PositionCurrent);

            GSceneDesc.Tool.Radius = 1.5;
        }

        if (this.IsOutOfBounds()) {
            this.Reset();
        }
    }

    IsOutOfBounds() {
        return (
            this.PositionCurrent.z > 3.0 ||
            this.PositionCurrent.z < GSceneDesc.Camera.Position.z - 1.0 ||
            Math.abs(this.PositionCurrent.x) > 5.0 ||
            Math.abs(this.PositionCurrent.y) > 5.0 ||
            this.PositionCurrent.y < GSceneDesc.Floor.Position.y + this.Scale * 2.0
        );
    }

    GetCurrentControllerState() {
        if (this.bStuck) {
            return 4;
        } else if (this.bLaunched) {
            return 3;
        } else if (this.SpatialController.bDragState) {
            return 2;
        } else if (this.SpatialController.bIntersectionThisFrame) {
            return 1;
        } else {
            return 0;
        }
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
        gl.uniform3f(
            this.UniformParametersLocationList.Position,
            this.PositionCurrent.x,
            this.PositionCurrent.y,
            this.PositionCurrent.z,
        );
        gl.uniform3f(
            this.UniformParametersLocationList.Orientation,
            this.Orientation.x,
            this.Orientation.y,
            this.Orientation.z,
        );
        gl.uniform3f(
            this.UniformParametersLocationList.Color,
            this.ColorCurrent.x,
            this.ColorCurrent.y,
            this.ColorCurrent.z,
        );

        gl.uniformMatrix3fv(
            this.UniformParametersLocationList.OrientationParent,
            false,
            this.ParentSpaceMatrix.toColumnMajorArray(),
        );

        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.CurClamped);
        gl.uniform1i(this.UniformParametersLocationList.CurrentState, this.GetCurrentControllerState());

        gl.activeTexture(gl.TEXTURE0 + 2);
        //gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.bindTexture(gl.TEXTURE_2D, this.MaskTexture);
        gl.uniform1i(this.UniformParametersLocationList.NoiseTexture, 2);

        //gl.disable(gl.BLEND);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.MAX);

        //Textures
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
