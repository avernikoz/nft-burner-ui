import { Vector3 } from "../types";

export function GLSetVec3(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, vec: Vector3) {
    gl.uniform3f(location, vec.x, vec.y, vec.z);
}

export function GLSetTexture(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    resource: WebGLTexture | null,
    index: number,
) {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, resource);
    gl.uniform1i(location, index);
}
