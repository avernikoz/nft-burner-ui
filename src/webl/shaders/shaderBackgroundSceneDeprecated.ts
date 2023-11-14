import { Vector2 } from "../types";

export function GetShaderSourceBackgroundFloorRenderVS(sizeScale: number, viewSize: Vector2) {
    return (
        /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;

	uniform float FloorRotation;
	uniform vec2 FloorScale;
	uniform float FloorOffset;
	uniform vec2 SpotlightTexScale;
	uniform float FloorTexScale;

	out vec2 vsOutTexCoords;
	out vec2 vsOutTexCoords2;

	out vec3 interpolatorViewSpacePos;

	vec3 VectorRotateAroundX(vec3 vec, float angle)
	{
		vec3 res;
		res.x = vec.x;
		res.y = vec.y * cos(angle) - vec.z * sin(angle);
		res.z = vec.y * sin(angle) + vec.z * cos(angle);
		return res;
	}

	void main()
	{
		const vec2 kViewSize = vec2(float(` +
        viewSize.x +
        /* glsl */ `), float(` +
        viewSize.y +
        /* glsl */ `));
	const float kSizeScale = float(` +
        sizeScale +
        /* glsl */ `);

		vec3 pos = vec3(VertexBuffer.xy, 0.0f);

		//pos.xy *= FloorScale;

		//compute view space pos for lighting
		//floor plane .z range [0, 2] after rotation
		//floor is under the painting, painting z depth is 2.0f
		vec3 posView = pos;
		//flip and move forward
		posView.z = posView.y;
		posView.z -= 1.f;
		posView.z *= 13.f;
		posView.z += 4.f;
		posView.y = -1.f;
		interpolatorViewSpacePos = posView;

		float lengthScale = 0.75f;
		
		pos.y += 1.f;
		pos.y *= 1.f;
		//pos.y -= 4.46f;
		pos.y -= 2.f * lengthScale;
		pos.y -= kSizeScale;

		
		
		//pos.y *= FloorScale.x;
		//pos.y -= 2.f;
		//pos = VectorRotateAroundX(pos, FloorRotation);
		//pos.y -= 1.f;

		pos.y += FloorOffset;
		
		
		pos.xy /= kViewSize;



		/* if(kViewSize.x > 1.f)//widescreen
		{
			pos.xy *= min(1.f, kSizeScale + 0.15);
		} */

		
		/* float w = 1.0f + (pos.z);
		gl_Position = vec4(pos.xy, w, w); */
		gl_Position = vec4(pos.xy, 0.f, 1.f);
		
		vec2 texcoord = (VertexBuffer.xy + 1.0) * 0.5;
		vsOutTexCoords2 = texcoord;
		vsOutTexCoords = texcoord * SpotlightTexScale; // Convert to [0, 1] range
	}`
    );
}

export function GetShaderSourceBackgroundFloorRenderPS(sizeScale: number, viewSize: Vector2) {
    return (
        /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 OutColor;

	uniform sampler2D ColorTexture;
	uniform sampler2D SpotlightTexture;
	uniform sampler2D PointLightsTexture;
	uniform sampler2D BloomTexture;
	uniform sampler2D SmokeNoiseTexture;
	uniform sampler2D OilTexture;
	uniform sampler2D PuddleTexture;

	uniform float FloorBrightness;
	uniform float Time;

	in vec2 vsOutTexCoords;
	in vec2 vsOutTexCoords2;
	in vec3 interpolatorViewSpacePos;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	vec3 Contrast(vec3 color, float contrast)
	{
		return max(vec3(0.f), contrast * (color - 0.5f) + 0.5f);
	}
	float Contrast(float color, float contrast)
	{
		return max((0.f), contrast * (color - 0.5f) + 0.5f);
	}

	void main()
	{
		const vec2 kViewSize = vec2(float(` +
        viewSize.x +
        /* glsl */ `), float(` +
        viewSize.y +
        /* glsl */ `));
		const float kSizeScale = float(` +
        sizeScale +
        /* glsl */ `);

		vec3 lightColor1 = vec3(1.f, 0.5f, 0.1f);
		vec3 lightColor2 = vec3(1.f, 0.5f, 0.f);

		float vsOutTexCoords2YMapped01 = MapToRange(vsOutTexCoords2.y, 0.0, 0.75, 0.0, 1.0);
		float depthNDC = MapToRange(vsOutTexCoords2.y, 0.0, 1.0, -0.75, 0.25);
		vec3 posNDC = vec3(vsOutTexCoords2.x * 2.f - 1.f, -1.f * kSizeScale, depthNDC);
		
		float virtualPointLightsIntensityFinal = 0.f;
	#if 1 //VIRTUAL POINT LIGHTS
		{
		//get each light pos in view space
		const int NumLights2D = 4;

		const float distanceBetweenLightsNDC = (kSizeScale * 2.f) / float(NumLights2D);
        const float domainStart = (kSizeScale * -1.0) + distanceBetweenLightsNDC * 0.5f;

		for(int y = 0; y < NumLights2D; y++)
		{
			for(int x = 0; x < NumLights2D; x++)
			{
				ivec2 lightIndex2D = ivec2(x,y);
				vec3 lightPos;
				lightPos.x = domainStart + float(lightIndex2D.x) * distanceBetweenLightsNDC;
        		lightPos.y = domainStart + float(lightIndex2D.y) * distanceBetweenLightsNDC;
				lightPos.z = 0.f;

				float curLightIntensity = texelFetch(PointLightsTexture, lightIndex2D, 0).r;

				float distance = length(lightPos - posNDC);
				const float VirtualLightRadius = 2.0f;
				float attenuation = clamp(1.f - (distance / VirtualLightRadius), 0.f, 1.f);

				virtualPointLightsIntensityFinal += curLightIntensity * attenuation;

			}
		}
		virtualPointLightsIntensityFinal = min(2.f, virtualPointLightsIntensityFinal * 2.0);
		}
	#endif
		
	
		vec3 spotlghtColor = vec3(0.f);
	#if 1 //SPOTLIGHT
		//Sample spotlight
		const float spotlightStartViewSpace = -0.1f;
		const float spotlightEndViewSpace = 0.01f;
		if(depthNDC >= spotlightStartViewSpace && depthNDC <= spotlightEndViewSpace)
		{
			//map to 0.1
			vec2 spotlightUV;
			//spotlightUV.x = (interpolatorViewSpacePos.x * 0.1 + 0.5f);
			float s = posNDC.x;
			s *= 0.45f;
			//s -= 0.1f;
			spotlightUV.x = (s + 1.f) * 0.5f;
			spotlightUV.y = MapToRange(posNDC.z, spotlightStartViewSpace, spotlightEndViewSpace, 0.0, 1.0);
			//spotlightUV.y *= 1.2f;
			//spotlightUV.y += 0.85f;
			spotlightUV.y *= 1.1f;
			spotlightUV.y -= 0.05f;
			spotlghtColor = texture(SpotlightTexture, spotlightUV.xy).rgb;
			//spotlghtColor.rgb *= spotlghtColor.rgb;

			//fade
			const float spotVertFadeEnd = -0.075f;
			const float spotVertFadeStart = -0.01f;
			if(posNDC.z <= spotVertFadeEnd)
			{
				float t = MapToRange(posNDC.z, spotlightStartViewSpace, spotVertFadeEnd, 0.0, 1.0);
				spotlghtColor *= (t*t);
			}
			else if(posNDC.z >= spotVertFadeStart)
			{
				float t = 1.f - MapToRange(posNDC.z, spotVertFadeStart, spotlightEndViewSpace, 0.0, 1.0);
				spotlghtColor *= (t * t);
			}


			//Smoke shadow
			vec2 noiseUV = vsOutTexCoords2;
			/* noiseUV.x *= 5.f;
			noiseUV *= 0.05f; */
			noiseUV.y *= 5.f;
			noiseUV.x -= Time * 0.0053f;
			noiseUV.y -= Time * 0.013f;
			vec4 smokeNoise = textureLod(SmokeNoiseTexture, noiseUV, 0.f);
			{
				float tx = mod(Time, 12.f) / 4.f;
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

			//spotlghtColor = vec3(smokeNoise.r) * 5.f;
			spotlghtColor *= max(0.2, smokeNoise.r) * 1.5f;
		}
	#endif//SPOTLIGHT

		vec3 reflectionColor = vec3(0.0);
	#if 1//REFLECTIONS
		if(vsOutTexCoords2.y < 0.75)
		{
			vec2 texCoords = vsOutTexCoords2;
			texCoords.y = vsOutTexCoords2YMapped01;
			texCoords.y = 1.f - texCoords.y;

			texCoords = texCoords * 2.f - 1.f;
			//texCoords.y -= 0.1f;
			texCoords /= kViewSize;
			texCoords.y *= kSizeScale;
			/* texCoords.y *= 1.25f;
			texCoords.y += 0.075; */
			texCoords = (texCoords + 1.f) * 0.5f;
			if((texCoords.y <= 1.0f) && (texCoords.y >= 0.0f))
			{
				reflectionColor = textureLod(BloomTexture, texCoords, 0.0).rgb;
				reflectionColor *= 2.0;
			}

			const float reflFadeStart = 0.95;
			if(vsOutTexCoords2YMapped01 >= reflFadeStart)
			{
				float t = 1.f - MapToRange(vsOutTexCoords2YMapped01, reflFadeStart, 1.0, 0.0, 1.0);
				reflectionColor *= (t);
			}
		}
		
	#endif

		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		vec3 imageColor = texture(ColorTexture, flippedUVs.xy).rgb;
		imageColor *= 5.0f;

		vec3 oilTexture = texture(OilTexture, flippedUVs.xy).rgb;
		float puddle = texture(PuddleTexture, flippedUVs.xy).r;
		puddle = Contrast(puddle, 3.f);
		//imageColor = mix(imageColor, oilTexture, puddle);
		//imageColor *= (1.f + puddle);
		//imageColor = vec3(puddle);

		vec3 finalColor = vec3(0.f); 
		finalColor += imageColor * spotlghtColor * 0.4;
		finalColor += imageColor * lightColor1 * virtualPointLightsIntensityFinal;
		finalColor += imageColor * reflectionColor;
		finalColor *= FloorBrightness;

		
		
		float fade = 1.f;
		#if 1//FADE FINAL
		//finalColor = vec3(1.0);
		const float verticalUpperFadeStartViewSpace = 0.f;
		const float verticalUpperFadeEndViewSpace = 0.25f;
		if(posNDC.z >= verticalUpperFadeStartViewSpace)
		{
			//map to 0.1
			float t = MapToRange(posNDC.z, verticalUpperFadeStartViewSpace, verticalUpperFadeEndViewSpace, 0.0, 1.0);
			fade = 1.f - t;
			finalColor.rgb *= fade * fade;
			//finalColor.r = 1.0f;
		}
		
		const float horizontalFadeStart = 0.5; 
		if(abs(interpolatorViewSpacePos.x) >= horizontalFadeStart)
		{
			float t = MapToRange(abs(interpolatorViewSpacePos.x), horizontalFadeStart, 1.0, 0.0, 1.0);
			fade = smoothstep(0.0, 1.0, 1.f - t);
			finalColor.rgb *= fade;
		}

		const float verticalFadeStartViewSpace = 0.f;
		if(interpolatorViewSpacePos.z <= verticalFadeStartViewSpace)
		{
			float t = MapToRange(interpolatorViewSpacePos.z, verticalFadeStartViewSpace, -20.f, 0.0, 1.0);
			fade = smoothstep(0.0, 1.0, 1.f - t);
			finalColor.rgb *= fade;
		}
		#endif

		OutColor = vec4(finalColor.rgb, 1);

	}`
    );
}