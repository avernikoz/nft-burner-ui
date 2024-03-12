import { GUserInputDesc } from "./input";
import { GScreenDesc } from "./scene";
import { CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import { GetShaderSourceUISpriteRenderPS, GetShaderSourceUISpriteRenderVS } from "./shaders/shaderUI";
import { GTexturePool } from "./texturePool";
import { GetVec2, Vector2 } from "./types";
import { MathClamp, MathIntersectionSphereSphere } from "./utils";

///Screen Space Interactable GUI allowing to spatially control such Data as Position/Velocity
export class SpatialControlPoint {
    bEnabled = true;

    Radius;

    PositionViewSpace;

    PositionNDCSpace = GetVec2(0, 0);

    bDragState;

    bIntersectionThisFrame;

    bIntersectionPrevFrame;

    bSelectedThisFrame: boolean;

    bReleasedThisFrame = false;

    MinBoundsNDC = GetVec2(-1.0, -1.0);

    MaxBoundsNDC = GetVec2(1.0, 1.0);

    private bDraggable: boolean;

    constructor(initialPosition: Vector2, inRadius: number, inbIsDraggable: boolean) {
        this.Radius = inRadius;
        this.PositionViewSpace = initialPosition;
        this.PositionNDCSpace.x = this.PositionViewSpace.x / GScreenDesc.ScreenRatio;
        this.PositionNDCSpace.y = this.PositionViewSpace.y;

        this.bDragState = false;
        this.bIntersectionThisFrame = false;
        this.bIntersectionPrevFrame = false;
        this.bSelectedThisFrame = false;
        this.bDraggable = inbIsDraggable;
    }

    ClearState() {
        this.bSelectedThisFrame = false;
        this.bIntersectionPrevFrame = false;
        this.bIntersectionThisFrame = false;
    }

    OnUpdate() {
        this.bSelectedThisFrame = false;
        this.bReleasedThisFrame = false;
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
                this.MinBoundsNDC.x * GScreenDesc.ScreenRatio,
                this.MaxBoundsNDC.x * GScreenDesc.ScreenRatio,
            );
            this.PositionViewSpace.y = MathClamp(this.PositionViewSpace.y, this.MinBoundsNDC.y, this.MaxBoundsNDC.y);

            this.PositionViewSpace.x = MathClamp(
                this.PositionViewSpace.x,
                -GScreenDesc.ScreenRatio + this.Radius,
                GScreenDesc.ScreenRatio - this.Radius,
            );
            this.PositionViewSpace.y = MathClamp(this.PositionViewSpace.y, -1 + this.Radius, 1 - this.Radius);

            /* if (!this.bSelectedThisFrame) {
                this.bDragState = false;
            } */
            /* const thres = 0.05;
            const inputOutOfBounds =
                GUserInputDesc.InputPosCurNDC.x > 1.0 - thres ||
                GUserInputDesc.InputPosCurNDC.x < thres ||
                GUserInputDesc.InputPosCurNDC.y > 1.0 - thres ||
                GUserInputDesc.InputPosCurNDC.y < thres; */
            if (!GUserInputDesc.bPointerInputPressedCurFrame /* || inputOutOfBounds */) {
                this.bDragState = false;
                this.bReleasedThisFrame = true;
            }
        }

        this.PositionNDCSpace.x = this.PositionViewSpace.x / GScreenDesc.ScreenRatio;
        this.PositionNDCSpace.y = this.PositionViewSpace.y;
    }
}

export class SpatialControlPointWithTexture extends SpatialControlPoint {
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
        super(initialPosition, inRadius, inbIsDraggable);
        this.ColorTexture0 = GTexturePool.CreateTexture(gl, false, defaultTextureLocation);
        this.ColorTexture1 = GTexturePool.CreateTexture(gl, false, activeTextureLocation);
    }
}

export class RSpatialControllerVisualizationRenderer {
    static GInstance: RSpatialControllerVisualizationRenderer | null = null;

    private ShaderProgram;

    private UniformParametersLocationList;

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

    Render(gl: WebGL2RenderingContext, inController: SpatialControlPointWithTexture) {
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
