// A user-defined function to create and compile shaders
export const initShader = (gl: WebGL2RenderingContext, type: "VERTEX_SHADER" | "FRAGMENT_SHADER", source: string) => {
  const shader = gl.createShader(gl[type]);

  if (!shader) {
    throw new Error("Unable to create a shader.");
  }

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};
