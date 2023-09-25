import { getWebGLProgram } from "./helpers/getWebGLProgram";
import { showError } from "./utils";

export function CreateShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const compileError = gl.getShaderInfoLog(shader);
        showError(`Failed to COMPILE shader - ${compileError}`);
        gl.deleteShader(shader);

        throw new Error("Error during shader creation");
    }
    {
        return shader;
    }
}

export function LinkShaderProgramVSPS(
    gl: WebGL2RenderingContext,
    shaderVS: WebGLShader,
    shaderPS: WebGLShader,
): WebGLProgram {
    const shaderProgram = getWebGLProgram(gl);
    gl.attachShader(shaderProgram, shaderVS);
    gl.attachShader(shaderProgram, shaderPS);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        const linkError = gl.getProgramInfoLog(shaderProgram);
        showError(`Failed to LINK shaders - ${linkError}`);
        gl.deleteProgram(shaderProgram);
        throw new Error("Error during shader creation");
    } else {
        return shaderProgram;
    }
}

export function CreateShaderProgramVSPS(gl: WebGL2RenderingContext, shaderSourceVS: string, shaderSourcePS: string) {
    //Compile VS
    const shaderVS = CreateShader(gl, gl.VERTEX_SHADER, shaderSourceVS);

    //Compile PS
    const shaderPS = CreateShader(gl, gl.FRAGMENT_SHADER, shaderSourcePS);

    //Create Shader Program
    const shaderProgram = LinkShaderProgramVSPS(gl, shaderVS, shaderPS);

    gl.detachShader(shaderProgram, shaderVS);
    gl.detachShader(shaderProgram, shaderPS);
    gl.deleteShader(shaderVS);
    gl.deleteShader(shaderPS);

    return shaderProgram;
}

export function CheckGL(gl: WebGL2RenderingContext) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        showError("WebGL error: " + error);
        return false;
    }
    return true;
}
