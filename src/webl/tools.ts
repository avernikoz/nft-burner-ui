import { RFirePlanePass } from "./firePlane";
import { GUserInputDesc } from "./input";
import { CreateTexture } from "./resourcesUtils";
import { GSceneDesc, GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources, CommonVertexAttributeLocationList } from "./shaders/shaderConfig";
import { GetShaderSourceAnimatedSpriteRenderPS, GetShaderSourceSingleFlameRenderVS } from "./shaders/shaderTools";
import { GTime, MathClamp, MathGetVectorLength, MathLerp, MathLerpColor } from "./utils";

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        Position: gl.getUniformLocation(shaderProgram, "Position"),
        Velocity: gl.getUniformLocation(shaderProgram, "Velocity"),
        Time: gl.getUniformLocation(shaderProgram, "Time"),
        ScreenRatio: gl.getUniformLocation(shaderProgram, "ScreenRatio"),
        CameraDesc: gl.getUniformLocation(shaderProgram, "CameraDesc"),
        AnimationFrameIndex: gl.getUniformLocation(shaderProgram, "AnimationFrameIndex"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        LUTTexture: gl.getUniformLocation(shaderProgram, "LUTTexture"),
    };
    return params;
}

class CAnimationComponent {
    Age = 0.0;

    AgeNormalized = 0.0;

    AgeGlobal = 0.0;

    Lifetime = 1.0;

    Speed = 1.0;

    FlipbookSize = { x: 16, y: 4 };

    Update() {
        this.AgeGlobal += GTime.Delta * this.Speed;
        this.Age += GTime.Delta * this.Speed;
        this.Age = this.Age % this.Lifetime;
        this.AgeNormalized = this.Age / this.Lifetime;
    }
}

export class LighterTool {
    ShaderProgram;

    UniformParametersLocationList;

    ColorTexture;

    LUTTexture;

    VAO = CommonRenderingResources.PlaneShapeVAO;

    NumVertices = 6;

    VertexBufferGPU: WebGLBuffer | null = null;

    TexCoordsBufferGPU: WebGLBuffer | null = null;

    AnimationComponent = new CAnimationComponent();

