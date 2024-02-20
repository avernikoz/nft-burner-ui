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
		//firePlane *= 0.75;
		//firePlane *= 1.5;
		firePlane *= float(` +
    (1.0 + Math.random()) +
    /* glsl */ `);
		float brightness = dot(firePlane.rgb, vec3( 0.33f, 0.33f, 0.33f ));
		const float Threshold = float(` +
    MathLerp(0.2, 0.6, Math.random()) +
    /* glsl */ `);
		float s = 1.0f;
		if(brightness < Threshold)
		{
			s = 0.0;
		}

		flame.rgb *= float(` +
    (1.0 + Math.random()) +
    /* glsl */ `);

		OutColor = max(flame.rgb, firePlane.rgb * s).rgb;
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
		uniform sampler2D LensTexture;
		uniform sampler2D FuelTexture;
	
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

		
		uvec4 murmurHash41(uint src) {
			const uint M = 0x5bd1e995u;
			uvec4 h = uvec4(1190494759u, 2147483647u, 3559788179u, 179424673u);
			src *= M; src ^= src>>24u; src *= M;
			h *= M; h ^= src;
			h ^= h>>13u; h *= M; h ^= h>>15u;
			return h;
		}
		
		// 4 outputs, 1 input
		vec4 hash41(float src) {
			uvec4 h = murmurHash41(floatBitsToUint(src));
			return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
		}
		
		uvec4 murmurHash44(uvec4 src) {
			const uint M = 0x5bd1e995u;
			uvec4 h = uvec4(1190494759u, 2147483647u, 3559788179u, 179424673u);
			src *= M; src ^= src>>24u; src *= M;
			h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z; h *= M; h ^= src.w;
			h ^= h>>13u; h *= M; h ^= h>>15u;
			return h;
		}
		
		// 4 outputs, 4 inputs
		vec4 hash44(vec4 src) {
			uvec4 h = murmurHash44(floatBitsToUint(src));
			return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
		}


		vec4 RandRect(float seed)
		{
		    const vec2 maxSize = vec2(1.f, 0.2f);
		    vec4 rand = hash41(seed);
		    rand = rand * 1.5f - 0.25f; // scale larger than screen so blocks don't appear to crowd to much in the center
		    vec4 result = vec4(min(rand.x,rand.z), min(rand.y,rand.w), max(rand.x,rand.z), max(rand.y,rand.w));
		    // scale delta to more uniformly sample the 'maxSize' (if we just clamp we get an abnormally large count of 'maxSize' rects)
		    vec2 delta = result.zw-result.xy;
		    delta *= maxSize;
		    result.zw = result.xy + min(maxSize, delta); // min not really needed if hash function is [0,1] bound
		    return result;
		}

		bool RectContains(vec2 p, vec4 rect) 
		{
		    return p.x >= rect.x && p.y >= rect.y && p.x <= rect.z && p.y <= rect.w;
		}

		vec2 GlitchOffset(vec2 uv, int channel, float glitchAmount)
		{
		    int steps = int(floor(glitchAmount * 32.f));
		
		    vec2 rects = vec2(0.f);
		    for(int i = 0; i < steps; i++) {
		        float seed = float(i) + floor(Time * 5.f) * 1.1385f;
		        vec4 rect = RandRect(seed);
		        rect.xz += float(channel)*0.035f;
		        if(RectContains(uv,rect)) {
		            rects = hash41(seed*1.317f).rg;
		            // [-1,1]
		            rects = rects*2.f-vec2(1.f);
		        }
		    }
		    return rects * 0.0625f;
		}

		vec2 Warp(vec2 pos)
		{
			// Display warp.
			// 0.0 = none
			// 1.0/8.0 = extreme
			const vec2 warp=vec2(1.0/24.0, 1.0/16.0); 

			pos=pos*2.0-1.0;    
			pos*=vec2(1.0+(pos.y*pos.y)*warp.x,1.0+(pos.x*pos.x)*warp.y);
			return pos*0.5+0.5;
		}



		// Distance in emulated pixels to nearest texel.
		vec2 Dist(vec2 pos)
		{
			const vec2 res = vec2(320.0,160.0);
			pos=pos*res;
			return -((pos-floor(pos)) - vec2(0.5));
			}
    
		// 1D Gaussian.
		float Gaus(float pos,float scale){ return exp2(scale*pos*pos);}

		// Return scanline weight.
		float Scan(vec2 pos,float off)
		{
			// Hardness of scanline.
			//  -8.0 = soft
			// -16.0 = medium
			const float hardScan=-1.0;

			float dst=Dist(pos).y;
			return Gaus(dst+off,hardScan);
		}


		//============================================================= SINE NOISE begin

		#define _PI2 6.2831853
		#define _TemporalFrequency 0.3 //!
		#define _Twist 0.5
		#define _Detail 0.5 //!
		#define _Falloff 0.55
		#define _Frequency _PI2
		#define _DetailFrequency _PI2 
		#define GOLDEN_ANGLE 2.39996322

		//identity rotated GOLDEN_ANGLE around x, then around y
		#define m3 mat3(-0.7373688220977783, 0.4562871754169464, 0.49808549880981445, 0, -0.7373688220977783, 0.6754903197288513, 0.6754903197288513, 0.49808549880981445, 0.5437127947807312)
		//matrix often used on shadertoy for rotations of FBM octaves
		//#define m3 mat3( 0.00,  0.80,  0.60,	-0.80,  0.36, -0.48,-0.60, -0.48,  0.64 )

		vec3 twistedSineNoise33(vec3 q)
		{ 
		  float a = 1.;
		  vec3 sum = vec3(0);
		  for(int i = 0; i <7 ; i++){
		    q = m3 * q; 
		    vec3 s = sin( q.zxy / a) * a;  
		    q += s * _Twist;
		    sum += s;
		    a *= _Falloff;
		  }
		  return sum;
		}
	 
		//9 vec3 sines
		float fog(vec2 uv)
		{
		    vec3 p = vec3(uv * _Frequency, Time * _TemporalFrequency);

			//p.y -= Time * 0.1;

		    vec3 n = twistedSineNoise33(p);
		    n += sin(n * _DetailFrequency) * _Detail;
		    return (n.x + n.y + n.z) * 0.11 + 0.5;
		}

		//===================================================================== SINE NOISE end


	
		void main()
		{
			const vec2 kViewSize = vec2(float(` +
        ViewSize.x +
        /* glsl */ `), float(` +
        ViewSize.y +
        /* glsl */ `));

			vec2 texCoords = vsOutTexCoords;
			texCoords = Warp(texCoords);
			ivec2 itexCoords = ivec2(gl_FragCoord.xy);
			vec3 flame = texelFetch(FlameTexture, itexCoords, 0).rgb;
			flame.rgb *= 1.1f;
	
		#if 1//heat distortion
			vec2 distortionUV = texCoords;
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
			distortionUV = texCoords;
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
			vec3 firePlane = textureLod(FirePlaneTexture, texCoords.xy, 0.f);
			#endif


			vec3 glitchAmount = textureLod(NoiseTexture, vec2(Time * 0.5f,0), 0.f).rgb;
    		glitchAmount = max(vec3(0.f), glitchAmount-0.35f); // remove some frames from any glitch

			float globalGlitchMod = textureLod(NoiseTexture, vec2(Time * 0.0012f,Time * 0.017f), 0.f).r;
    		//float globalGlitchOffset = 0.1f * ;
    		float globalGlitchOffset = 0.03f;

			const float glitchNoiseSpeedScale = 3.0;
			float noisePos = textureLod(NoiseTexture, (texCoords + vec2(Time * 0.0012f * glitchNoiseSpeedScale,Time * 0.017f * glitchNoiseSpeedScale) ), 0.f).r;
			noisePos = MapToRange(noisePos, 0.3, 0.7, 0.0, 1.0);
			
			//glitchAmount.g *= 10.0;

			float curFuel = textureLod(FuelTexture, vec2(0.0, 0.0), 100.f).r;

			vec2 offsets[3];
    		offsets[0] = GlitchOffset(texCoords,0, glitchAmount.r-0.125f);
    		offsets[1] = GlitchOffset(texCoords,1, glitchAmount.g-0.125f);
    		offsets[2] = GlitchOffset(texCoords,2, glitchAmount.b-0.125f);

			vec3 col = vec3(0.f);

			vec2 dirVec = normalize(texCoords - vec2(0.5));

			for(int channel = 0; channel < 3; channel++) {
				vec2 normalUV = (texCoords * 2.f - vec2(1.f))*vec2(1,gl_FragCoord.x / gl_FragCoord.y);
				//vec3 render = Render(normalUV + offsets[channel]);
				float globalOffset = float(channel-1) * glitchAmount[channel] * globalGlitchOffset;
				if(channel == 1)
				{
					globalOffset = -1.0 * glitchAmount[channel] * globalGlitchOffset * 0.25;
				}
				//vec3 render = textureLod(FirePlaneTexture, texCoords + dirVec * globalOffset * noisePos + offsets[channel] *0.5f, 0.f).rgb;
				vec3 render = textureLod(FirePlaneTexture, texCoords + dirVec * globalOffset * noisePos + offsets[channel] *0.5f, 0.f).rgb;
				//vec3 render = textureLod(FirePlaneTexture, texCoords + vec2(globalOffset, globalOffset * 0.5) + offsets[channel] *0.5f, 0.f).rgb;
				//vec3 render = textureLod(FirePlaneTexture, texCoords + vec2(globalOffset, globalOffset * 0.5), 0.f).rgb;
				//vec3 render = Render(normalUV + vec2(globalOffset, 0.f) + offsets[channel], 0.f);
				col[channel] += render[channel];
				//col[channel] += render[channel] > 0.5 ? render[channel] : 0.0;
			}

			//firePlane = max(firePlane, col * clamp(dot(heat.rgb, vec3(0.333f) * 4.0), 0.f, 1.f));
			firePlane = max(firePlane, col * ((1.0 - (curFuel * curFuel)) + clamp(dot(heat.rgb, vec3(0.333f) * 4.0), 0.f, 1.f)));
			//firePlane += col;
			//firePlane = col;
			
			float pointLights = textureLod(PointLightsTexture, texCoords.xy, 0.f).r; 

			pointLights *= 5.0;
			pointLights *= (texCoords.y * (1.0 - 2.0 * abs(texCoords.x - 0.5)));

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
				smokeNoise.r *= float(` +
        (1.0 + Math.random() * 0.25) +
        /* glsl */ `);
				smoke.rgba = smoke.rgba * 1.f + vec4(vec3(smokeNoise.r) * 0.15, smokeNoise.r * 0.15) * clamp(1.f - smoke.a, 0.0, 1.f);


				//FLOOR FOG 

				/* float fogr = fog(texCoords);
				fogr *= (1.0 - texCoords.y) * (1.0 - texCoords.y);
				fogr = clamp(fogr, 0.0, 1.0); */
    			/* float g = fog(vec2(texCoords.x, texCoords.y)) - 0.37;
    			float b = fog(vec2(texCoords.x, texCoords.y + 0.17));
    			vec3 fogColor = vec3(r, g, b);
    			float d = length(texCoords - vec2(0.5));
    			fogColor *= smoothstep(0.0, 1.0, d); */

				//smoke.rgba = smoke.rgba * 1.f + vec4(vec3(fogr) * 0.15, fogr * 0.15) * clamp(1.f - smoke.a, 0.0, 1.f);

				//smoke.rgba = smoke.rgba * 1.f + vec4(fogColor, dot(fogColor, vec3(0.3))) * clamp(1.f - smoke.a, 0.0, 1.f);


			}
			smoke.rgb *= 0.75f;
			smoke.rgb *= 0.25f;


			vec3 bloom = textureLod(BloomTexture, texCoords.xy, 0.f).rgb;
			//bloom *= 0.5;

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
        (0.2 + Math.random() * 0.8) +
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

			//Scanline
			float weight = Scan(texCoords, 0.0);
			final.rgb *= weight;

			OutColor = vec4(final.rgb, 1);
		}`
    );
}
