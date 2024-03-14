/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GSceneDesc, GScreenDesc } from "../scene";
import { CreateShaderProgramVSPS } from "../shaderUtils";
import {
    GetShaderSourceGenericLineRenderVS,
    GetShaderSourceGenericRenderPS,
    GetShaderSourceGenericSpriteRenderVS,
    GetShaderSourceGenericTexturedRenderPS,
    GetShaderSourceGenericTriangleRenderVS,
} from "../shaders/shaderBackgroundScene";
import { CommonRenderingResources } from "../shaders/shaderConfig";
import { GetVec3, Vector2, Vector3 } from "../types";
import { GLSetVec3 } from "./glHelper";

export function GetUniformParametersListSimpleShape(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        Position: gl.getUniformLocation(shaderProgram, "Position"),
        Orientation: gl.getUniformLocation(shaderProgram, "Orientation"),
        Scale: gl.getUniformLocation(shaderProgram, "Scale"),
        Color: gl.getUniformLocation(shaderProgram, "Color"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        LineEnd: gl.getUniformLocation(shaderProgram, "LineEnd"),
        Vertex1: gl.getUniformLocation(shaderProgram, "Vertex1"),
        Vertex2: gl.getUniformLocation(shaderProgram, "Vertex2"),
        Vertex3: gl.getUniformLocation(shaderProgram, "Vertex3"),
        bCircle: gl.getUniformLocation(shaderProgram, "bCircle"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
    };
    return params;
}

export class GSimpleShapesRenderer {
    public static GInstance: GSimpleShapesRenderer | null;

    ShaderProgramPoint;
    UniformParametersLocationListPoint;

    ShaderProgramPointTextured;
    UniformParametersLocationListPointTextured;

    ShaderProgramPointNonUniformScaleTextured;
    UniformParametersLocationListointNonUniformScaleTextured;

    ShaderProgramLine;
    UniformParametersLocationListLine;

    ShaderProgramTriangle;
    UniformParametersLocationListTriangle;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgramPoint = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(),
            GetShaderSourceGenericRenderPS(),
        );

        this.UniformParametersLocationListPoint = GetUniformParametersListSimpleShape(gl, this.ShaderProgramPoint);

        this.ShaderProgramPointTextured = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(),
            GetShaderSourceGenericTexturedRenderPS(),
        );

        this.UniformParametersLocationListPointTextured = GetUniformParametersListSimpleShape(
            gl,
            this.ShaderProgramPointTextured,
        );

        this.ShaderProgramPointNonUniformScaleTextured = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(false),
            GetShaderSourceGenericTexturedRenderPS(),
        );

        this.UniformParametersLocationListointNonUniformScaleTextured = GetUniformParametersListSimpleShape(
            gl,
            this.ShaderProgramPointNonUniformScaleTextured,
        );

        //Line
        this.ShaderProgramLine = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericLineRenderVS(),
            GetShaderSourceGenericRenderPS(),
        );

        this.UniformParametersLocationListLine = GetUniformParametersListSimpleShape(gl, this.ShaderProgramLine);

        //Triangle
        this.ShaderProgramTriangle = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericTriangleRenderVS(),
            GetShaderSourceGenericRenderPS(),
        );

        this.UniformParametersLocationListTriangle = GetUniformParametersListSimpleShape(
            gl,
            this.ShaderProgramTriangle,
        );
    }

    RenderPoint(
        gl: WebGL2RenderingContext,
        position: Vector3,
        scale: number | Vector2,
        color: Vector3 = GetVec3(1, 0, 1),
        bCircle = true,
        orientationRoll = 0,
        pTexture: WebGLTexture | null = null,
    ) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        let uniformsLocation = this.UniformParametersLocationListPoint;

        let bNonUniformScale = false;

        if (typeof scale === "number") {
        } else {
            bNonUniformScale = true;
        }

        if (pTexture) {
            if (bNonUniformScale) {
                gl.useProgram(this.ShaderProgramPointNonUniformScaleTextured);
                uniformsLocation = this.UniformParametersLocationListointNonUniformScaleTextured;
            } else {
                gl.useProgram(this.ShaderProgramPointTextured);
                uniformsLocation = this.UniformParametersLocationListPointTextured;
            }
        } else {
            gl.useProgram(this.ShaderProgramPoint);
        }

        //Constants
        gl.uniform4f(
            uniformsLocation.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(uniformsLocation.ScreenRatio, GScreenDesc.ScreenRatio);

        if (scale instanceof Vector3) {
            gl.uniform2f(uniformsLocation.Scale, scale.x, scale.y);
        } else if (typeof scale === "number") {
            gl.uniform1f(uniformsLocation.Scale, scale);
        }

        gl.uniform3f(uniformsLocation.Position, position.x, position.y, position.z);
        gl.uniform3f(uniformsLocation.Orientation, 0.0, 0.0, orientationRoll);
        gl.uniform3f(uniformsLocation.Color, color.x, color.y, color.z);
        gl.uniform1i(uniformsLocation.bCircle, bCircle ? 1 : 0);

        if (pTexture) {
            //Textures
            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, pTexture);
            gl.uniform1i(uniformsLocation.ColorTexture, 1);
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    RenderLine(
        gl: WebGL2RenderingContext,
        posStart: Vector3,
        posEnd: Vector3,
        scale = 0.01,
        color: Vector3 = GetVec3(1, 0, 1),
    ) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramLine);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListLine.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListLine.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationListLine.Scale, scale);
        GLSetVec3(gl, this.UniformParametersLocationListLine.Position, posStart);
        GLSetVec3(gl, this.UniformParametersLocationListLine.LineEnd, posEnd);
        gl.uniform3f(this.UniformParametersLocationListLine.Color, color.x, color.y, color.z);
        gl.uniform1i(this.UniformParametersLocationListLine.bCircle, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    RenderTriangle(
        gl: WebGL2RenderingContext,
        v0: Vector3,
        v1: Vector3,
        v2: Vector3,
        color: Vector3 = GetVec3(1, 0, 1),
    ) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramTriangle);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListTriangle.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListTriangle.ScreenRatio, GScreenDesc.ScreenRatio);
        GLSetVec3(gl, this.UniformParametersLocationListTriangle.Vertex1, v0);
        GLSetVec3(gl, this.UniformParametersLocationListTriangle.Vertex2, v1);
        GLSetVec3(gl, this.UniformParametersLocationListTriangle.Vertex3, v2);
        gl.uniform3f(this.UniformParametersLocationListTriangle.Color, color.x, color.y, color.z);
        gl.uniform1i(this.UniformParametersLocationListTriangle.bCircle, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}
