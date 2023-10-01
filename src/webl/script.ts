import { APP_ENVIRONMENT } from "../config/config";
import { getCanvas } from "./helpers/canvas";
import { DrawUI } from "./helpers/gui";
import { ParticlesEmitter } from "./particles";
import { FlameParticlesDesc } from "./particlesConfig";
import { CreateTexture, CreateTextureRT, FrameBufferCheck } from "./resourcesUtils";
import { CheckGL, CreateShaderProgramVSPS } from "./shaderUtils";
import { CommonRenderingResources } from "./shaders/shaderConfig";
import {
    ShaderSourceApplyFireVS,
    ShaderSourceApplyFirePS,
    ShaderSourceFullscreenPassVS,
    ShaderSourcePresentPassPS,
    ShaderSourceFireUpdatePS,
    ShaderSourceFireVisualizerPS,
} from "./shaders/shaderFirePlane";
import { CGConstants } from "./systemValues";

import { Vector2 } from "./types";
import {
    GTime,
    GetMousePosNDC,
    MathClamp,
    MathGetVectorLength,
    MathVectorNormalize,
    UpdateTime,
    showError,
} from "./utils";

const VertexAttributeLocationList = {
    VertexBuffer: 0,
    TexCoordsBuffer: 1,
};

function GetUniformParametersList(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    const params = {
        GPositionOffset: gl.getUniformLocation(shaderProgram, "GPositionOffset"),
        SizeScale: gl.getUniformLocation(shaderProgram, "SizeScale"),
        VelocityDir: gl.getUniformLocation(shaderProgram, "VelocityDir"),
        ColorTexture: gl.getUniformLocation(shaderProgram, "ColorTexture"),
        FireTexture: gl.getUniformLocation(shaderProgram, "FireTexture"),
        FuelTexture: gl.getUniformLocation(shaderProgram, "FuelTexture"),
        FlameColorLUT: gl.getUniformLocation(shaderProgram, "FlameColorLUT"),
        ImageTexture: gl.getUniformLocation(shaderProgram, "ImageTexture"),
        AshTexture: gl.getUniformLocation(shaderProgram, "AshTexture"),
        AfterBurnTexture: gl.getUniformLocation(shaderProgram, "AfterBurnTexture"),
        DeltaTime: gl.getUniformLocation(shaderProgram, "DeltaTime"),
        NoiseTextureInterpolator: gl.getUniformLocation(shaderProgram, "NoiseTextureInterpolator"),
        NoiseTexture: gl.getUniformLocation(shaderProgram, "NoiseTexture"),
    };
    return params;
}
// ====================================================== SHADERS END ======================================================

function AllocateCommonRenderingResources(gl: WebGL2RenderingContext) {
    if (CommonRenderingResources.FullscreenPassVertexBufferGPU == null) {
        const vertexBufferCPU = new Float32Array([
            -1.0,
            -1.0, // Bottom-left corner
            3.0,
            -1.0, // Bottom-right corner
            -1.0,
            3.0, // Top-left corner
        ]);

        CommonRenderingResources.FullscreenPassVertexBufferGPU = gl.createBuffer();
        //Upload from CPU to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.FullscreenPassVertexBufferGPU);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBufferCPU, gl.STATIC_DRAW);

        //VAO
        {
            CommonRenderingResources.FullscreenPassVAO = gl.createVertexArray();
            gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);
            //Vertex Buffer Bind
            gl.enableVertexAttribArray(VertexAttributeLocationList.VertexBuffer); //turn on attribute
            //bind resource to this attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.FullscreenPassVertexBufferGPU);
            gl.vertexAttribPointer(
                VertexAttributeLocationList.VertexBuffer,
                2,
                gl.FLOAT,
                false,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0,
            );
        }
    }

    if (CommonRenderingResources.PlaneShapeVertexBufferGPU == null) {
        //Create Vertex Buffer
        {
            const planeVertices = [-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1];
            const planeVertexBufferCPU = new Float32Array(planeVertices);

            CommonRenderingResources.PlaneShapeVertexBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeVertexBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeVertexBufferCPU, gl.STATIC_DRAW);
        }

        //Create TexCoord Buffer
        {
            const planeTexCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0];
            const planeTexCoordsBufferCPU = new Float32Array(planeTexCoords);

            CommonRenderingResources.PlaneShapeTexCoordsBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeTexCoordsBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeTexCoordsBufferCPU, gl.STATIC_DRAW);
        }

        //VAO
        CommonRenderingResources.PlaneShapeVAO = gl.createVertexArray();
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);
        //Vertex Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeVertexBufferGPU);
        gl.enableVertexAttribArray(VertexAttributeLocationList.VertexBuffer); //turn on attribute
        gl.vertexAttribPointer(
            VertexAttributeLocationList.VertexBuffer,
            2,
            gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );

        //TexCoords Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, CommonRenderingResources.PlaneShapeTexCoordsBufferGPU);
        gl.enableVertexAttribArray(VertexAttributeLocationList.TexCoordsBuffer); //turn on attribute
        gl.vertexAttribPointer(
            VertexAttributeLocationList.TexCoordsBuffer,
            2,
            gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );
    }
}

