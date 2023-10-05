export const ShaderSourcePresentPassPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform sampler2D SourceTexture;
	uniform float MipLevel;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		vec4 Color = textureLod(SourceTexture, texCoords.xy, MipLevel);
		OutColor = Color;
	}`;
export const ShaderSourceBlurPassHorizontalPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform sampler2D SourceTexture;

	uniform float MipLevel;
	uniform vec2 TextureSize;

	in vec2 vsOutTexCoords;

	// The guassian blur weights (derived from Pascal's triangle)
	//const float Weights[5] = float[](0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625);
	const float Weights[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		vec2 texelSize = 1.f / (TextureSize);
		vec4 result = textureLod(SourceTexture, texCoords, MipLevel) * Weights[0];
		for(int i = 1; i < 5; ++i)
        {
            result += textureLod(SourceTexture, texCoords + vec2(texelSize.x * float(i), 0.0), MipLevel).rgba * Weights[i];
            result += textureLod(SourceTexture, texCoords - vec2(texelSize.x * float(i), 0.0), MipLevel).rgba * Weights[i];
        }
		OutColor = result;
	}`;

export const ShaderSourceBlurPassVerticalPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform sampler2D SourceTexture;

	uniform float MipLevel;
	uniform vec2 TextureSize;

	in vec2 vsOutTexCoords;

	// The guassian blur weights (derived from Pascal's triangle)
	//const float Weights[5] = float[](0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625);
	const float Weights[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		vec2 texelSize = 1.f / (TextureSize);
		vec4 result = textureLod(SourceTexture, texCoords, MipLevel) * Weights[0];
		for(int i = 1; i < 5; ++i)
        {
            result += textureLod(SourceTexture, texCoords + vec2(0.f, texelSize.y * float(i)), MipLevel).rgba * Weights[i];
            result += textureLod(SourceTexture, texCoords - vec2(0.f, texelSize.y * float(i)), MipLevel).rgba * Weights[i];
        }
		OutColor = result;
	}`;

export const ShaderSourceBloomPrePassPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform sampler2D FlameTexture;
	uniform sampler2D FirePlaneTexture;
	uniform float MipLevel;

	in vec2 vsOutTexCoords;

	void main()
	{
		const float Threshold = 0.9f;
		vec2 texCoords = vsOutTexCoords;
		vec4 flame = textureLod(FlameTexture, texCoords.xy, MipLevel);
		vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, MipLevel);
		vec4 Color = vec4(max(flame.rgb, firePlane.rgb).rgb, 1.f);
		//vec4 Color = firePlane;
		float brightness = dot(Color.rgb, vec3( 0.299f, 0.587f, 0.114f ));
		if(brightness > 0.75f)
		{
			//Color.r *= 1.5f;
			OutColor = Color;
		}
		else
		{
			OutColor = vec4(0.f, 0.f, 0.f, 1.f);
		}
		
	}`;

export const ShaderSourceCombinerPassPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform float Time;

	uniform sampler2D FlameTexture;
	uniform sampler2D FirePlaneTexture;
	uniform sampler2D BloomTexture;
	uniform sampler2D NoiseTexture;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		vec4 flame = textureLod(FlameTexture, texCoords.xy, 0.f);
		flame.rgb *= 1.1f;

	#if 1//heat distortion
		vec2 distortionUV = vsOutTexCoords;
		distortionUV.y += Time * 0.25;
		distortionUV.x *= 2.5;
		distortionUV.y *= 0.5;
		distortionUV *= 0.4f;
		vec3 distortionNoise = textureLod(NoiseTexture, distortionUV.xy, 0.f).rgb;
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		distortionUV = vsOutTexCoords;
		float t = mod(Time, 2.f);
		if(t < 1.f)
		{
			distortionNoise.r = mix(distortionNoise.r, distortionNoise.g, t);
		}
		else
		{
			distortionNoise.r = mix(distortionNoise.g, distortionNoise.r, t - 1.f);
		}
		vec4 heat = textureLod(FlameTexture, (texCoords - vec2(0.f, 0.2)), 0.f);
		distortionNoise.x *= 0.0025;
		distortionNoise.y *= 0.001;
		//distortionNoise *= 0.5f;
		distortionNoise *= 5.f;
		distortionNoise *= clamp(dot(heat.rgb, vec3(0.333f)), 0.f, 1.f);
		//OutColor = vec4(distortionNoise.rg, 0.f, 1.f); return;
		distortionUV.x += distortionNoise.r;
		distortionUV.y += distortionNoise.g;
		vec4 firePlane = textureLod(FirePlaneTexture, distortionUV.xy, 0.f);
	#else
		vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, 0.f);
	#endif

		
		vec4 bloom = textureLod(BloomTexture, texCoords.xy, 0.f);
		bloom.rgb *= 0.75f;
		vec3 final = max(firePlane.rgb, bloom.rgb);
		final = max(final, flame.rgb);
		//vec4 final = bloom;

		const float exposure = 1.f;
		final.rgb *= exposure;
		OutColor = vec4(final.rgb, 1);
	}`;

export const ShaderSourceFlamePostProcessPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform float Time;

	uniform sampler2D FlameTexture;
	uniform sampler2D NoiseTexture;
	uniform sampler2D FlameNoiseTexture;
	uniform sampler2D FlameNoiseTexture2;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 flameNoiseUV = vsOutTexCoords;

		vec2 flameSamplingUV = flameNoiseUV;
		flameSamplingUV.y -= Time * 0.13;
		flameSamplingUV.x += Time * 0.003;
		float t = mod(Time, 10.0) * 0.2;
		const float distUVStartScale = 0.025f;
		const float distUVEndScale = 0.05f;
		if(t < 1.f)
		{
			flameSamplingUV *= mix(distUVStartScale, distUVEndScale, t);
		}
		else
		{
			flameSamplingUV *= mix(distUVEndScale, distUVStartScale, t - 1.f);
		}
		//flameSamplingUV *= 0.05;
		vec3 distortionNoise = textureLod(NoiseTexture, flameSamplingUV.xy, 0.f).rgb;
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		flameSamplingUV = flameNoiseUV;

		t = mod(Time, 2.f);
		if(t < 1.f)
		{
			distortionNoise.r = mix(distortionNoise.r, distortionNoise.g, t);
		}
		else
		{
			distortionNoise.r = mix(distortionNoise.g, distortionNoise.r, t - 1.f);
		}

		//OutColor = vec4(distortionNoise.r, distortionNoise.r,distortionNoise.r, 1.0);return;

		distortionNoise *= 2.5f;
		flameSamplingUV.x += distortionNoise.r * 0.0075;
		flameSamplingUV.y += distortionNoise.g * 0.001;

		flameNoiseUV = flameSamplingUV;

		//float4 flame = FlameTextureSRV[SampleCoord];
		vec4 flame = textureLod(FlameTexture, flameSamplingUV.xy, 0.f);

		//Pre-Translate Scale
		flameNoiseUV *= 0.9f;
		flameNoiseUV.x *= 5.f;

		//Translate
		const float flameSpeed = 0.85f; //TODO: USE VARYING SPEED [0.25,0.75]
		flameNoiseUV.y -= Time * flameSpeed;
		flameNoiseUV.x += Time * 0.05f;

		//Post-Translate Scale
		flameNoiseUV *= 0.2f;

		flameNoiseUV.x += distortionNoise.r * 0.0075f;

		vec2 flameNoise2;
		flameNoise2.r = textureLod(FlameNoiseTexture, flameNoiseUV.xy, 0.f).r;
		flameNoise2.g = textureLod(FlameNoiseTexture2, flameNoiseUV.xy, 0.f).r;

		float flameNoise;
		if(t < 1.f)
		{
			flameNoise = mix(flameNoise2.r, flameNoise2.g, t);
		}
		else
		{
			flameNoise = mix(flameNoise2.g, flameNoise2.r, t - 1.f);
		}

		
		//OutColor = vec4(flameNoise, flameNoise,flameNoise, 1.0);return;
  
		flameNoise = 1.f - flameNoise;

		flame.rgb *= flameNoise * 1.f;

		OutColor = flame;
	}`;
