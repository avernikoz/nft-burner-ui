import { GUserInputDesc } from "./input";
import { CreateTexture } from "./resourcesUtils";
import { GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { GetShaderSourceUISpriteRenderPS, GetShaderSourceUISpriteRenderVS } from "./shaders/shaderUI";
import { Vector2 } from "./types";
import { MathClamp, MathIntersectionSphereSphere } from "./utils";

///Screen Space Interactable GUI allowing to spatially control such Data as Position/Velocity
export class SpatialControlPoint {
    public Radius;

    public PositionViewSpace;

    public bDragState;

    public bIntersectionThisFrame;

    public bIntersectionPrevFrame;

    public bSelectedThisFrame: boolean;

    private bDraggable: boolean;

    //UI Textures
    public ColorTexture0;

    public ColorTexture1;

    GetCurrentTexture() {
        return this.bIntersectionThisFrame ? this.ColorTexture1 : this.ColorTexture0;
    }

    constructor(
        gl: WebGL2RenderingContext,
        initialPosition: Vector2,
        inRadius: number,
        inbIsDraggable: boolean,
        defaultTextureLocation: string,
        activeTextureLocation: string,
    ) {
        this.Radius = inRadius;
        this.PositionViewSpace = initialPosition;

        this.bDragState = false;
        this.bIntersectionThisFrame = false;
        this.bIntersectionPrevFrame = false;
        this.bSelectedThisFrame = false;
        this.bDraggable = inbIsDraggable;

        this.ColorTexture0 = CreateTexture(gl, 4, defaultTextureLocation);
        this.ColorTexture1 = CreateTexture(gl, 4, activeTextureLocation);
    }

    ClearState() {
        this.bSelectedThisFrame = false;
        this.bIntersectionPrevFrame = false;
        this.bIntersectionThisFrame = false;
    }

    OnUpdate() {
        this.bSelectedThisFrame = false;
        this.bIntersectionPrevFrame = this.bIntersectionThisFrame;
        this.bIntersectionThisFrame = false;
        //Construct client pointer intersection sphere
        const clientSphereRadius = 0.01; //might switch to ray
        const clientSpherePosViewSpace = {
            x: GUserInputDesc.InputPosCurNDC.x * GScreenDesc.ScreenRatio,
            y: GUserInputDesc.InputPosCurNDC.y,
        };

        if (!this.bDragState || !this.bDraggable) {
            //check if client intersects
            this.bIntersectionThisFrame = MathIntersectionSphereSphere(
                clientSpherePosViewSpace,
                clientSphereRadius,
                this.PositionViewSpace,
                this.Radius,
            );

            if (GUserInputDesc.bPointerInputPressedCurFrame && this.bIntersectionThisFrame) {
                this.bSelectedThisFrame = true;
                this.bDragState = true && this.bDraggable;
            }
        } //drag state
        else {
            this.bIntersectionThisFrame = true;
            this.PositionViewSpace = clientSpherePosViewSpace;

            this.PositionViewSpace.x = MathClamp(
                this.PositionViewSpace.x,
                -GScreenDesc.ScreenRatio + this.Radius,
                GScreenDesc.ScreenRatio - this.Radius,
            );
            this.PositionViewSpace.y = MathClamp(this.PositionViewSpace.y, -1 + this.Radius, 1 - this.Radius);

            if (!this.bSelectedThisFrame) {
                this.bDragState = false;
            }
        }
    }
}

export class RSpatialControllerVisualizationRenderer {
    public ShaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //================================================ Floor Render

        //Create Shader Program
        this.ShaderProgram = CreateShaderProgramVSPS(
            gl,
            GetShaderSourceUISpriteRenderVS(),
            GetShaderSourceUISpriteRenderPS(),
        );

        //Shader Parameters
        this.UniformParametersLocationList = this.GetUniformParametersList(gl, this.ShaderProgram);
    }

    Render(gl: WebGL2RenderingContext, inController: SpatialControlPoint) {
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);

        gl.useProgram(this.ShaderProgram);

        //Constants
        gl.uniform1f(this.UniformParametersLocationList.ScreenRatio, GScreenDesc.ScreenRatio);
        gl.uniform1f(this.UniformParametersLocationList.Size, inController.Radius);
        gl.uniform2f(
            this.UniformParametersLocationList.Position,
            inController.PositionViewSpace.x,
            inController.PositionViewSpace.y,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, inController.GetCurrentTexture());
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 1);

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
