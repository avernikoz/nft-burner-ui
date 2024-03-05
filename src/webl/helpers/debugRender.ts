import { GSceneDesc, GScreenDesc } from "../scene";
import { CreateShaderProgramVSPS } from "../shaderUtils";
import {
    GetShaderSourceGenericLineRenderVS,
    GetShaderSourceGenericSpriteRenderPS,
    GetShaderSourceGenericSpriteRenderVS,
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
    };
    return params;
}

export class GPointRenderer {
    public static GInstance: GPointRenderer | null;

    ShaderProgram;

    UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericSpriteRenderVS(),
            GetShaderSourceGenericSpriteRenderPS(),
        );

        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);
    }

    Render(gl: WebGL2RenderingContext, position: Vector3, scale: number, color: Vector3 = GetVec3(1, 0, 1)) {
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
        gl.uniform1f(this.UniformParametersLocationList.Scale, scale);
        gl.uniform3f(this.UniformParametersLocationList.Position, position.x, position.y, position.z);
        gl.uniform3f(this.UniformParametersLocationList.Orientation, 0.0, 0.0, 0.0);
        gl.uniform3f(this.UniformParametersLocationList.Color, color.x, color.y, color.z);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

export class GLineRenderer {
    public static GInstance: GLineRenderer | null;

    ShaderProgram;

    UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceGenericLineRenderVS(),
            GetShaderSourceGenericSpriteRenderPS(),
        );

        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);
    }

    Render(
        gl: WebGL2RenderingContext,
        posStart: Vector3,
        posEnd: Vector3,
        scale = 0.01,
        color: Vector3 = GetVec3(1, 0, 1),
    ) {
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
        gl.uniform1f(this.UniformParametersLocationList.Scale, scale);
        GLSetVec3(gl, this.UniformParametersLocationList.Position, posStart);
        GLSetVec3(gl, this.UniformParametersLocationList.LineEnd, posEnd);
        //gl.uniform3f(this.UniformParametersLocationList.Position, posStart.x, posStart.y, posStart.z);
        gl.uniform3f(this.UniformParametersLocationList.Color, color.x, color.y, color.z);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
