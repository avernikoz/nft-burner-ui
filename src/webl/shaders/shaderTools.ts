export function GetShaderSourceSingleFlameRenderVS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	
	layout(location = 0) in vec2 VertexBuffer;
	layout(location = 1) in vec2 TexCoordsBuffer;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform float Time;
	uniform vec3 Position;
	uniform vec2 Velocity;
	uniform vec2 FadeInOutParameters;
	

	out vec2 vsOutTexCoords;
	flat out float interpolatorFrameIndex;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	float bellFunction(float x) {
		// Adjust the parameters for the desired shape of the bump
		float peakValue = 1.0;  // Peak value of the bump
		float center = 0.5;     // Center of the bump
		float width = 0.2;      // Width of the bump
	
		// Gaussian function formula
		float exponent = -((x - center) * (x - center)) / (2.0 * width * width);
		float result = peakValue * exp(exponent);
	
		return result;
	}

	void main()
	{
		vec2 uv = TexCoordsBuffer.xy; // Convert to [0, 1] range
		uv.y = 1.f - uv.y;
		vsOutTexCoords = uv;

		vec3 pos = vec3(VertexBuffer.xy, 0.0f);
		pos.y += 0.525;
		pos.xy *= vec2(0.2, 1.0);
		pos.xy *= 0.4;
		pos.y *= 1.4;
		pos.x -= Velocity.x * TexCoordsBuffer.y * TexCoordsBuffer.y * 30.f;
		if(Velocity.y > 0.0)
		{
			//shrink
			pos.y *= 1.f - clamp(Velocity.y * 50.0, 0.0, 1.0);
		}
		else
		{
			//stretch
			pos.y *= 1.f + abs(Velocity.y) * 30.0;
		}
		if(abs(Velocity.x) > 0.0)
		{
			//shrink
			pos.y *= 1.f - clamp(abs(Velocity.x) * 35.0, 0.0, 1.0);
		}

		if(FadeInOutParameters.x < 1.0)
		{
			//fade in
			pos.y *= FadeInOutParameters.x + bellFunction(FadeInOutParameters.x) * 0.75;
			//pos.y += bellFunction(FadeInOutParameters.x) * 0.05;
		}

		pos.y += sin(Time) * 0.01;

		pos.xy /= (1.f - CameraDesc.z);
		pos.xy *= CameraDesc.w;
		pos.xy += Position.xy;
		//pos.z -= CameraDesc.z;
		
		pos.x /= ScreenRatio;
		//pos.xy *= CameraDesc.w;

		gl_Position = vec4(pos.xy, 0.0, 1.0);
		
	}`;
}

export function GetShaderSourceAnimatedSpriteRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 outColor;

	uniform float AnimationFrameIndex;
	uniform float Time;
	uniform vec2 FadeInOutParameters;

	uniform sampler2D ColorTexture;
	uniform sampler2D LUTTexture;

	in vec2 vsOutTexCoords;

	float CircularFadeIn(float x) 
	{
	  float y = 1.f - sqrt(1.f - x * x);
	  return y;
	}

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{

		//outColor = vec4(vsOutTexCoords.yyy, 1.0); return;

		vec4 colorFinal = vec4(1.0);
	#if 1
		const vec2 FlipbookSizeRC = vec2(16.0, 4.0);
		{
			vec2 frameSize = 1.f / (FlipbookSizeRC);
			vec2 uv = vsOutTexCoords * frameSize;

			uint flipBookIndex1D = uint(floor(AnimationFrameIndex));
			uvec2 FlipBookIndex2D;
			FlipBookIndex2D.x = (flipBookIndex1D % uint(FlipbookSizeRC.x));
			FlipBookIndex2D.y = (flipBookIndex1D / uint(FlipbookSizeRC.x));

			uv.x += (frameSize.x * float(FlipBookIndex2D.x));
			uv.y += (frameSize.y * float(FlipBookIndex2D.y));
			
			colorFinal = texture(ColorTexture, uv).rgba;
		}
		

		#if 1 //ARTIFICIAL COLOR
		float interpolatorAge = 0.5;
		float lutSamplingU = 1.f - vsOutTexCoords.y;
		//lutSamplingU *= clamp((1.f - interpolatorAge), 0.25, 0.75f);
		//lutSamplingU *= 0.1f;
		float lutSamplingScaleParam = MapToRange((sin(Time * 0.13) + 1.0) * 0.5, 0.0, 1.0, 0.2, 0.5);
		lutSamplingU *= lutSamplingScaleParam;
		vec3 flameColor = texture(LUTTexture, vec2(lutSamplingU, 0.5)).rgb;
		//flameColor = vec3(0., 0.f, 1.0);
		flameColor = mix(flameColor, vec3(0., 0.f, 1.0), (sin(Time * 0.07) + 1.0) * 0.5);

		/* float colorMixParam = vsOutTexCoords.y;
		colorMixParam = min(1.0, pow(colorMixParam, 8.f));
		colorMixParam = min(1.f, colorMixParam + (sin(0.1 + Time * 0.77) + 1.0) * 0.5 * 0.25); */

		//colorFinal.rgb = vec3(1.0, 0.5f, 0.0) * colorFinal.a * 2.f;
		//colorFinal.rgb = mix(colorFinal.rgb, vec3(1.0, 1.0f, 0.0) * colorFinal.a, 0.25);
		//colorFinal.rgb = mix(colorFinal.rgb, colorFinal.a * flameColor * 10.0f, colorMixParam);
		
		float fadeParam = MapToRange((sin(0.1 + Time * 0.77) + 1.0) * 0.5, 0.0, 1.0, 0.5, 0.8);
		if(vsOutTexCoords.y > fadeParam)
		{	
			float m = MapToRange(vsOutTexCoords.y, fadeParam, 1.0, 0.0, 1.0);
			colorFinal.rgb = mix(colorFinal.rgb, colorFinal.a * flameColor * 10.0f, m);
		}
		

		//colorFinal.rgb *= (vsOutTexCoords.y * vsOutTexCoords.y) * 2.5f;
		float brightFade = 0.5;
		if(vsOutTexCoords.y < brightFade)
		{
			float m = MapToRange(vsOutTexCoords.y, brightFade, 0.0, 1.0, 0.0);
			colorFinal.rgb *= m * m * m;

		}

		/* float xFade = 0.75;
		if(vsOutTexCoords.y < xFade)
		{
			float m = clamp(MapToRange(vsOutTexCoords.y, xFade, 0.5, 1.0, 0.0), 0.0, 1.0);

			//colorFinal.rgb *= smoothstep(0.0, 1.0, m);

			float s = abs(MapToRange(vsOutTexCoords.x, 0.0, 1.0, -1.0, 1.0));
			s = 1.f - s;
			s *= s;
			s = min(1.0, s + sqrt(m));
			if(s < 0.1)
			{
				s = 0.0;
			}
			colorFinal.rgb *= s* s;

		} */

		//TODO: Do on CPU
		//float brightnessParam = MapToRange((sin(1.7 + Time * 0.11) + 1.0) * 0.5, 0.0, 1.0, 1.25, 1.75);
		float redScaleParam = MapToRange((sin(0.03 + Time * 0.19) + 1.0) * 0.5, 0.0, 1.0, 0.75, 1.0);
		colorFinal.rgb *= MapToRange(redScaleParam, 0.75, 1.0, 1.6, 1.25);
		colorFinal.r *= redScaleParam;

	  	#endif////ARTIFICIAL COLOR

	  #endif

		if(FadeInOutParameters.y < 1.0)
		{
			float fadeThres = FadeInOutParameters.y;
			if(vsOutTexCoords.y > fadeThres)
			{
				float m = MapToRange(vsOutTexCoords.y, fadeThres, fadeThres + 0.1, 1.0, 0.);
				colorFinal.rgb *= m * m * m;

			}
		}

		outColor = colorFinal;
	}`;
}