    bActiveThisFrame = false;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceSingleFlameRenderVS(),
            GetShaderSourceAnimatedSpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.ShaderProgram);

        this.ColorTexture = CreateTexture(gl, 7, "assets/sprites/Flame02_16x4.png", true);
        this.LUTTexture = CreateTexture(gl, 5, "assets/flameColorLUT5.png", true);

        this.AnimationComponent.Speed = 1.0;

        if (1) {
            const mesh = this.GeneratePolyboardMesh(8);
            this.NumVertices = mesh.vertices.length / 2;
            //Create Vertex Buffer
            {
                //const planeVertices = [-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1];
                const planeVertexBufferCPU = new Float32Array(mesh.vertices);

                this.VertexBufferGPU = gl.createBuffer()!;
                //Upload from CPU to GPU
                gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexBufferGPU);
                gl.bufferData(gl.ARRAY_BUFFER, planeVertexBufferCPU, gl.STATIC_DRAW);
            }

            //Create TexCoord Buffer
            {
                //const planeTexCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0];
                const planeTexCoordsBufferCPU = new Float32Array(mesh.texCoords);

                this.TexCoordsBufferGPU = gl.createBuffer()!;
                //Upload from CPU to GPU
                gl.bindBuffer(gl.ARRAY_BUFFER, this.TexCoordsBufferGPU);
                gl.bufferData(gl.ARRAY_BUFFER, planeTexCoordsBufferCPU, gl.STATIC_DRAW);
            }

            //VAO
            this.VAO = gl.createVertexArray();
            gl.bindVertexArray(this.VAO);
            //Vertex Buffer Bind
            //bind resource to this attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexBufferGPU);
            gl.enableVertexAttribArray(CommonVertexAttributeLocationList.VertexBuffer); //turn on attribute
            gl.vertexAttribPointer(
                CommonVertexAttributeLocationList.VertexBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );

            //TexCoords Buffer Bind
            //bind resource to this attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, this.TexCoordsBufferGPU);
            gl.enableVertexAttribArray(CommonVertexAttributeLocationList.TexCoordsBuffer); //turn on attribute
            gl.vertexAttribPointer(
                CommonVertexAttributeLocationList.TexCoordsBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
        }

        setInterval(() => {
            this.RandCur = Math.random();
        }, 0.1 * 1000);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    GeneratePolyboardMesh(subdivisionsY: number): { vertices: number[]; texCoords: number[] } {
        const vertices: number[] = [];
        const texCoords: number[] = [];

        // Iterate through subdivisions in the y-axis
        for (let y = 1; y <= subdivisionsY; y++) {
            const v1 = (y - 1) / subdivisionsY; // Starting v-coordinate for the row
            const v2 = y / subdivisionsY; // Ending v-coordinate for the row

            // First triangle of the first square
            vertices.push(-1, v1 - 0.5); // x, y
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(-1, v2 - 0.5); // x, y

            texCoords.push(0, v1);
            texCoords.push(0.5, v1);
            texCoords.push(0, v2);

            // Second triangle of the first square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(0, v2 - 0.5); // x, y
            vertices.push(-1, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(0.5, v2);
            texCoords.push(0, v2);

            // First triangle of the second square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(1, v1 - 0.5); // x, y
            vertices.push(1, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(1, v1);
            texCoords.push(1, v2);

            // Second triangle of the second square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(1, v2 - 0.5); // x, y
            vertices.push(0, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(1, v2);
            texCoords.push(0.5, v2);
        }

        return { vertices, texCoords };
    }

    RandCur = 0.0;

    ColorLerpParam = 0.0;

    //Executes regardless of state
    UpdateMain() {
        //Animation
        this.AnimationComponent.Speed = MathLerp(1.0, 1.5, (Math.sin(GTime.Cur) + 1.0) * 0.5);
        const velocityMagnitude = MathGetVectorLength(GUserInputDesc.InputVelocityNDCCur);
        this.AnimationComponent.Speed += velocityMagnitude * 50;
        this.AnimationComponent.Update();

        //Position
        const posWS = { x: GUserInputDesc.InputPosNDCCur.x, y: GUserInputDesc.InputPosNDCCur.y };
        posWS.x *= GScreenDesc.ScreenRatio;
        posWS.x /= GSceneDesc.Camera.ZoomScale;
        posWS.y /= GSceneDesc.Camera.ZoomScale;

        posWS.x *= -GSceneDesc.Camera.Position.z + 1.0;
        posWS.y *= -GSceneDesc.Camera.Position.z + 1.0;
        posWS.y += 0.25;

        GSceneDesc.Tool.Position.x = posWS.x;
        GSceneDesc.Tool.Position.y = posWS.y;
        GSceneDesc.Tool.Position.z = -0.3;
    }

    UpdateIfActive() {
        if (this.bActiveThisFrame) {
            //Color
            this.ColorLerpParam += (this.RandCur - this.ColorLerpParam) * GTime.Delta * 1.0;
            const blueColor = { r: 0.2, g: 0.3, b: 0.9 };
            const redColor = { r: 1.0, g: 0.8, b: 0.1 };
            GSceneDesc.Tool.Color = MathLerpColor(redColor, blueColor, Math.max(0.35, this.ColorLerpParam));
            GSceneDesc.Tool.Radius = 2.5 * Math.max(0.5, 1.0 - this.ColorLerpParam);
            if (Math.abs(GUserInputDesc.InputVelocityNDCCur.x) > 0.0) {
                //shrink
                const s = 1.0 - MathClamp(Math.abs(GUserInputDesc.InputVelocityNDCCur.x) * 35.0, 0.0, 1.0);
                GSceneDesc.Tool.Color.r *= s;
                GSceneDesc.Tool.Color.g *= s;
                GSceneDesc.Tool.Color.b *= s;
            }
        } else {
            GSceneDesc.Tool.Radius = 0.0;
        }
    }

    RenderToFireSurface(gl: WebGL2RenderingContext, BurningSurface: RFirePlanePass) {
        const curInputPos = GUserInputDesc.InputPosNDCCur;
        const curInputDir = { x: 0, y: 0 };
        curInputDir.x = GUserInputDesc.InputPosNDCCur.x - GUserInputDesc.InputPosNDCPrev.x;
        curInputDir.y = GUserInputDesc.InputPosNDCCur.y - GUserInputDesc.InputPosNDCPrev.y;
        const inputDirLength = MathGetVectorLength(curInputDir);
        let sizeScale;
        if (GUserInputDesc.bPointerInputActiveThisFrame == false) {
            sizeScale = 0.005;
            curInputDir.x = 0;
            curInputDir.y = 1;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sizeScale = MathClamp(inputDirLength * 0.5, 0.001, 0.05);
        }

        BurningSurface.BindFireRT(gl);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        BurningSurface.ApplyFirePass.Execute(
            gl,
            { x: curInputPos.x, y: curInputPos.y + 0.1 },
            { x: 0.0, y: 1.0 },
            0.05,
            2.0 * GTime.Delta,
        );
        gl.disable(gl.BLEND);
    }

    Render(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(this.VAO);

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
        gl.uniform1f(this.UniformParametersLocationList.Time, GTime.Cur);

        const TotalFlipFrames = this.AnimationComponent.FlipbookSize.x * this.AnimationComponent.FlipbookSize.y;
        gl.uniform1f(
            this.UniformParametersLocationList.AnimationFrameIndex,
            this.AnimationComponent.AgeNormalized * TotalFlipFrames,
        );

        //Compute Cur ViewSpace Pos
        const curPosViewSpace = {
            x: GUserInputDesc.InputPosNDCCur.x * GScreenDesc.ScreenRatio,
            y: GUserInputDesc.InputPosNDCCur.y,
        };
        gl.uniform3f(this.UniformParametersLocationList.Position, curPosViewSpace.x, curPosViewSpace.y, 0.0);
        const curInputDir = GUserInputDesc.InputVelocityNDCCur;
        curInputDir.x = (curInputDir.x + GUserInputDesc.InputVelocityNDCPrev.x) * 0.5;
        curInputDir.y = (curInputDir.y + GUserInputDesc.InputVelocityNDCPrev.y) * 0.5;
        gl.uniform2f(this.UniformParametersLocationList.Velocity, curInputDir.x, curInputDir.y);

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 1);

        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.LUTTexture);
        gl.uniform1i(this.UniformParametersLocationList.LUTTexture, 2);

        gl.drawArrays(gl.TRIANGLES, 0, this.NumVertices);
    }
}
