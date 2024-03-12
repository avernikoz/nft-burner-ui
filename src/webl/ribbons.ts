import { bsc } from "viem/chains";
import { GLSetVec3 } from "./helpers/glHelper";
import { GUserInputDesc } from "./input";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { GetShaderSourceRibbonRenderVS, GetShaderSourceTrailRibbonRenderPS } from "./shaders/shaderBackgroundScene";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { TransformFromNDCToWorld } from "./transform";
import { GetVec3, Vector3 } from "./types";
import { MathGetVec2Length, Vec3Negate } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),

        PosCur: gl.getUniformLocation(shaderProgram, "PosCur"),
        PosPrev: gl.getUniformLocation(shaderProgram, "PosPrev"),
        VelocityCur: gl.getUniformLocation(shaderProgram, "VelocityCur"),
        VelocityPrev: gl.getUniformLocation(shaderProgram, "VelocityPrev"),
        LineThickness: gl.getUniformLocation(shaderProgram, "LineThickness"),
        Color: gl.getUniformLocation(shaderProgram, "Color"),
    };
    return params;
}

export class GRibbonsRenderer {
    public static GInstance: GRibbonsRenderer | null;

    ShaderProgram;

    UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceRibbonRenderVS(),
            GetShaderSourceTrailRibbonRenderPS(),
        );

        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);
    }

    Render(
        gl: WebGL2RenderingContext,
        posArr: Vector3[],
        velArr: Vector3[],
        color = GetVec3(1.0, 0.5, 0.7),
        scale = 0.1,
        bTailFade = false,
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

        gl.uniform1f(this.UniformParametersLocationList.LineThickness, scale * 0.1);

        for (let i = 1; i < posArr.length; i++) {
            const posPrev = posArr[i - 1];
            const posCur = posArr[i];
            const velPrev = velArr[i - 1];
            const velCur = velArr[i];

            GLSetVec3(gl, this.UniformParametersLocationList.PosPrev, posPrev);
            GLSetVec3(gl, this.UniformParametersLocationList.VelocityPrev, velPrev);
            GLSetVec3(gl, this.UniformParametersLocationList.PosCur, posCur);
            GLSetVec3(gl, this.UniformParametersLocationList.VelocityCur, velCur);

            let brightness = 1.0;
            if (bTailFade) {
                brightness = i / (posArr.length - 1);
            }

            gl.uniform3f(
                this.UniformParametersLocationList.Color,
                color.x * brightness,
                color.y * brightness,
                color.z * brightness,
            );

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
}

export function GenerateSplineTangents(posArr: Vector3[], velArr: Vector3[]) {
    const size = posArr.length;
    for (let i = 0; i < size; i++) {
        //const pCur = this.bufferPos[i];

        const pPrev = i === 0 ? posArr[0] : posArr[i - 1];
        const pNext = i === size - 1 ? posArr[size - 1] : posArr[i + 1];

        const tCur = velArr[i];
        tCur.Set(pNext);
        tCur.Negate(pPrev);
        tCur.Normalize();
    }
}

export class RibbonBufferCPU {
    bufferPos: Vector3[];

    bufferVel: Vector3[];

    constructor(size: number) {
        this.bufferPos = new Array<Vector3>(size);
        this.bufferVel = new Array<Vector3>(size);
        for (let i = 0; i < this.bufferPos.length; i++) {
            this.bufferPos[i] = new Vector3(0, 0, 0);
            this.bufferVel[i] = new Vector3(0, 0, 0);
        }
    }

    Sample(newPos: Vector3, tangent: Vector3 | null = null) {
        /* const posWSCur = TransformFromNDCToWorld(GUserInputDesc.InputPosCurNDC);
        const posWSPrev = TransformFromNDCToWorld(GUserInputDesc.InputPosPrevNDC); */
        //if (MathGetVec2Length(Vec3Negate(posWSCur, posWSPrev)) > 0.01)
        {
            const size = this.bufferPos.length;
            this.ShiftSamples(tangent != null);
            this.bufferPos[size - 1].Set(newPos);
            if (tangent) {
                this.bufferVel[size - 1].Set(tangent);
            } else {
                GenerateSplineTangents(this.bufferPos, this.bufferVel);
            }
        }
    }

    private ShiftSamples(bShiftTangents: boolean) {
        const size = this.bufferPos.length;
        for (let i = 0; i < size - 1; i++) {
            this.bufferPos[i].Set(this.bufferPos[i + 1]);
            if (bShiftTangents) {
                this.bufferVel[i].Set(this.bufferVel[i + 1]);
            }
        }
    }
}

export class RRibbonMesh {
    DataCPU: RibbonBufferCPU;

    constructor(size: number) {
        this.DataCPU = new RibbonBufferCPU(size);
    }

    OnUpdate(newPos: Vector3, tangent: Vector3 | null = null) {
        this.DataCPU.Sample(newPos, tangent);
    }

    ForEachPos(func: (arg0: Vector3) => void) {
        const size = this.DataCPU.bufferPos.length;
        for (let i = 0; i < size; i++) {
            const curpos = this.DataCPU.bufferPos[i];
            func(curpos);
        }
    }
}
