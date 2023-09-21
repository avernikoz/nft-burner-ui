export const getWebGLProgram = (gl: WebGL2RenderingContext) => {
  const shaderProgram = gl.createProgram();

  if (shaderProgram === null) {
    throw new Error("Shader program is null");
  }

  return shaderProgram;
};
