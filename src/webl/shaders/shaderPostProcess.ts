import { SceneDesc } from "../scene";

export const ShaderSourceFullscreenPassVS = /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;

	out vec2 vsOutTexCoords;

	void main()
	{
		gl_Position = vec4(VertexBuffer.xy, 0.0, 1.0);
		vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
	}`;
export const ShaderSourcePresentPassPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform highp sampler2D SourceTexture;
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

	uniform highp sampler2D SourceTexture;

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

	uniform highp sampler2D SourceTexture;

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

	uniform highp sampler2D FlameTexture;
	uniform highp sampler2D FirePlaneTexture;
	uniform float MipLevel;

	in vec2 vsOutTexCoords;

	void main()
	{
		const float Threshold = 0.5f;
		vec2 texCoords = vsOutTexCoords;
		vec4 flame = textureLod(FlameTexture, texCoords.xy, MipLevel);
		vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, MipLevel);
		vec4 Color = vec4(max(flame.rgb, firePlane.rgb).rgb, 1.f);
		//vec4 Color = firePlane;
		//Color.rgb = flame.rgb;
		//float brightness = dot(Color.rgb, vec3( 0.299f, 0.587f, 0.114f ));
		float brightness = dot(Color.rgb, vec3( 0.33f, 0.33f, 0.33f ));
		if(brightness > Threshold)
		{
			//Color.r *= 1.5f;
			OutColor = Color;
		}
		else
		{
			OutColor = vec4(0.f, 0.f, 0.f, 1.f);
		}
		
	}`;

