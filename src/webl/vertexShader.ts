import { initShader } from "./initShader";

// Vertex shader
export const vertexShader = (gl: WebGL2RenderingContext) =>
  initShader(
    gl,
    "VERTEX_SHADER",
    `
    attribute vec4 a_position;

    void main() {
      gl_Position = a_position;
    }
  `,
  );
