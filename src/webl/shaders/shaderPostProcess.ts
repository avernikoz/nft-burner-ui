import { GScreenDesc } from "../scene";
import { Vector3 } from "../types";
import { MathLerp } from "../utils";

export function scSpotlightFlicker() {
    return /* glsl */ `
	float time = mod(Time, 12.4f);
	if(time < 1.15f)
	{
		vec2 lightFlickerUV;
		lightFlickerUV.y = Time * 0.001f;
		float flickScale = 0.02;
		lightFlickerUV.x = Time * flickScale;
		float flickerNoise = textureLod(NoiseTexture, lightFlickerUV.xy, 0.f).r;
		flickerNoise = MapToRange(flickerNoise, 0.2, 0.8, 0.0, 1.0);
		flickerNoise = min(1.0, flickerNoise + 0.4f);
		if(flickerNoise < 0.75)
		{
			flickerNoise *= 0.5f;
		}
		light *= clamp(abs(flickerNoise) , 0.0, 1.0);
	}`;
}

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
	precision mediump sampler2D;

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
	
	precision mediump float;
	precision mediump sampler2D;

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
		vec4 result = textureLod(SourceTexture, texCoords, 0.0) * Weights[0];
		for(int i = 1; i < 5; ++i)
        {
            result += textureLod(SourceTexture, texCoords + vec2(texelSize.x * float(i), 0.0), MipLevel).rgba * Weights[i];
            result += textureLod(SourceTexture, texCoords - vec2(texelSize.x * float(i), 0.0), MipLevel).rgba * Weights[i];
        }
		OutColor = result;
	}`;

export const ShaderSourceBlurPassVerticalPS = /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

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
		vec4 result = textureLod(SourceTexture, texCoords, 0.0) * Weights[0];
		for(int i = 1; i < 5; ++i)
        {
            result += textureLod(SourceTexture, texCoords + vec2(0.f, texelSize.y * float(i)), MipLevel).rgba * Weights[i];
            result += textureLod(SourceTexture, texCoords - vec2(0.f, texelSize.y * float(i)), MipLevel).rgba * Weights[i];
        }
		OutColor = result;
	}`;