export function GetShaderSourceFlamePostProcessPS() {
    const SizeScale = SceneDesc.FirePlaneSizeScaleNDC;
    const ViewSize = SceneDesc.ViewRatioXY;
    return (
        /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out vec4 OutColor;

	uniform float Time;

	uniform highp sampler2D FlameTexture;
	uniform highp sampler2D NoiseTexture;
	uniform highp sampler2D FlameNoiseTexture;
	uniform highp sampler2D FlameNoiseTexture2;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		const float kSizeScale = float(` +
        SizeScale +
        /* glsl */ `);
			const vec2 kViewSize = vec2(float(` +
        ViewSize.x +
        /* glsl */ `), float(` +
        ViewSize.y +
        /* glsl */ `));
		
		vec2 flameNoiseUV = vsOutTexCoords;
		vec2 flameSamplingUV = flameNoiseUV;
		
		float t = mod(Time, 10.0) / 5.f;
		t = clamp(t, 0.f, 2.f);
		const float distUVStartScale = 0.025f;
		const float distUVEndScale = 0.1f;
		if(t < 1.f)
		{
			flameSamplingUV *= mix(distUVStartScale, distUVEndScale, smoothstep(0.f, 1.f, t));
		}
		else
		{
			flameSamplingUV *= mix(distUVEndScale, distUVStartScale, smoothstep(0.f, 1.f, t - 1.f));
		}

		flameSamplingUV.y -= Time * 0.013;
		flameSamplingUV.x += Time * 0.003;

		//flameSamplingUV *= (2.0 - kSizeScale);
		flameSamplingUV *= kViewSize;
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

		flameSamplingUV.x -= (0.5 - vsOutTexCoords.x) * 0.1 * (vsOutTexCoords.y * vsOutTexCoords.y); 

		flameNoiseUV = flameSamplingUV;

		//float4 flame = FlameTextureSRV[SampleCoord];
		vec4 flame = textureLod(FlameTexture, flameSamplingUV.xy, 0.f);

		//Pre-Translate Scale
		flameNoiseUV *= 0.9f;
		flameNoiseUV.x *= 4.f;

		flameNoiseUV *= (2.0 - kSizeScale);
		flameNoiseUV *= kViewSize;

		//Translate
		const float flameSpeed = 0.85f; //TODO: USE VARYING SPEED [0.25,0.75]
		flameNoiseUV.y -= Time * flameSpeed;
		flameNoiseUV.x += Time * 0.05f;

		//Post-Translate Scale
		flameNoiseUV *= 0.2f;

		flameNoiseUV.x += distortionNoise.r * 0.0095f;
		flameNoiseUV.y -= distortionNoise.g * 0.0055f;

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
	}`
    );
}

export function GetShaderSourceCombinerPassPS() {
    const SizeScale = SceneDesc.FirePlaneSizeScaleNDC;
    const ViewSize = SceneDesc.ViewRatioXY;
    return (
        /* glsl */ `#version 300 es
	
		precision highp float;
		precision highp sampler2D;
	
		out vec4 OutColor;
	
		uniform float Time;
	
		uniform highp sampler2D FlameTexture;
		uniform highp sampler2D FirePlaneTexture;
		uniform highp sampler2D BloomTexture;
		uniform highp sampler2D SmokeTexture;
		uniform highp sampler2D NoiseTexture;
		uniform highp sampler2D SpotlightTexture;
		uniform highp sampler2D SmokeNoiseTexture;
		uniform highp sampler2D PointLightsTexture;
		uniform highp sampler2D LogoImageTexture;
		uniform highp sampler2D LensTexture;
	
		in vec2 vsOutTexCoords;

		float MapToRange(float t, float t0, float t1, float newt0, float newt1)
		{
			///Translate to origin, scale by ranges ratio, translate to new position
			return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
		}
	
		void main()
		{
			const float kSizeScale = float(` +
        SizeScale +
        /* glsl */ `);
			const vec2 kViewSize = vec2(float(` +
        ViewSize.x +
        /* glsl */ `), float(` +
        ViewSize.y +
        /* glsl */ `));

			vec2 texCoords = vsOutTexCoords;
			vec3 flame = textureLod(FlameTexture, texCoords.xy, 0.f).rgb;
			flame.rgb *= 1.1f;
	
		#if 1//heat distortion
			vec2 distortionUV = vsOutTexCoords;
			distortionUV.y -= Time * 0.25;
			distortionUV.x *= 2.5;
			distortionUV.y *= 0.5;
			distortionUV *= 0.4f;
			distortionUV *= (2.0 - kSizeScale);
			distortionUV *= kViewSize;
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
			vec3 heat = textureLod(FlameTexture, (texCoords - vec2(0.f, (0.25f * kSizeScale) / kViewSize.y )), 0.f).rgb;
			distortionNoise.x *= 0.0025;
			distortionNoise.y *= 0.001;
			//distortionNoise *= 0.5f;
			distortionNoise *= 10.f;
			distortionNoise *= clamp(dot(heat.rgb, vec3(0.333f)), 0.f, 1.f);
			//OutColor = vec4(distortionNoise.rg, 0.f, 1.f); return;
			distortionUV.x += distortionNoise.r;
			distortionUV.y += distortionNoise.g;
			vec3 firePlane = textureLod(FirePlaneTexture, distortionUV.xy, 0.f).rgb;
		#else
			vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, 0.f);
			#endif
			
			vec3 bloom = textureLod(BloomTexture, texCoords.xy, 0.f).rgb;

			float pointLights = textureLod(PointLightsTexture, texCoords.xy, 0.f).r; 

			float light = textureLod(SpotlightTexture, vec2(texCoords.x, 1.f - texCoords.y), 0.f).r;

			#if 1
			float time = mod(Time, 12.4f);
			if(time < 1.3f)
			{
				vec2 lightFlickerUV;
				lightFlickerUV.y = 0.1f;
				//const float flickScale = 0.2f;
				//const float flickScale = 0.02f;
				float flickScale = mix(0.01, 0.2, mod(Time, 20.f) * 0.05);
				lightFlickerUV.x = Time * flickScale;
				float flickerNoise = textureLod(NoiseTexture, lightFlickerUV.xy, 0.f).r;
				flickerNoise = min(1.0, flickerNoise + 0.35f);
				/* if(flickerNoise > 0.5)
				{
					flickerNoise = 1.f;
				}
				else
				{
					flickerNoise = 0.0f;
				} */
				light *= clamp(abs(flickerNoise) , 0.0, 1.0);
			}
			#endif
			
			vec4 smoke = textureLod(SmokeTexture, texCoords.xy, 0.f);

			vec2 noiseUV = texCoords;
			noiseUV *= (2.0 - kSizeScale);
			noiseUV *= kViewSize;
			noiseUV.x -= Time * 0.0043f;
			noiseUV.y -= Time * 0.0093f;
			vec4 smokeNoise = textureLod(SmokeNoiseTexture, noiseUV, 0.f);
			float smokeNoiseChannel = 1.f;
			{
				float tx = mod(Time, 9.f) / 3.f;
				if(tx < 1.f)
				{
					smokeNoise.r = mix(smokeNoise.r, smokeNoise.g, tx);
				}
				else if(tx < 2.f)
				{
					smokeNoise.r = mix(smokeNoise.g, smokeNoise.b, smoothstep(0.f, 1.f, tx - 1.f));
				}
				else
				{
					smokeNoise.r = mix(smokeNoise.b, smokeNoise.r, smoothstep(0.f, 1.f, tx - 2.f));
				}
			}

			//smoke = max(smoke, vec4(vec3(smokeNoise.r), 1.f));
			smokeNoise.r *= min(1.f, texCoords.y + 0.3f);
			smoke.rgba = smoke.rgba * 1.f + vec4(vec3(smokeNoise.r) * 0.15, smokeNoise.r * 0.15) * clamp(1.f - smoke.a, 0.0, 1.f);

			smoke.rgb *= 0.75f;

			//light
			smoke.rgb *= 0.25f;

			const float BloomStrength = 5.0f;
			const vec2 SmokeBloomColorClampMinMax = vec2(0.15, 1.f);
			const vec2 SmokeBloomAlphaClampMinMax = vec2(0.f, 1.f);
			vec3 smokeLightFromBloom = bloom.rgb
			* BloomStrength
			* clamp(1.f + clamp(smoke.r, SmokeBloomColorClampMinMax.x, SmokeBloomColorClampMinMax.y) - clamp(smoke.a, SmokeBloomAlphaClampMinMax.x, SmokeBloomAlphaClampMinMax.y), 0.f, 1.f) * clamp(smoke.a, 0.f, 1.f)
			;

			const float SmokeSpotlightStrength = 1.0f;
			float smokeLightFromSpotlight = min(1.f, light + 0.05)
			* SmokeSpotlightStrength
			* clamp(1.f + clamp(smoke.r, SmokeBloomColorClampMinMax.x, SmokeBloomColorClampMinMax.y) - clamp(smoke.a, SmokeBloomAlphaClampMinMax.x, SmokeBloomAlphaClampMinMax.y), 0.f, 1.f) * clamp(smoke.a, 0.f, 1.f)
			;


			float smokeLightFromPointLights = pointLights * 3.5f
			* clamp(1.f + clamp(smoke.r, SmokeBloomColorClampMinMax.x, SmokeBloomColorClampMinMax.y) - clamp(smoke.a, SmokeBloomAlphaClampMinMax.x, SmokeBloomAlphaClampMinMax.y), 0.f, 1.f) * clamp(smoke.a, 0.f, 1.f)
			;

			smoke.rgb += max(smokeLightFromBloom, smokeLightFromSpotlight);
			smoke.rgb += smokeLightFromPointLights * vec3(1.f, 0.4f, 0.1f);


			smoke.a *= 0.85f;
			smoke.rgb *= 0.85f;

			float smokeScale = 1.f;
			//smokeScale *= (texCoords.y * kViewSize.y * (kSizeScale));
			smokeScale *= clamp(length((texCoords.xy * kViewSize.xy * (2.0 - kSizeScale)) - vec2(0.5) * kViewSize.xy * (2.0 - kSizeScale)), 0.f, 1.f);
			smokeScale *= 2.0f;
			smokeScale = min(1.5f, smokeScale);

			smoke.a *= smokeScale;
			smoke.rgb *= clamp(smokeScale, 0.5f, 1.f);

			//lit plane with spotlight
			if(firePlane.r < 1.0)
			{
				const float ambientLight = 0.15f;
				firePlane.rgb *= min(1.f, light + ambientLight);
			}

			firePlane.rgb = smoke.rgb * 1.f + firePlane.rgb * clamp(1.f - smoke.a, 0.0, 1.f);

			highp vec3 final = firePlane.rgb;
			const float bloomStrengthPlane = 0.75f;
			final = max(firePlane.rgb, bloom.rgb * bloomStrengthPlane);
			final = max(final, flame.rgb);

			vec2 lensUV = texCoords.xy;
			if(kViewSize.y > 1.f)
			{
				const float xScale = 0.75f; //TODO: Startup random
				lensUV = vec2(-texCoords.y, texCoords.x) * vec2(1.0, xScale);
			}
			vec4 lensDirt = textureLod(LensTexture, lensUV, 0.f);
			final.rgb += (bloom.rgb + pointLights) * lensDirt.rgb * 2.0f;
			//final.rgb = lensDirt.rgb;
			//final = bloom.rgb;

			const float exposure = 1.f;
			final.rgb *= exposure;

			if(texCoords.x <= 0.2 && texCoords.y <= 0.1)
			{
				vec2 logoUV;
				logoUV.x = MapToRange(texCoords.x, 0.2, 0.01, 0.f, 1.f);
				logoUV.x = 1.f - logoUV.x;	
				logoUV.y = MapToRange(texCoords.y, 0.1, 0.00, 0.f, 1.f);

				logoUV *= kViewSize;
				if(logoUV.x >= 0.f && logoUV.x <= 1.f && logoUV.y >= 0.f && logoUV.y <= 1.f)
				{
					vec4 logo = textureLod(LogoImageTexture, logoUV.xy, 0.f);
					final.rgb = logo.rgb * logo.a + final.rgb * clamp(1.f - logo.a, 0.0, 1.f);
				}
				
			}

			//final.rgb = pow(final.rgb, vec3(1.f/2.2f));

			OutColor = vec4(final.rgb, 1);
		}`
    );
}