class RPresentPass {
    public shaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext) {
        //Create Shader Program
        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceFullscreenPassVS, ShaderSourcePresentPassPS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(
        gl: WebGL2RenderingContext,
        canvas: HTMLCanvasElement,
        sourceTexture: WebGLTexture,
        destFramebuffer: WebGLFramebuffer | null,
        destSize: Vector2,
    ) {
        if (destFramebuffer) {
            gl.viewport(0, 0, destSize.x, destSize.y);
            gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);
        } else {
            //Final present
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.clearColor(0.05, 0.05, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgram);

        //Constants

        //Textures
        //TODO: The source texture might be already bound to texture unit
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

class RApplyFireRenderPass {
    public colorTexture;

    public shaderProgram;

    public UniformParametersLocationList;

    constructor(gl: WebGL2RenderingContext, imageSrc: string | null) {
        //Create Texture
        this.colorTexture = null;

        //Create Shader Program
        if (imageSrc != null) {
            this.colorTexture = CreateTexture(gl, 0, imageSrc);
        }

        this.shaderProgram = CreateShaderProgramVSPS(gl, ShaderSourceApplyFireVS, ShaderSourceApplyFirePS);

        //Shader Parameters
        this.UniformParametersLocationList = GetUniformParametersList(gl, this.shaderProgram);
    }

    Execute(gl: WebGL2RenderingContext, positionOffset: Vector2, sizeScale: number, velDirection: Vector2) {
        gl.useProgram(this.shaderProgram);
        //VAO
        gl.bindVertexArray(CommonRenderingResources.PlaneShapeVAO);
        //Textures
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.uniform1i(this.UniformParametersLocationList.ColorTexture, 0);
        //Bind Constants
        gl.uniform2f(this.UniformParametersLocationList.GPositionOffset, positionOffset.x, positionOffset.y);
        gl.uniform1f(this.UniformParametersLocationList.SizeScale, sizeScale);
        gl.uniform2f(this.UniformParametersLocationList.VelocityDir, velDirection.x, velDirection.y);

        /* Set up blending */
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.BLEND);
    }
}

class RFirePlanePass {
    public RenderTargetSize;

    public FrameBuffer;

    public FireTexture;

    public FuelTexture;

    public CurrentFireTextureIndex: number;

    public CurrentFuelTextureIndex: number;

    PlaneDrawingPass: RApplyFireRenderPass;

    shaderProgramFireUpdate: WebGLProgram;

    UniformParametersLocationListFireUpdate: {
        GPositionOffset: WebGLUniformLocation | null;
        SizeScale: WebGLUniformLocation | null;
        VelocityDir: WebGLUniformLocation | null;
        ColorTexture: WebGLUniformLocation | null;
        FireTexture: WebGLUniformLocation | null;
        FuelTexture: WebGLUniformLocation | null;
        FlameColorLUT: WebGLUniformLocation | null;
        ImageTexture: WebGLUniformLocation | null;
        AshTexture: WebGLUniformLocation | null;
        AfterBurnTexture: WebGLUniformLocation | null;
        DeltaTime: WebGLUniformLocation | null;
        NoiseTextureInterpolator: WebGLUniformLocation | null;
        NoiseTexture: WebGLUniformLocation | null;
    };

    NoiseTexture: WebGLTexture;

    NoiseTextureInterpolator: number;

    VisualizerShaderProgram: WebGLProgram;

    VisualizerUniformParametersLocationList: {
        GPositionOffset: WebGLUniformLocation | null;
        SizeScale: WebGLUniformLocation | null;
        VelocityDir: WebGLUniformLocation | null;
        ColorTexture: WebGLUniformLocation | null;
        FireTexture: WebGLUniformLocation | null;
        FuelTexture: WebGLUniformLocation | null;
        FlameColorLUT: WebGLUniformLocation | null;
        ImageTexture: WebGLUniformLocation | null;
        AshTexture: WebGLUniformLocation | null;
        AfterBurnTexture: WebGLUniformLocation | null;
        DeltaTime: WebGLUniformLocation | null;
        NoiseTextureInterpolator: WebGLUniformLocation | null;
        NoiseTexture: WebGLUniformLocation | null;
    };

    VisualizerFlameColorLUT: WebGLTexture;

    VisualizerImageTexture: WebGLTexture;

    VisualizerAshTexture: WebGLTexture;

    VisualizerAfterBurnNoiseTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, inRenderTargetSize = { x: 512, y: 512 }) {
        this.RenderTargetSize = inRenderTargetSize;

        //FBO
        this.FrameBuffer = [];
        this.FrameBuffer[0] = gl.createFramebuffer();
        this.FrameBuffer[1] = gl.createFramebuffer();

        //Fire Texture
        this.FireTexture = [];
        this.FireTexture[0] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);
        this.FireTexture[1] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);

        //Fire Texture
        this.FuelTexture = [];
        this.FuelTexture[0] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);
        this.FuelTexture[1] = CreateTextureRT(gl, inRenderTargetSize, gl.R16F, gl.RED, gl.HALF_FLOAT);

        //link our RTs to Framebuffers
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[0]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.FireTexture[0], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.FuelTexture[0], 0);

        const drawBuffers = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
        gl.drawBuffers(drawBuffers);

        //Fill Fuel texture with 1.f
        const clearColor1 = new Float32Array([1.0, 1.0, 1.0, 1.0]);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        FrameBufferCheck(gl, "RFirePlanePass");

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.FireTexture[1], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.FuelTexture[1], 0);

        gl.drawBuffers(drawBuffers);
        gl.clearBufferfv(gl.COLOR, 1, clearColor1);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        FrameBufferCheck(gl, "RFirePlanePass");

        this.CurrentFireTextureIndex = 0;
        this.CurrentFuelTextureIndex = 0;

        //========================================================= Apply Fire
        this.PlaneDrawingPass = new RApplyFireRenderPass(gl, null);

        //================================================ Fire Update Shader

        //Create Shader Program
        this.shaderProgramFireUpdate = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceFireUpdatePS,
        );

        //Shader Parameters
        this.UniformParametersLocationListFireUpdate = GetUniformParametersList(gl, this.shaderProgramFireUpdate);

        this.NoiseTexture = CreateTexture(gl, 4, "assets/perlinNoise1024.png");

        this.NoiseTextureInterpolator = 0;

        //================================================ Fire Visualize Shader

        //Create Shader Program
        this.VisualizerShaderProgram = CreateShaderProgramVSPS(
            gl,
            ShaderSourceFullscreenPassVS,
            ShaderSourceFireVisualizerPS,
        );

        //Shader Parameters
        this.VisualizerUniformParametersLocationList = GetUniformParametersList(gl, this.VisualizerShaderProgram);

        this.VisualizerFlameColorLUT = CreateTexture(gl, 4, "assets/flameColorLUT5.png");
        this.VisualizerImageTexture = CreateTexture(gl, 5, "assets/apeBlue.png");
        this.VisualizerAshTexture = CreateTexture(gl, 6, "assets/ashTexture.jpg");
        this.VisualizerAfterBurnNoiseTexture = CreateTexture(gl, 7, "assets/afterBurnNoise2.png");
    }

    bFirstBoot = true;

    ApplyFire(gl: WebGL2RenderingContext, positionOffset: Vector2, sizeScale: number, velDirection: Vector2) {
        const curSourceIndex = this.CurrentFireTextureIndex;
        //Raster particle to current fire texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[curSourceIndex]);
        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);
        this.PlaneDrawingPass.Execute(gl, positionOffset, sizeScale, velDirection);
        if (this.bFirstBoot) {
            gl.clearColor(0.0, 0.0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.bFirstBoot = false;
        }
    }

    UpdateFire(gl: WebGL2RenderingContext) {
        const curSourceIndex = this.CurrentFireTextureIndex;

        gl.viewport(0, 0, this.RenderTargetSize.x, this.RenderTargetSize.y);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FrameBuffer[1 - curSourceIndex]);

        // Set draw buffers
        const drawBuffers = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
        gl.drawBuffers(drawBuffers);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.shaderProgramFireUpdate);

        //Constants
        gl.uniform1f(this.UniformParametersLocationListFireUpdate.DeltaTime, GTime.Delta);

        const NoiseTextureInterpolatorSpeed = 0.25;
        const NoiseTextureInterpolatorMax = 3;
        this.NoiseTextureInterpolator += NoiseTextureInterpolatorSpeed * GTime.Delta;
        this.NoiseTextureInterpolator = this.NoiseTextureInterpolator % NoiseTextureInterpolatorMax;
        gl.uniform1f(
            this.UniformParametersLocationListFireUpdate.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        //Textures
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.FireTexture[curSourceIndex]);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.FireTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.FuelTexture[this.CurrentFuelTextureIndex]);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.FuelTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.NoiseTexture);
        gl.uniform1i(this.UniformParametersLocationListFireUpdate.NoiseTexture, 4);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

        this.CurrentFireTextureIndex = 1 - this.CurrentFireTextureIndex;
        this.CurrentFuelTextureIndex = 1 - this.CurrentFuelTextureIndex;
    }

    VisualizeFire(gl: WebGL2RenderingContext, destFramebuffer: WebGLFramebuffer | null, destSize: Vector2) {
        gl.viewport(0, 0, destSize.x, destSize.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer);

        gl.bindVertexArray(CommonRenderingResources.FullscreenPassVAO);

        gl.useProgram(this.VisualizerShaderProgram);

        //Constants
        gl.uniform1f(
            this.VisualizerUniformParametersLocationList.NoiseTextureInterpolator,
            this.NoiseTextureInterpolator,
        );

        //Textures
        const curSourceIndex = this.CurrentFireTextureIndex;
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, this.FireTexture[curSourceIndex]);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FireTexture, 2);

        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, this.FuelTexture[this.CurrentFuelTextureIndex]);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FuelTexture, 3);

        gl.activeTexture(gl.TEXTURE0 + 4);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerFlameColorLUT);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.FlameColorLUT, 4);

        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerImageTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.ImageTexture, 5);

        gl.activeTexture(gl.TEXTURE0 + 6);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerAshTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.AshTexture, 6);

        gl.activeTexture(gl.TEXTURE0 + 7);
        gl.bindTexture(gl.TEXTURE_2D, this.VisualizerAfterBurnNoiseTexture);
        gl.uniform1i(this.VisualizerUniformParametersLocationList.AfterBurnTexture, 7);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    GetCurFireTexture() {
        return this.FireTexture[this.CurrentFireTextureIndex];
    }
}

