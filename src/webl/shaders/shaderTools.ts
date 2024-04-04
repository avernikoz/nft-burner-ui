import { scGetCommonFuncsDeclarations } from "./shaderCommon";

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
		//pos.xy *= 1.25;
		pos.y *= 1.4;
		pos.x -= Velocity.x * TexCoordsBuffer.y * TexCoordsBuffer.y * 20.f;
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
			pos.y *= 1.f - clamp(abs(Velocity.x) * 15.0, 0.0, 1.0);
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

export function GetShaderSourceLaserVS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	
	layout(location = 0) in vec2 VertexBuffer;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform vec3 PositionStart;
	uniform vec3 PositionEnd;
	uniform float LineThickness;

	out vec2 vsOutTexCoords;

	void main()
	{

		vec3 dirVec = PositionEnd - PositionStart;

		vec3 camPos = CameraDesc.xyz;

		vec3 dirToCamFromStart = normalize(PositionStart - camPos);
		vec3 dirToCamFromEnd = normalize(PositionEnd - camPos);

		vec3 lineNormalStart = cross(dirVec, dirToCamFromStart);
		vec3 lineNormalEnd = cross(dirVec, dirToCamFromEnd);

		//const float lineThickness = 0.05;
		//const float lineThickness = 0.15;
		/* vec3 lineNormalStart = vec3(0.0, 1.0, 0.0) * lineThickness;
		vec3 lineNormalEnd = vec3(0.0, 1.0, 0.0) * lineThickness * 0.25; */

		lineNormalStart = lineNormalEnd;
		lineNormalStart = (normalize(lineNormalStart) * LineThickness);
		lineNormalEnd = (normalize(lineNormalEnd) * LineThickness /* * 0.25 */);

		
		vec3 verts0 = PositionStart - lineNormalStart;
		vec3 verts1 = PositionEnd - lineNormalEnd;
		vec3 verts2 = PositionEnd + lineNormalEnd;
		vec3 verts3 = PositionStart + lineNormalStart;

		////Clockwise, starting from left down
		vec2 uv0 = vec2(0.0, 0.0);
		vec2 uv1 = vec2(0.0, 1.0);
		vec2 uv2 = vec2(1.0, 1.0);
		vec2 uv3 = vec2(1.0, 0.0);

		uint vertId = uint(gl_VertexID);
		vec3 pos = verts3;
		vsOutTexCoords = uv3;
		if(vertId == 0u || vertId == 3u)
		{
			pos = verts0;
			vsOutTexCoords = uv0;
		}
		else if(vertId == 1u)
		{
			pos = verts1;
			vsOutTexCoords = uv1;
		}
		else if(vertId == 2u || vertId == 4u)
		{
			pos = verts2;
			vsOutTexCoords = uv2;
		}

		pos.xyz -= CameraDesc.xyz;
		pos.xy *= CameraDesc.w;
		pos.x /= ScreenRatio;

		gl_Position = vec4(pos.xy, 0.0, (1.f + pos.z));
	}`;
}

export function GetShaderSourceLaserPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outColor;

	uniform sampler2D LaserTexture;
	uniform sampler2D NoiseTexture;

	uniform vec3 ColorScale;
	uniform float Time;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		vec3 color = vec3(2.0, 0.41, 0.075) * 10.0;

		

		vec2 laserUV = vsOutTexCoords;
		laserUV.x = vsOutTexCoords.y;
		laserUV.y = vsOutTexCoords.x;
		//laserUV.x *= 3.0;

		const float noiseSpeed = 4.0;
		
		vec2 distortionUV = vsOutTexCoords;
		distortionUV.y -= Time * 0.25 * noiseSpeed * 2.0;
		distortionUV.x += Time * 0.005 * noiseSpeed;
		distortionUV *= 0.05;
		distortionUV.y *= 5.0;
		vec3 distortionNoise = textureLod(NoiseTexture, distortionUV.xy, 0.f).rgb;
		//distortionNoise.x = clamp(MapToRange(distortionNoise.x, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0);
		distortionNoise.y = clamp(MapToRange(distortionNoise.y, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		//distortionNoise.z = clamp(MapToRange(distortionNoise.z, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		float t = mod(Time + vsOutTexCoords.y, 1.f) * 3.0;
		if(t < 1.f)
		{
			distortionNoise.x = mix(distortionNoise.x, distortionNoise.y, t);
		}
		else if(t < 2.f)
		{
			distortionNoise.x = mix(distortionNoise.y, distortionNoise.z, t - 1.f);
		}
		else
		{
			distortionNoise.x = mix(distortionNoise.z, distortionNoise.x, t - 2.f);
		}

		
		laserUV.y += distortionNoise.x * 0.5;
		laserUV.y = clamp(laserUV.y, 0.0, 1.0);

		/* if(laserUV.y > 0.5)
		{
			laserUV.y += distortionNoise.x * 0.5;
			laserUV.y = clamp(laserUV.y, 0.5, 1.0);
		}
		else */
		{
			/* laserUV.y += distortionNoise.x * 0.5;
			laserUV.y = clamp(laserUV.y, 0.0, 0.5); */
		}

		

		laserUV.x *= 4.5;
		const float beamSpeed = 5.5;
		laserUV.x -= Time * 0.75 * beamSpeed;

		float s = texture(LaserTexture, laserUV).r;
		color *= s;

		float s2 = abs(vsOutTexCoords.x - 0.5);
		s2 = min(1.0, s2);
		s2 = 1.f - s2;
		color *= s2 * s2* s2* s2* s2* s2* s2;

		if(vsOutTexCoords.y > 0.99)
		{
			vec2 ndcSpace = vec2(vsOutTexCoords.x * 2.f - 1.f, vsOutTexCoords.y * 2.f - 1.f);
			const highp float rectPow = 8.f;
			highp float rectCircleLength = pow(abs(ndcSpace.x), rectPow) + pow(abs(ndcSpace.y), rectPow);
			const float rectCircleFadeStart = 0.9;
			const float edgeBumpScale = 1.0f;
			if(rectCircleLength > rectCircleFadeStart)
			{
				float f = clamp(1.f - MapToRange(rectCircleLength, rectCircleFadeStart, edgeBumpScale, 0.0, 1.0), 0.25, 1.0);
				//color = vec3(0.0, 1.0, 0.2) * f;
				color *= f;
			}
		}


		const float brightThres = 0.45;
		if(vsOutTexCoords.x > brightThres && vsOutTexCoords.x < (1.0 - brightThres))
		{
			color *= 1.5;
		}


		outColor = color * 2.0; /* + 0.1 */;
	}`;
}