export const ShaderSourceBloomPrePassPS = /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	out vec3 OutColor;

	uniform sampler2D FlameTexture;
	uniform sampler2D FirePlaneTexture;
	uniform sampler2D SpotlightTexture;
	uniform float MipLevel;

	in vec2 vsOutTexCoords;

	void main()
	{
		const float Threshold = 0.5f;
		vec2 texCoords = vsOutTexCoords;
		vec4 flame = textureLod(FlameTexture, texCoords.xy, MipLevel);
		vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, MipLevel);

		vec3 Color = vec3(max(flame.rgb * 1.25f, firePlane.rgb).rgb);
		float brightness = dot(Color.rgb, vec3( 0.33f, 0.33f, 0.33f ));
		if(brightness > Threshold)
		{
			//Color.r *= 1.5f;
			OutColor = Color;
		}
		else
		{
			OutColor = vec3(0.f, 0.f, 0.f);
		}
		
	}`;

export const ShaderSourceBloomDownsampleFirstPassPS =
    /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	out vec3 OutColor;

	uniform sampler2D FlameTexture;
	uniform sampler2D FirePlaneTexture;
	uniform vec2 DestTexelSize;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoord = vsOutTexCoords;
		vec2 srcTexelSize = DestTexelSize * 0.5;

	#if 1//HQ Downsample
		float x = srcTexelSize.x;
		float y = srcTexelSize.y;

		vec3 a = textureLod(FlameTexture, vec2(texCoord.x - 2.0*x, texCoord.y + 2.0*y), 0.0).rgb;
		vec3 b = textureLod(FlameTexture, vec2(texCoord.x,       texCoord.y + 2.0*y), 0.0).rgb;
		vec3 c = textureLod(FlameTexture, vec2(texCoord.x + 2.0*x, texCoord.y + 2.0*y), 0.0).rgb;

		vec3 d = textureLod(FlameTexture, vec2(texCoord.x - 2.0*x, texCoord.y), 0.0).rgb;
		vec3 e = textureLod(FlameTexture, vec2(texCoord.x,       texCoord.y), 0.0).rgb;
		vec3 f = textureLod(FlameTexture, vec2(texCoord.x + 2.0*x, texCoord.y), 0.0).rgb;

		vec3 g = textureLod(FlameTexture, vec2(texCoord.x - 2.0*x, texCoord.y - 2.0*y), 0.0).rgb;
		vec3 h = textureLod(FlameTexture, vec2(texCoord.x,       texCoord.y - 2.0*y), 0.0).rgb;
		vec3 i = textureLod(FlameTexture, vec2(texCoord.x + 2.0*x, texCoord.y - 2.0*y), 0.0).rgb;

		vec3 j = textureLod(FlameTexture, vec2(texCoord.x - x, texCoord.y + y), 0.0).rgb;
		vec3 k = textureLod(FlameTexture, vec2(texCoord.x + x, texCoord.y + y), 0.0).rgb;
		vec3 l = textureLod(FlameTexture, vec2(texCoord.x - x, texCoord.y - y), 0.0).rgb;
		vec3 m = textureLod(FlameTexture, vec2(texCoord.x + x, texCoord.y - y), 0.0).rgb;

		vec3 flame = e*0.125;
		flame += (a+c+g+i)*0.03125;
		flame += (b+d+f+h)*0.0625;
		flame += (j+k+l+m)*0.125;
	#else
		vec3 flameColorLeftUp = textureLod(FlameTexture, texCoord.xy + vec2(-srcTexelSize.x, -srcTexelSize.y), 0.0).rgb;
		vec3 flameColorLeftDown = textureLod(FlameTexture, texCoord.xy + vec2(-srcTexelSize.x, srcTexelSize.y), 0.0).rgb;
		vec3 flameColorRightUp = textureLod(FlameTexture, texCoord.xy + vec2(srcTexelSize.x, srcTexelSize.y), 0.0).rgb;
		vec3 flameColorRightDown = textureLod(FlameTexture, texCoord.xy + vec2(srcTexelSize.x, -srcTexelSize.y), 0.0).rgb;
		vec3 flame = (flameColorLeftUp + flameColorLeftDown + flameColorRightUp + flameColorRightDown) * 0.25;
	#endif

		vec3 firePlane = textureLod(FirePlaneTexture, texCoord.xy, 0.0).rgb;
		float brightness = dot(firePlane.rgb, vec3( 0.33f, 0.33f, 0.33f ));
		const float Threshold = float(` +
    MathLerp(0.0, 0.75, Math.random()) +
    /* glsl */ `);
		float s = 1.0f;
		if(brightness < Threshold)
		{
			s = 0.0;
		}

		OutColor = max(flame.rgb * 1.25f, firePlane.rgb * s).rgb;
	}`;