const GSettings = {
    bRunSimulation: true,
};

export function RenderMain() {
    const canvas = getCanvas();

    let bMouseDown: boolean;
    canvas.addEventListener("mousedown", () => {
        bMouseDown = true;
    });
    canvas.addEventListener("mouseup", () => {
        bMouseDown = false;
    });

    canvas.addEventListener("touchstart", () => {
        bMouseDown = true;
    });
    canvas.addEventListener("touchend", () => {
        bMouseDown = false;
    });

    // Set the canvas dimensions to maintain a 1:1 aspect ratio
    function resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = size;
        canvas.height = size;

        // You can use the canvas context to draw here if needed
    }

    // Call the resizeCanvas function initially and whenever the window is resized
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    if (!canvas) {
        showError("Canvas Error");
    }

    /**
     * @type {WebGL2RenderingContext}
     */
    //const gl = canvas.getContext("webgl2");
    const gl = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    if (gl === null) {
        showError("WebGL context error");
        throw new Error("WebGL is not defined");
    }

    let ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
        ext = gl.getExtension("EXT_color_buffer_half_float");
        if (!ext) {
            showError("This device doesnt support FLOAT Framebuffers.");
            return;
        }
    }

    AllocateCommonRenderingResources(gl);

    //Create Debug RenderTarget
    const DebugRTSize = { x: 512, y: 512 };
    gl.activeTexture(gl.TEXTURE0 + 1);
    //const DebugRT = CreateTextureRT(gl, DebugRTSize, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    //const DebugRT = CreateTextureRT(gl, DebugRTSize, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    //const DebugRT = CreateTextureRT(gl, DebugRTSize, gl.RGBA16F, gl.RGBA, gl.FLOAT);
    const DebugRT = CreateTextureRT(gl, DebugRTSize, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    const DebugFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, DebugFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, DebugRT, 0);
    FrameBufferCheck(gl, "DebugFBO");

    gl.activeTexture(gl.TEXTURE0 + 1);
    const DebugRT2 = CreateTextureRT(gl, DebugRTSize, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    //const DebugRT2 = CreateTextureRT(gl, DebugRTSize, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    const DebugFBO2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, DebugFBO2);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, DebugRT2, 0);
    FrameBufferCheck(gl, "DebugFBO2");

    //GUI
    if (APP_ENVIRONMENT === "development") {
        DrawUI(GSettings);
    }

    GetMousePosNDC(canvas);

    gl.clearColor(0.05, 0.05, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const PresentPass = new RPresentPass(gl);
    const FirePlanePass = new RFirePlanePass(gl);

    const FlameParticles = new ParticlesEmitter(gl, FlameParticlesDesc);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function RenderLoop() {
        if (gl !== null) {
            UpdateTime();

            if (bMouseDown) {
                const curMouseDir = { x: 0, y: 0 };
                curMouseDir.x = CGConstants.MousePosNDC.x - CGConstants.PrevMousePosNDC.x;
                curMouseDir.y = CGConstants.MousePosNDC.y - CGConstants.PrevMousePosNDC.y;
                const mouseDirLength = MathGetVectorLength(curMouseDir);
                let applierSize;
                if (CGConstants.bMouseMoved == false) {
                    applierSize = 0.005;
                    curMouseDir.x = 0;
                    curMouseDir.y = 1;
                } else {
                    applierSize = MathClamp(mouseDirLength * 0.5, 0.001, 0.05);
                }
                FirePlanePass.ApplyFire(gl, CGConstants.MousePosNDC, applierSize, MathVectorNormalize(curMouseDir));
            }

            FirePlanePass.UpdateFire(gl);

            //PresentPass.Execute(gl, canvas, RFirePlanePass.FireTexture[RFirePlanePass.CurrentFireTextureIndex]);
            //PresentPass.Execute(gl, canvas, RFirePlanePass.FuelTexture[RFirePlanePass.CurrentFuelTextureIndex]);

            FlameParticles.Update(gl, FirePlanePass.GetCurFireTexture()!);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clearColor(0.05, 0.05, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            //PresentPass.Execute(gl, canvas, FirePlanePass.GetCurFireTexture());
            FirePlanePass.VisualizeFire(gl, null, { x: canvas.width, y: canvas.height });

            FlameParticles.Render(gl);

            /* gl.viewport(0, 0, DebugRTSize.x, DebugRTSize.y);
  			gl.bindFramebuffer(gl.FRAMEBUFFER, DebugFBO);
  			gl.clearColor(0.05,0.05,0.1,1.);
  			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  			PlaneDrawingPass.Execute(gl, CGConstants.PosOffset, 0.25);
  			PresentPass.Execute(gl, canvas, DebugRT); */

            CGConstants.bMouseMoved = false;

            if (gl !== null) {
                if (CheckGL(gl) && GSettings.bRunSimulation) {
                    requestAnimationFrame(RenderLoop);
                }
            }
        }

        // }
    }

    if (gl !== null) {
        RenderLoop();
    }
}

try {
    RenderMain();
} catch (e) {
    showError(`JS Exception: ${e}`);
}
