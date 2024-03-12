/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GSceneDesc, GScreenDesc } from "../scene";
import { CreateShaderProgramVSPS } from "../shaderUtils";
import {
    GetShaderSourceGenericLineRenderVS,
    GetShaderSourceGenericRenderPS,
    GetShaderSourceGenericSpriteRenderVS,
    GetShaderSourceGenericTriangleRenderVS,
} from "../shaders/shaderBackgroundScene";
import { CommonRenderingResources } from "../shaders/shaderConfig";
import { GetVec3, Vector3 } from "../types";
import { GLSetVec3 } from "./glHelper";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
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
    };
    return params;
}

export class GSimpleShapesRenderer {
    public static GInstance: GSimpleShapesRenderer | null;

    ShaderProgramPoint;
    UniformParametersLocationListPoint;

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

        this.UniformParametersLocationListPoint = GetUniformParametersList(gl, this.ShaderProgramPoint);

        //Line
        this.ShaderProgramLine = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericLineRenderVS(),
            GetShaderSourceGenericRenderPS(),
        );

        this.UniformParametersLocationListLine = GetUniformParametersList(gl, this.ShaderProgramLine);

        //Triangle
        this.ShaderProgramTriangle = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericTriangleRenderVS(),
            GetShaderSourceGenericRenderPS(),
        );

        this.UniformParametersLocationListTriangle = GetUniformParametersList(gl, this.ShaderProgramTriangle);
    }

    RenderPoint(
        gl: WebGL2RenderingContext,
        position: Vector3,
        scale: number,
        color: Vector3 = GetVec3(1, 0, 1),
        bCircle = true,
    ) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgramPoint);

        //Constants
        gl.uniform4f(
            this.UniformParametersLocationListPoint.CameraDesc,
            GSceneDesc.Camera.Position.x,
            GSceneDesc.Camera.Position.y,
            GSceneDesc.Camera.Position.z,
            GSceneDesc.Camera.ZoomScale,
        );
        gl.uniform1f(this.UniformParametersLocationListPoint.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationListPoint.Scale, scale);
        gl.uniform3f(this.UniformParametersLocationListPoint.Position, position.x, position.y, position.z);
        gl.uniform3f(this.UniformParametersLocationListPoint.Orientation, 0.0, 0.0, 0.0);
        gl.uniform3f(this.UniformParametersLocationListPoint.Color, color.x, color.y, color.z);
        gl.uniform1i(this.UniformParametersLocationListPoint.bCircle, bCircle ? 1 : 0);

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