export const ShaderSourceBloomDownsamplePS = /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	out vec3 OutColor;

	uniform sampler2D SourceTexture;
	uniform float MipLevel;
	uniform vec2 DestTexelSize;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoord = vsOutTexCoords;
		vec2 srcTexelSize = DestTexelSize * 0.5;

	#if 1 //HQ Downsample
		float x = srcTexelSize.x;
    	float y = srcTexelSize.y;

    	vec3 a = textureLod(SourceTexture, vec2(texCoord.x - 2.0*x, texCoord.y + 2.0*y), 0.0).rgb;
    	vec3 b = textureLod(SourceTexture, vec2(texCoord.x,       texCoord.y + 2.0*y), 0.0).rgb;
    	vec3 c = textureLod(SourceTexture, vec2(texCoord.x + 2.0*x, texCoord.y + 2.0*y), 0.0).rgb;

    	vec3 d = textureLod(SourceTexture, vec2(texCoord.x - 2.0*x, texCoord.y), 0.0).rgb;
    	vec3 e = textureLod(SourceTexture, vec2(texCoord.x,       texCoord.y), 0.0).rgb;
    	vec3 f = textureLod(SourceTexture, vec2(texCoord.x + 2.0*x, texCoord.y), 0.0).rgb;

    	vec3 g = textureLod(SourceTexture, vec2(texCoord.x - 2.0*x, texCoord.y - 2.0*y), 0.0).rgb;
    	vec3 h = textureLod(SourceTexture, vec2(texCoord.x,       texCoord.y - 2.0*y), 0.0).rgb;
    	vec3 i = textureLod(SourceTexture, vec2(texCoord.x + 2.0*x, texCoord.y - 2.0*y), 0.0).rgb;

    	vec3 j = textureLod(SourceTexture, vec2(texCoord.x - x, texCoord.y + y), 0.0).rgb;
    	vec3 k = textureLod(SourceTexture, vec2(texCoord.x + x, texCoord.y + y), 0.0).rgb;
    	vec3 l = textureLod(SourceTexture, vec2(texCoord.x - x, texCoord.y - y), 0.0).rgb;
    	vec3 m = textureLod(SourceTexture, vec2(texCoord.x + x, texCoord.y - y), 0.0).rgb;

    	vec3 color = e*0.125;
    	color += (a+c+g+i)*0.03125;
    	color += (b+d+f+h)*0.0625;
    	color += (j+k+l+m)*0.125;
	#else
		vec3 colorLeftUp = textureLod(SourceTexture, texCoord.xy + vec2(-srcTexelSize.x, -srcTexelSize.y), 0.0).rgb;
		vec3 colorLeftDown = textureLod(SourceTexture, texCoord.xy + vec2(-srcTexelSize.x, srcTexelSize.y), 0.0).rgb;
		vec3 colorRightUp = textureLod(SourceTexture, texCoord.xy + vec2(srcTexelSize.x, srcTexelSize.y), 0.0).rgb;
		vec3 colorRightDown = textureLod(SourceTexture, texCoord.xy + vec2(srcTexelSize.x, -srcTexelSize.y), 0.0).rgb;
		vec3 color = (colorLeftUp + colorLeftDown + colorRightUp + colorRightDown) * 0.25;
	#endif

		OutColor = color;
	}`;

export const ShaderSourceBloomUpsamplePS = /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	out vec3 OutColor;

	uniform sampler2D SourceTexture;
	uniform float MipLevel;
	uniform vec2 DestTexelSize;//Dest is higher resolution

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoord = vsOutTexCoords;
		vec2 filterRadius = DestTexelSize * 2.0;

		float x = filterRadius.x;
    	float y = filterRadius.y;

    	// Take 9 samples around current texel:
    	// a - b - c
    	// d - e - f
    	// g - h - i
    	// === ('e' is the current texel) ===
    	vec3 a = textureLod(SourceTexture, vec2(texCoord.x - x, texCoord.y + y), 0.0).rgb;
    	vec3 b = textureLod(SourceTexture, vec2(texCoord.x,     texCoord.y + y), 0.0).rgb;
    	vec3 c = textureLod(SourceTexture, vec2(texCoord.x + x, texCoord.y + y), 0.0).rgb;

    	vec3 d = textureLod(SourceTexture, vec2(texCoord.x - x, texCoord.y), 0.0).rgb;
    	vec3 e = textureLod(SourceTexture, vec2(texCoord.x,     texCoord.y), 0.0).rgb;
    	vec3 f = textureLod(SourceTexture, vec2(texCoord.x + x, texCoord.y), 0.0).rgb;

    	vec3 g = textureLod(SourceTexture, vec2(texCoord.x - x, texCoord.y - y), 0.0).rgb;
    	vec3 h = textureLod(SourceTexture, vec2(texCoord.x,     texCoord.y - y), 0.0).rgb;
    	vec3 i = textureLod(SourceTexture, vec2(texCoord.x + x, texCoord.y - y), 0.0).rgb;

    	// Apply weighted distribution, by using a 3x3 tent filter:
    	//  1   | 1 2 1 |
    	// -- * | 2 4 2 |
    	// 16   | 1 2 1 |
    	vec3 color = e*4.0;
    	color += (b+d+f+h)*2.0;
    	color += (a+c+g+i);
    	color *= 1.0 / 16.0;

		OutColor = color;
	}`;