export function GetShaderSourceThunderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outColor;

	uniform sampler2D LaserTexture;
	uniform sampler2D NoiseTexture;

	uniform vec3 ColorScale;
	uniform float LineColorCutThreshold;
	uniform float Time;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		vec3 color = ColorScale;


		vec2 laserUV = vsOutTexCoords;
		//laserUV.x = vsOutTexCoords.y;
		//laserUV.y = vsOutTexCoords.x;

		const float noiseSpeed = 7.0;
		
		vec2 distortionUV = vsOutTexCoords;
		distortionUV.y -= Time * 0.25 * noiseSpeed;
		distortionUV.x += Time * 0.005 * noiseSpeed;
		distortionUV *= 0.1;
		vec3 distortionNoise = textureLod(NoiseTexture, distortionUV.xy, 0.f).rgb;
		//distortionNoise.x = clamp(MapToRange(distortionNoise.x, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0);
		distortionNoise.y = clamp(MapToRange(distortionNoise.y, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		//distortionNoise.z = clamp(MapToRange(distortionNoise.z, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		float t = mod(Time + vsOutTexCoords.y, 1.f) * 3.0;
		if(t < 1.f)
		{
			distortionNoise.x = mix(distortionNoise.x, distortionNoise.y, t);
		}
		else if(t < 2.f)
		{
			distortionNoise.x = mix(distortionNoise.y, distortionNoise.z, t - 1.f);
		}
		else
		{
			distortionNoise.x = mix(distortionNoise.z, distortionNoise.x, t - 2.f);
		}
		laserUV.x += distortionNoise.x * 0.1 * 0.15;
		laserUV.x = clamp(laserUV.x, 0.0, 1.0);

		vec2 brightUV = vec2(0.5, 0.5);
		brightUV.x += Time * 0.025;
		brightUV.y += Time * 0.00025;

		vec3 brightChaos = textureLod(NoiseTexture, brightUV.xy, 0.f).rgb;
		//brightChaos.x = brightChaos.x * brightChaos.y * brightChaos.z;

		color *= 1.0 + clamp(MapToRange(brightChaos.x, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0) * 5.0;


		vec3 s = texture(LaserTexture, laserUV).rgb;
		color *= s;

		if(vsOutTexCoords.y > LineColorCutThreshold)
		{
			color *= 0.0;
		}

		float ss = sin(Time * 20.0);
		if(ss > 0.8)
		{
			color *= 0.1;
		}

		outColor = color /* + 0.1 */;
		//outColor = ColorScale /* + 0.1 */;
	}`;
}


export function GetShaderSourceFireballRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outColor;

	uniform sampler2D ColorTexture;
	uniform sampler2D NoiseTexture;

	uniform vec3 Color;
	uniform float Time;
	uniform int CurrentState; // 0 -nothing, 1- hovered, 2-launched

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		vec3 color = Color;
		
		float mask = textureLod(NoiseTexture, vec2(vsOutTexCoords.x, 1.0 - vsOutTexCoords.y), 0.f).r;
		color *= mask;

		#if 0
			vec2 uv = (vsOutTexCoords * 0.03) + vec2(0.2);
		
			float angle = -Time * 0.01;
		
			float rotatedX = uv.x * cos(angle) - uv.y * sin(angle);
			float rotatedY = uv.x * sin(angle) + uv.y * cos(angle);
		
			uv.x = rotatedX;
			uv.y = rotatedY;
		
			vec2 speed = vec2(0.01, 0.04);
		
			if(CurrentState == 0)
			{
				speed *= 0.2;
			}
			else if(CurrentState == 1)
			{
				speed *= 0.5;
			}
		
			uv.x -= Time * speed.x;
			uv.y -= Time * speed.y;
		
			float noise = textureLod(NoiseTexture, uv.xy, 0.f).r;
			noise = max(0.0, MapToRange(noise, 0.2, 0.8, 0.0, 1.0));
			//float a = max(0.0, 1.0 - length(vsOutTexCoords - vec2(0.5)) * 2.0);
			float a = max(0.0, 1.0 - length(vsOutTexCoords - vec2(0.5)) * 2.0);
			a *= a;
			a /= noise * 0.1;
			a *= 0.10;
			color *= a;
		#endif

		vec3 colorScale = vec3(1.0);

		if(CurrentState > 2)
		{
			colorScale = vec3(1.9, 1.5, 1.7) * 1.0;
		}
		else if(CurrentState == 2)
		{
			colorScale = vec3(1.9, 1.5, 1.7) * 2.0;
			
		}
		else if(CurrentState == 1) //Hovered
		{
			float t =  (sin(Time * 3.14) + 1.0) * 0.5;
			vec3 c = vec3(1.9, 1.5, 1.7) * (1.0 + t) * 0.5;
			colorScale = mix(colorScale, c, t);

			float dx = abs(dFdx(mask));
			float dy = abs(dFdy(mask));
			color += (dx + dy) * 1.0f;
		}
		else
		{
			vec3 c = vec3(1.0, 1.0, 1.0) * 0.5;
			float sc = length(vsOutTexCoords - vec2(0.5));
			if(sc < 0.05)
			{
				c = vec3(1.0);
				color = vec3(1.0);
			}
			colorScale = c;
		}

		//colorScale = vec3(1.9, 1.5, 1.7) * 1.9 * 1.5;

		outColor = color * colorScale;
	}`;
}



export function GetShaderSourceLightsaberPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outColor;

	uniform vec3 Color;
	uniform float LineLength;
	uniform float Time;

	uniform sampler2D NoiseTexture;

	in vec2 vsOutTexCoords;

	`+ scGetCommonFuncsDeclarations() + /* glsl */`

	void main()
	{
		float s = 1.0;

		vec2 texCoords = vsOutTexCoords;

	#if 1 //DISTORT HF
	{
		const float noiseSpeed = 8.0;

		vec2 distortionUV = vsOutTexCoords;

		if(vsOutTexCoords.x > 0.5)
		{
			distortionUV.x -= Time * 0.25 * noiseSpeed * 2.0;
		}
		else
		{
			distortionUV.x += Time * 0.25 * noiseSpeed * 2.0;
		}

		distortionUV.y -= Time * 0.05 * noiseSpeed;

		const float distPrecisionScale = 0.05;
		//const float distPrecisionScale = 0.01;
		distortionUV *= distPrecisionScale;
		distortionUV.y *= 5.0;
		vec3 distortionNoise = textureLod(NoiseTexture, distortionUV.xy, 0.f).rgb;
		//distortionNoise.x = clamp(MapToRange(distortionNoise.x, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0);
		distortionNoise.y = clamp(MapToRange(distortionNoise.y, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		//distortionNoise.z = clamp(MapToRange(distortionNoise.z, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		float t = mod(Time + vsOutTexCoords.y, 1.f) * 3.0;
		if(t < 1.f)
		{
			distortionNoise.x = mix(distortionNoise.x, distortionNoise.y, t);
		}
		else if(t < 2.f)
		{
			distortionNoise.x = mix(distortionNoise.y, distortionNoise.z, t - 1.f);
		}
		else
		{
			distortionNoise.x = mix(distortionNoise.z, distortionNoise.x, t - 2.f);
		}

		const float offsetScale = 0.1;
		texCoords.x += distortionNoise.x * offsetScale;
		texCoords.x = clamp(texCoords.x, 0.0, 1.0);
	}
	#endif

	#if 1 //DISTORT LF
	{
		const float noiseSpeed = 5.0;

		vec2 distortionUV = vsOutTexCoords;

		if(vsOutTexCoords.x > 0.5)
		{
			distortionUV.x -= Time * 0.25 * noiseSpeed * 2.0;
		}
		else
		{
			distortionUV.x += Time * 0.25 * noiseSpeed * 2.0;
		}

		distortionUV.y -= Time * 0.05 * noiseSpeed;

		//const float distPrecisionScale = 0.05;
		const float distPrecisionScale = 0.01;
		distortionUV *= distPrecisionScale;
		distortionUV.y *= 5.0;
		vec3 distortionNoise = textureLod(NoiseTexture, distortionUV.xy, 0.f).rgb;
		//distortionNoise.x = clamp(MapToRange(distortionNoise.x, 0.4, 0.6, 0.0, 1.0), 0.0, 1.0);
		distortionNoise.y = clamp(MapToRange(distortionNoise.y, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		//distortionNoise.z = clamp(MapToRange(distortionNoise.z, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
		distortionNoise = (distortionNoise * 2.f) - 1.f;
		float t = mod(Time + vsOutTexCoords.y, 1.f) * 3.0;
		if(t < 1.f)
		{
			distortionNoise.x = mix(distortionNoise.x, distortionNoise.y, t);
		}
		else if(t < 2.f)
		{
			distortionNoise.x = mix(distortionNoise.y, distortionNoise.z, t - 1.f);
		}
		else
		{
			distortionNoise.x = mix(distortionNoise.z, distortionNoise.x, t - 2.f);
		}

		const float offsetScale = 0.1;
		texCoords.x += distortionNoise.x * offsetScale;
		texCoords.x = clamp(texCoords.x, 0.0, 1.0);
	}
	#endif
	

	#if 1 //CAPSULE
		if(LineLength > 1.0)
		{
			vec2 st = texCoords.yx;
		
			vec2 objectSize = vec2(LineLength * 2.0, 1.0);
			vec2 objectSpacePos = st * objectSize;
		
    		float radius = 0.5;
		
			vec2 circle1Pos = vec2(objectSize.x - radius, 0.5);
			vec2 circle2Pos = vec2(0.0 + radius, 0.5);
			
			s = 1.0;
		
			if(objectSpacePos.x > circle1Pos.x)
			{
				float distToCircle1 = length(vec2(objectSpacePos - circle1Pos));
				if(distToCircle1 > radius)
				{
					float m = MapToRange(distToCircle1, radius, radius + 0.01, 1.0, 0.0);
					m = clamp(m, 0.0, 1.0);
					m *= m;
					s *= m;
					s = 0.0;
				}
			}
			else if(objectSpacePos.x < circle2Pos.x)
			{
				float distToCircle1 = length(objectSpacePos - circle2Pos);
				if(distToCircle1 > radius)
				{
					float m = MapToRange(distToCircle1, radius, radius + 0.05, 1.0, 0.0);
					m = clamp(m, 0.0, 1.0);
					m *= m;
					s *= m;
				}
			}

		}
	#endif

		//if(texCoords.y > 0.5)
		{
			float d = length(texCoords - vec2(0.5));
			const float thres = 0.5;
			if(d > thres)
			{
				//s = 0.2;
				float m = MapToRange(d, thres, thres + 0.2, 1.0, 0.0);
				m = clamp(m, 0.0, 1.0);
				m *= m;
				s *= m;
			}
		}
		
	#if 1 //blur border
	{
		/* const float thres = 0.3;
		if(texCoords.x > (1.0 - thres))
		{
			s *= MapToRange(texCoords.x, 1.0 - thres, 1.0, 1.0, 0.0);
		}
		else if(texCoords.x < thres)
		{
			s *= MapToRange(texCoords.x, 0.0, thres, 0.0, 1.0);
		} */

		float c = abs(texCoords.x - 0.5) * 2.0;
		const float thres0Birhgtness = 0.2;
		const float thres0 = 0.7;
		const float thres1 = thres0 - 0.2;
		if(c < thres0)
		{
			if(c > thres1)
			{
				float m = MapToRange(c, thres1, thres0, 1.0, thres0Birhgtness);
				s *= m;
			}
		}
		else
		{
			float m = MapToRange(c, thres0, 1.0, thres0Birhgtness, 0.0);
			s *= m;
		}
		
	}
	#endif

	#if 1 //blur ends
	{
		const float thres = 0.01;
		if(texCoords.y > (1.0 - thres))
		{
			//s *= MapToRange(texCoords.y, 1.0 - thres, 1.0, 1.0, 0.0);
		}
		else if(texCoords.y < thres)
		{
			s *= MapToRange(texCoords.y, 0.0, thres, 0.0, 1.0);
		}
	}
	#endif

	const float brightThres = 0.5 - 0.02;
	if(vsOutTexCoords.x > brightThres && vsOutTexCoords.x < (1.0 - brightThres) && vsOutTexCoords.y < 0.95 && vsOutTexCoords.y > 0.05)
	{
		s *= 10.0;
		//s = 0.0;
	}

	#if 1 //Flicker
	{
		const float flickerSpeed = 2.0;
		vec2 flickerUV = vec2(0.0, 0.5);
		flickerUV.x += Time * flickerSpeed;
		float flickerNoise = textureLod(NoiseTexture, flickerUV.xy, 0.f).r;
		flickerNoise = MapToRange(flickerNoise, 0.2, 0.8, 0.0, 1.0);
		s *= (1.0 + flickerNoise);
	}
	#endif

		//s *= 2.0;

		outColor = Color * s;
	}`;
}