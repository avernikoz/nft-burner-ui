export function GetShaderSourceUISpriteRenderVS() {
    return /* glsl */ `#version 300 es
	
			precision highp float;
		
			layout(location = 0) in vec2 VertexBuffer;
	
			uniform float ScreenRatio;
			uniform float Size;
			uniform vec2 Position;
		
			out vec2 vsOutTexCoords;
		
			void main()
			{
				vec2 pos = VertexBuffer.xy;
				pos.xy *= Size * 1.0;
				pos.xy += Position.xy;
	
				pos.x /= ScreenRatio;
	
				gl_Position = vec4(pos.xy, 0.0, 1.0);
				vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
			}`;
}
export function GetShaderSourceUISpriteRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 outSpriteColor;

	uniform sampler2D ColorTexture;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		float color = texture(ColorTexture, flippedUVs.xy).r;


		outSpriteColor = vec4(vec3(color * 1.0f), 1.0);

	}`;
}