export const ShaderSourceBloomCopyPS = /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	out vec3 OutColor;

	uniform sampler2D SourceTexture;
	uniform float MipLevel;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		vec3 color = textureLod(SourceTexture, texCoords.xy, 0.0).rgb;
		OutColor = color;
	}`;

export function GetShaderSourceFlamePostProcessPS(randomValues: Vector3) {
    const ViewSize = GScreenDesc.ViewRatioXY;
    return (
        /* glsl */ `#version 300 es
	
		precision mediump float;
		precision mediump sampler2D;

	out vec4 OutColor;

	uniform float Time;
	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	

	uniform mediump sampler2D FlameTexture;
	uniform mediump sampler2D NoiseTexture;
	uniform mediump sampler2D FlameNoiseTexture;
	uniform mediump sampler2D FlameNoiseTexture2;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}
	vec2 MapToRange(vec2 t, float t0, float t1, float newt0, float newt1)
	{
		vec2 res;
		res.x = MapToRange(t.x, t0, t1, newt0, newt1);
		res.y = MapToRange(t.y, t0, t1, newt0, newt1);
		return res;
	}

	void main()
	{
			const vec2 kViewSize = vec2(float(` +
        ViewSize.x +
        /* glsl */ `), float(` +
        ViewSize.y +
        /* glsl */ `));
		const vec3 kRandomValues = vec3(float(` +
        randomValues.x +
        /* glsl */ `), float(` +
        randomValues.y +
        /* glsl */ `),
		float(` +
        randomValues.z +
        /* glsl */ `)
		);
		
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

		flameSamplingUV = MapToRange(flameSamplingUV, 0.0, 1.0, -1.0, 1.0);
		flameSamplingUV.x *= ScreenRatio;
		/* flameSamplingUV /= (1.f + CameraDesc.z);
		flameSamplingUV *= (CameraDesc.w); */
		flameSamplingUV = MapToRange(flameSamplingUV, -1.0, 1.0, 0.0, 1.0);
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

		distortionNoise *= 1.25f;
		distortionNoise *= (1.f + kRandomValues.x * 0.75);
		flameSamplingUV.x += distortionNoise.r * 0.0075;
		flameSamplingUV.y += distortionNoise.g * 0.001;

		//flameSamplingUV.x -= (0.5 - vsOutTexCoords.x) * 0.1 * (vsOutTexCoords.y * vsOutTexCoords.y); 

		flameNoiseUV = flameSamplingUV;

		//float4 flame = FlameTextureSRV[SampleCoord];
		vec4 flame = textureLod(FlameTexture, flameSamplingUV.xy, 0.f);

		if(any(greaterThan(flame.rgb, vec3(0.0))))
		{
			//Pre-Translate Scale
			flameNoiseUV *= 0.9f;
			float flameNoiseXScale = ` +
        MathLerp(2.0, 5.0, Math.random()) +
        /* glsl */ `;
			flameNoiseUV.x *= flameNoiseXScale;
			
			flameNoiseUV = MapToRange(flameNoiseUV, 0.0, 1.0, -1.0, 1.0);
			flameNoiseUV.x *= ScreenRatio;
			/* flameNoiseUV /= (1.f + CameraDesc.z);
			flameNoiseUV *= (CameraDesc.w); */
			flameNoiseUV = MapToRange(flameNoiseUV, -1.0, 1.0, 0.0, 1.0);
			
			//Translate
			const float flameSpeed = 0.25f + (kRandomValues.y * 0.5); 
			flameNoiseUV.y -= Time * flameSpeed;
			flameNoiseUV.x += Time * 0.05f;
			
			//Post-Translate Scale
			flameNoiseUV *= (0.2f + kRandomValues.z * 0.5);
			
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
		}

		



		#if 0 //MOVE IT TO EACH FLAME PARTICLE SEPARATE SHADER
		flameSamplingUV = vsOutTexCoords;
		//flameSamplingUV.y *= (0.75 + sin(Time) * 0.25);
		flameSamplingUV.y *= 0.5;
		flameSamplingUV.x *= 2.0;
		flameSamplingUV *= 0.75;
		vec3 fadeNoise = textureLod(NoiseTexture, flameSamplingUV.xy, 0.f).rgb;
		vec3 fadeOptions;
		fadeOptions.r = fadeNoise.r * fadeNoise.g;
		fadeOptions.g = fadeNoise.g * fadeNoise.b;
		fadeOptions.b = fadeNoise.b * fadeNoise.r;
		float olp = mod(Time, 3.0);
		if(olp > 2.0)
		{
			fadeNoise.r = mix(fadeOptions.b, fadeOptions.r, olp - 2.0);
		}
		else if(olp > 1.0)
		{
			fadeNoise.r = mix(fadeOptions.g, fadeOptions.b, olp - 1.0);
		}	
		else
		{
			fadeNoise.r = mix(fadeOptions.r, fadeOptions.g, olp);
		}
		fadeNoise.r = 1.0 - fadeNoise.r * 1.5;
		if(fadeNoise.r < 0.5) 
		{
			fadeNoise.r = 0.0;
		}
		fadeNoise.r = clamp(MapToRange(fadeNoise.r, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0);
		flame.rgb *= fadeNoise.r;
		#endif




		OutColor = flame;
	}`
    );
}

export function GetShaderSourceCombinerPassPS() {
    const ViewSize = GScreenDesc.ViewRatioXY;
    return (
        /* glsl */ `#version 300 es
	
		precision mediump float;
		precision mediump sampler2D;
	
		out vec4 OutColor;

		uniform vec4 CameraDesc;
		uniform float ScreenRatio;
		uniform vec3 SpotlightPos;
		uniform vec2 SpotlightScale;
	
		uniform float Time;
		
	
		uniform sampler2D FlameTexture;
		uniform sampler2D FirePlaneTexture;
		uniform sampler2D BloomTexture;
		uniform sampler2D SmokeTexture;
		uniform sampler2D NoiseTexture;
		uniform sampler2D SpotlightTexture;
		uniform sampler2D SmokeNoiseTexture;
		uniform sampler2D PointLightsTexture;
		uniform sampler2D LogoImageTexture;
		uniform sampler2D LensTexture;
	
		in vec2 vsOutTexCoords;

		float MapToRange(float t, float t0, float t1, float newt0, float newt1)
		{
			///Translate to origin, scale by ranges ratio, translate to new position
			return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
		}
		vec2 MapToRange(vec2 uv, float t0, float t1, float newt0, float newt1)
		{
			uv.x = MapToRange(uv.x, t0, t1, newt0, newt1);
			uv.y = MapToRange(uv.y, t0, t1, newt0, newt1);
			return uv;
		}

		float Contrast(float color, float contrast)
		{
			return max(float(0.f), contrast * (color - 0.5f) + 0.5f);
		}

		//--------------------------------------------------------------------------------------
		// The tone mapper used in HDRToneMappingCS11
		//--------------------------------------------------------------------------------------
		vec3 DX11DSK(vec3 color)
		{
		    float  MIDDLE_GRAY = 0.72f;
		    float  LUM_WHITE = 1.5f;
		
		    // Tone mapping
		    color.rgb *= MIDDLE_GRAY;
		    color.rgb *= (1.0f + color/LUM_WHITE);
		    color.rgb /= (1.0f + color);
		
		    return color;
		}

		//--------------------------------------------------------------------------------------
		// Reinhard
		//--------------------------------------------------------------------------------------
		vec3 Reinhard(vec3 color)
		{
		    return color/(vec3(1.f)+color);
		}

		vec3 Reinhard(vec3 color, float k)
		{
		    return color/(vec3(k)+color);
		}

		vec3 ReinhardSq(vec3 hdr)
		{
			float k = 0.25;
		    vec3 reinhard = hdr / (hdr + vec3(k));
		    return reinhard * reinhard;
		}

		vec3 Standard(vec3 hdr)
		{
		    return Reinhard(hdr * sqrt(hdr), sqrt(4.0 / 27.0));
		}

		vec3 StandardOld( vec3 hdr )
		{
		    return vec3(1.f) - exp2(-hdr);
		}

		vec3 ToneMapACES( vec3 hdr )
		{
		    const float A = 2.51, B = 0.03, C = 2.43, D = 0.59, E = 0.14;
		    return clamp((hdr * (A * hdr + B)) / (hdr * (C * hdr + D) + E), 0.0, 1.0);
		}

		vec3 Uncharted2TonemapOp(vec3 x)
		{
		    float A = 0.15;
		    float B = 0.50;
		    float C = 0.10;
		    float D = 0.20;
		    float E = 0.02;
		    float F = 0.30;
		
		    return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
		}

		vec3 Uncharted2Tonemap(vec3 color)
		{
		    float W = 11.2;    
		    return Uncharted2TonemapOp(vec3(2.0) * color) / Uncharted2TonemapOp(vec3(W));
		}

		vec3 Tonemap(vec3 color, int tonemapper)
		{
		    switch (tonemapper)
		    {
		    case 0: return Reinhard(color);
		    case 1: return ReinhardSq(color);
		    case 2: return Standard(color);
		    case 3: return StandardOld(color);
		    case 4: return ToneMapACES(color);
		    case 5: return Uncharted2Tonemap(color);
		    }
		}

		// Function to generate random float between 0 and 1
		float rand(vec2 co) {
		    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
		}
	
		void main()
		{
			const vec2 kViewSize = vec2(float(` +
        ViewSize.x +
        /* glsl */ `), float(` +
        ViewSize.y +
        /* glsl */ `));

			vec2 texCoords = vsOutTexCoords;
			ivec2 itexCoords = ivec2(gl_FragCoord.xy);
			vec3 flame = texelFetch(FlameTexture, itexCoords, 0).rgb;
			flame.rgb *= 1.1f;
	
		#if 1//heat distortion
			vec2 distortionUV = vsOutTexCoords;
			distortionUV.y -= Time * 0.25;
			distortionUV.x *= 1.5;
			distortionUV.y *= 0.75;
			distortionUV *= 0.4f;
			distortionUV *= 1.5f;
			distortionUV = MapToRange(distortionUV, 0.0, 1.0, -1.0, 1.0);
			distortionUV += CameraDesc.xy;
			distortionUV.x *= ScreenRatio;
			distortionUV = MapToRange(distortionUV, -1.0, 1.0, 0.0, 1.0);
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
			float heatOffset = 0.5;
			heatOffset /= (1.f - CameraDesc.z);
			vec3 heat = textureLod(FlameTexture, (texCoords - vec2(0.0, heatOffset)), 0.f).rgb;
			distortionNoise.x *= 0.0025;
			distortionNoise.y *= 0.001;
			distortionNoise *= 0.75f;
			distortionNoise *= 10.f;
			distortionNoise *= clamp(dot(heat.rgb, vec3(0.333f)), 0.f, 1.f);
			//OutColor = vec4(distortionNoise.rg, 0.f, 1.f); return;
			distortionUV.x += distortionNoise.r;
			distortionUV.y += distortionNoise.g;
			vec3 firePlane = textureLod(FirePlaneTexture, distortionUV.xy, 0.f).rgb;
		#else
			vec4 firePlane = textureLod(FirePlaneTexture, texCoords.xy, 0.f);
			#endif
			
			float pointLights = textureLod(PointLightsTexture, texCoords.xy, 0.f).r; 

			float light = textureLod(SpotlightTexture, texCoords, 0.f).r;
			//float light = 1.f;
			float lightInitial = light;
			//light *= light;
			//light = Contrast(light, 1.05);
			//light = light * 2.5f;
			light = light * 5.0f;
			light += 0.05; 

			//light = 0.0f;

			//light = min(2.f, (light + 0.0) * 4.5f);
			//light = min(1.0f, light * light + 0.01);

			` +
        scSpotlightFlicker() +
        /* glsl */ `
			
			vec4 smoke = textureLod(SmokeTexture, texCoords.xy, 0.f);
			//smoke noise
			{
				vec2 noiseUV = texCoords;
				noiseUV = MapToRange(noiseUV, 0.0, 1.0, -1.0, 1.0);
				noiseUV += CameraDesc.xy * 0.5;
				noiseUV.x *= ScreenRatio;
				noiseUV = MapToRange(noiseUV, -1.0, 1.0, 0.0, 1.0);
				noiseUV.x -= Time * 0.0043f;
				noiseUV.y -= Time * 0.0093f;
				vec4 smokeNoise = textureLod(SmokeNoiseTexture, noiseUV, 0.f);
				float smokeNoiseChannel = 1.f;
				{
					float tx = mod(Time + CameraDesc.z + CameraDesc.w, 9.f) / 3.f;
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

				smokeNoise.r = Contrast(smokeNoise.r, mix(0.05, 0.25, 1.f - lightInitial)) * 2.f;
				smokeNoise.r *= min(1.f, texCoords.y + 0.3f);
				//smokeNoise.r *= 5.f; //TODO:Depends on cur fire
				smoke.rgba = smoke.rgba * 1.f + vec4(vec3(smokeNoise.r) * 0.15, smokeNoise.r * 0.15) * clamp(1.f - smoke.a, 0.0, 1.f);
			}
			smoke.rgb *= 0.75f;
			smoke.rgb *= 0.25f;


			vec3 bloom = textureLod(BloomTexture, texCoords.xy, 0.f).rgb;

			//OutColor = vec4(bloom.rgb, 1); return;

			const float BloomStrength = 5.0f;
			const vec2 SmokeBloomColorClampMinMax = vec2(0.15, 1.f);
			const vec2 SmokeBloomAlphaClampMinMax = vec2(0.f, 1.f);
			vec3 smokeLightFromBloom = bloom.rgb
			* BloomStrength
			* clamp(1.f + clamp(smoke.r, SmokeBloomColorClampMinMax.x, SmokeBloomColorClampMinMax.y) - clamp(smoke.a, SmokeBloomAlphaClampMinMax.x, SmokeBloomAlphaClampMinMax.y), 0.f, 1.f) * clamp(smoke.a, 0.f, 1.f)
			;

			const float SmokeSpotlightStrength = 1.0f;
			float smokeLightFromSpotlight = light
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
			{
				vec2 texCoordsScaled = texCoords.xy;
				texCoordsScaled = MapToRange(texCoordsScaled, 0.0, 1.0, -1.0, 1.0);
				texCoordsScaled /= (1.f - CameraDesc.z);
				texCoordsScaled *= 2.0f + ` +
        Math.random() * 2.0 +
        /* glsl */ `;
				texCoordsScaled *= CameraDesc.w;
				texCoordsScaled.x *= ScreenRatio;
				texCoordsScaled += CameraDesc.xy;
				smokeScale *= clamp(length(texCoordsScaled - vec2(0.0, 0.0)), ` +
        Math.random() * 0.5 +
        /* glsl */ `, 1.f);
			}
			smokeScale *= 2.0f;
			//smokeScale = min(1.5f, smokeScale);

			smoke.a *= smokeScale;
			//smoke.rgb *= clamp(smokeScale, 0.5f, 1.f);

			firePlane.rgb = smoke.rgb * 1.f + firePlane.rgb * clamp(1.f - smoke.a, 0.0, 1.f);

			highp vec3 final = firePlane.rgb;
			const float bloomStrengthPlane = 0.75f;
			final = max(firePlane.rgb, bloom.rgb * bloomStrengthPlane);
			final = max(final, flame.rgb);

			vec2 lensUV = texCoords.xy;
			if(kViewSize.y > 1.f)
			{
				const float xScale = 0.99f; //TODO: Startup random
				lensUV = vec2(-texCoords.y, texCoords.x) * vec2(1.0, xScale);
			}
			vec4 lensDirt = textureLod(LensTexture, lensUV, 0.f);
			final.rgb += (bloom.rgb + pointLights * 0.25) * lensDirt.rgb * (0.5f + ` +
        Math.random() * 1.0 +
        /* glsl */ `);
			//final.rgb = lensDirt.rgb;
			//final = bloom.rgb;

			const float exposure = 1.f;
			final.rgb *= exposure;

			//final.rgb = pow(final.rgb, vec3(1.f/2.2f));
			const float kGreenAmount = float(` +
        MathLerp(0.25, 0.75, Math.random()) +
        /* glsl */ `);

			vec3 colorFilter1 = vec3(0.3, kGreenAmount, 1.0);
			float luma = clamp(dot(final.rgb, vec3(0.33)), 0.0, 1.0);
			//float luma = dot(final.rgb, vec3(0.2126, 0.7152, 0.0722)); // Using proper luminance values
			vec3 colorFilter2 = vec3(1.0, 1.0, 0.75);
			colorFilter1 = mix(colorFilter1, colorFilter2, luma);
			float gradParam = luma;
			
			const float gradThres = 0.15;
			if(gradParam < gradThres)
			{
				/* float mapped = MapToRange(gradParam, 0.0, gradThres, 0.0, 1.0);
				mapped = pow(mapped, 1.0 / 4.0);
				gradParam = MapToRange(mapped, 0.0, 1.0, 0.0, gradThres); */
				//gradParam = gradThres;
			}
			else
			{
				float mapped = MapToRange(gradParam, gradThres, 1.0, 0.0, 1.0);
				mapped = pow(mapped, 1.0 / 2.0);
				gradParam = MapToRange(mapped, 0.0, 1.0, gradThres, 1.0);
			}
			gradParam = clamp(gradParam, 0.0, 1.0);
			//colorFilter1 = mix(colorFilter1, vec3(1.0), 0.25);
			final.rgb = mix(colorFilter1 * final.rgb, final.rgb, 1.f - clamp(gradParam, float(` +
        Math.random() +
        /* glsl */ `), 1.0));

			/* colorFilter1 = mix(colorFilter1 * final.rgb, final.rgb, gradParam);
			final.rgb = mix(colorFilter1, final.rgb, 1.f - (gradParam * 0.5)); */
			final.b = max(0.025, final.b);

			// Generate random noise for each pixel
			vec2 noiseUV = texCoords;
			/* noiseUV *= 0.001f;
			noiseUV.y += Time * 0.00003f;
			noiseUV.x += Time * 0.00000013f; */
			const float noiseIntensity = 0.025f;
			float noise = (rand(noiseUV) * 2.0 - 1.0) * noiseIntensity;

			// Add noise to the color
			final.rgb += noise;

			#if 0//ALIGNMENT DEBUG
			if(ScreenRatio >= 1.0)
			{
				if(texCoords.x > 0.499 && texCoords.x < 0.501)
				{
					final.rgb = vec3(0.0, 1.0, 1.0);
				}
			}
			else
			{
				if(texCoords.y > 0.499 && texCoords.y < 0.501)
				{
					final.rgb = vec3(0.0, 1.0, 1.0);
				}
			}
			#endif
			

			OutColor = vec4(final.rgb, 1);
		}`
    );
}
