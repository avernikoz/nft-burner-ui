//Shared Resources that might be used among other Passes
export const CommonRenderingResources: {
    FullscreenPassVertexBufferGPU: null | WebGLBuffer;
    FullscreenPassVAO: null | WebGLVertexArrayObject;

    PlaneShapeVertexBufferGPU: null | WebGLBuffer;
    PlaneShapeTexCoordsBufferGPU: null | WebGLBuffer;
    PlaneShapeVAO: null | WebGLVertexArrayObject;
} = {
    //Fullscreen Triangle
    FullscreenPassVertexBufferGPU: null,
    FullscreenPassVAO: null,

    //2D plane
    PlaneShapeVertexBufferGPU: null,
    PlaneShapeTexCoordsBufferGPU: null,
    PlaneShapeVAO: null,
};
