/* eslint-disable @typescript-eslint/no-unused-vars */
import { Vector2 } from "../types";

export function GetShaderSourceBackgroundSpotlightRenderVS(sizeScale: number, viewSize: Vector2) {
    return (
        /* glsl */ `#version 300 es

		precision highp float;
	
		layout(location = 0) in vec2 VertexBuffer;

		out vec2 vsOutTexCoords;

		vec3 VectorRotateAroundX(vec3 vec, float angle)
		{
			vec3 res;
			res.x = vec.x;
			res.y = vec.y * cos(angle) - vec.z * sin(angle);
			res.z = vec.y * sin(angle) + vec.z * cos(angle);
			return res;
		}

		#define FLOATING_SURFACE 0
	
		void main()
		{
			const vec2 kViewSize = vec2(float(` +
        viewSize.x +
        /* glsl */ `), float(` +
        viewSize.y +
        /* glsl */ `));

			vec3 pos = vec3(VertexBuffer.xy, 0.0f);

			#if FLOATING_SURFACE == 0
			pos.y -= 3.75f;
			#endif

			pos *= float(` +
        sizeScale +
        /* glsl */ `);
			pos.x /= float(` +
        viewSize.x +
        /* glsl */ `);
		pos.y /= float(` +
        viewSize.y +
        /* glsl */ `);
			
			pos.xy *= vec2(3.f, 0.3f);
			
			pos.x -= 0.05f;

		#if FLOATING_SURFACE == 1
		pos.y -= min(1.f, 0.125f + float(` +
        sizeScale +
        /* glsl */ `)) + 0.0 * (1.f - float(` +
        viewSize.y +
        /* glsl */ `)) ;
		#endif
			
			gl_Position = vec4(pos.xy, 0.f, 1.f);
			
			vec2 texcoord = (VertexBuffer.xy + 1.0) * 0.5;
			vsOutTexCoords = texcoord; // Convert to [0, 1] range
		}`
    );
}

export const ShaderSourceBackgroundSpotlightRenderPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 OutColor;

	uniform sampler2D ColorTexture;
	uniform sampler2D SpotlightTexture;

	uniform float FloorBrightness;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	vec3 Contrast(vec3 color, float contrast)
	{
		return max(vec3(0.f), contrast * (color - 0.5f) + 0.5f);
	}

	void main()
	{
		//OutColor = vec4(1.f); return;
		ivec2 SampleCoord = ivec2(gl_FragCoord.xy);

		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		vec3 light = texture(SpotlightTexture, flippedUVs.xy).rgb;

		float fade = min(1.f, length(vsOutTexCoords.xy - vec2(0.5))) * 2.f;

		vec3 finalColor = /* imageColor * */ (light) * 0.8 * (1.f - fade);

		OutColor = vec4(finalColor, 1);

	}`;

//View Space Floor Z Size Range [-10, 3]
//View Space Plane Z Pos = 2.f;

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


			
			pos.y += 1.f;
			pos.y *= 2.f;
			pos.y -= 4.46f;
			//pos.y *= FloorScale.x;
			//pos.y -= 2.f;
			//pos = VectorRotateAroundX(pos, FloorRotation);
			//pos.y -= 1.f;

			pos.y += FloorOffset;
			
			
			pos.xy /= kViewSize;

			if(kViewSize.x > 1.f)//widescreen
			{
				pos.xy *= min(1.f, kSizeScale + 0.15);
			}

			

			/* pos.xy *= float(` +
        sizeScale +
        /* glsl */ `); */
			
			/* float w = 1.0f + (pos.z);
			gl_Position = vec4(pos.xy, w, w); */
			gl_Position = vec4(pos.xy, 0.f, 1.f);
			
			vec2 texcoord = (VertexBuffer.xy + 1.0) * 0.5;
			vsOutTexCoords = texcoord * SpotlightTexScale; // Convert to [0, 1] range
		}`
    );
}

export const ShaderSourceBackgroundFloorRenderPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 OutColor;

	uniform sampler2D ColorTexture;
	uniform sampler2D SpotlightTexture;
	uniform sampler2D PointLightsTexture;

	uniform float FloorBrightness;

	in vec2 vsOutTexCoords;
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

	void main()
	{

		//get each light pos in view space
		const int NumLights2D = 4;

		const float FirePlaneSizeScaleNDC = 0.75f;//TODO

		const float distanceBetweenLightsNDC = (FirePlaneSizeScaleNDC * 2.f) / float(NumLights2D);
        const float domainStart = (FirePlaneSizeScaleNDC * -1.0) + distanceBetweenLightsNDC * 0.5f;

		float lightIntensityFinal = 0.f;

		vec3 lightColor1 = vec3(1.f, 0.5f, 0.1f);
		vec3 lightColor2 = vec3(1.f, 0.5f, 0.f);

		for(int y = 0; y < NumLights2D; y++)
		{
			for(int x = 0; x < NumLights2D; x++)
			{
				ivec2 lightIndex2D = ivec2(x,y);
				vec3 lightPos;
				lightPos.x = domainStart + float(lightIndex2D.x) * distanceBetweenLightsNDC;
        		lightPos.y = domainStart + float(lightIndex2D.y) * distanceBetweenLightsNDC;
				lightPos.z = 2.f;

				float curLightIntensity = texelFetch(PointLightsTexture, lightIndex2D, 0).r;

				float distance = length(lightPos - interpolatorViewSpacePos);
				const float VirtualLightRadius = 5.0f;
				float attenuation = clamp(1.f - (distance / VirtualLightRadius), 0.f, 1.f);

				lightIntensityFinal += curLightIntensity * attenuation;

			}
		}

		lightIntensityFinal = min(2.f, lightIntensityFinal * 2.5f);


		//float distFromPaintCenter = length(interpolatorViewSpacePos.xyz - vec3(0.0, 0.0, 2.0)) * 0.5f;
		//OutColor = vec4(lightColor1 * lightIntensityFinal, 1.0f); return; 

		//Sample spotlight
		const float spotlightStartViewSpace = 0.f;
		const float spotlightEndViewSpace = 2.25f;
		vec3 spotlghtColor = vec3(0.f);
		if(interpolatorViewSpacePos.z >= spotlightStartViewSpace && interpolatorViewSpacePos.z <= spotlightEndViewSpace)
		{
			//map to 0.1
			vec2 spotlightUV;
			//spotlightUV.x = (interpolatorViewSpacePos.x * 0.1 + 0.5f);
			float s = interpolatorViewSpacePos.x;
			s *= 0.25f;
			s += 0.01f;
			spotlightUV.x = (s + 1.f) * 0.5f;
			spotlightUV.y = MapToRange(interpolatorViewSpacePos.z, spotlightStartViewSpace, spotlightEndViewSpace, 0.0, 1.0);
			spotlightUV.y *= 1.2f;
			spotlightUV.y -= 0.3f;
			spotlghtColor = texture(SpotlightTexture, spotlightUV.xy).rgb;

			//fade
			const float spotVertFadeEnd = 1.0f;
			const float spotVertFadeStart = 1.75f;
			if(interpolatorViewSpacePos.z <= spotVertFadeEnd)
			{
				float t = MapToRange(interpolatorViewSpacePos.z, spotlightStartViewSpace, spotVertFadeEnd, 0.0, 1.0);
				spotlghtColor *= (t);
			}
			else if(interpolatorViewSpacePos.z >= spotVertFadeStart)
			{
				float t = MapToRange(interpolatorViewSpacePos.z, spotVertFadeStart, spotlightEndViewSpace, 0.0, 1.0);
				spotlghtColor *= (1.f - t);
			}
		}

		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		vec3 imageColor = texture(ColorTexture, flippedUVs.xy).rgb;
		/* imageColor.r = pow(imageColor.r, 2.2f);
		imageColor.g = pow(imageColor.g, 2.2f);
		imageColor.b = pow(imageColor.b, 2.2f); */

		vec3 finalColor = vec3(0.f); 
		finalColor += imageColor * spotlghtColor;
		finalColor += imageColor * lightColor1 * lightIntensityFinal;
		finalColor *= FloorBrightness;

		float fade = 1.f;

		const float verticalUpperFadeStartViewSpace = 2.f;
		const float verticalUpperFadeEndViewSpace = 4.f;
		if(interpolatorViewSpacePos.z >= verticalUpperFadeStartViewSpace)
		{
			//map to 0.1
			float t = MapToRange(interpolatorViewSpacePos.z, verticalUpperFadeStartViewSpace, verticalUpperFadeEndViewSpace, 0.0, 1.0);
			fade = pow(1.f - t, 2.f);
			finalColor.rgb *= fade;
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
			float t = MapToRange(interpolatorViewSpacePos.z, verticalFadeStartViewSpace, -10.f, 0.0, 1.0);
			fade = smoothstep(0.0, 1.0, 1.f - t);
			finalColor.rgb *= fade;
		}

		OutColor = vec4(finalColor.rgb, 1);

	}`;

//==============================================================================================Point Lights
export function GetLightsUpdateShaderVS() {
    return /* glsl */ `#version 300 es
	  
		  precision highp float;
	  
		  uniform float Time;
	  
		  uniform sampler2D NoiseTexture;
		  uniform sampler2D FireTextureDownsampled;

		  flat out float interpolatorIntensity;

		  float Contrast(float color, float contrast)
		  {
		  	return max(float(0.f), contrast * (color - 0.5f) + 0.5f);
		  }

		  vec2 GetLightPos(int lightIndex)
		  {
			const int NumLights2D = 4;
			const float distanceBetweenLightsNDC = 2.f / float(NumLights2D);
        	const float domainStart = -1.0 + distanceBetweenLightsNDC * 0.5f;

			ivec2 lightIndex2D;
			lightIndex2D.x = (lightIndex % NumLights2D);
			lightIndex2D.y = (lightIndex / NumLights2D);

			vec2 lightPos;
			lightPos.x = domainStart + float(lightIndex2D.x) * distanceBetweenLightsNDC;
        	lightPos.y = domainStart + float(lightIndex2D.y) * distanceBetweenLightsNDC;
			return lightPos;
		  }
	  
		  void main()
		  {
			gl_PointSize = 1.f;
			const int NumLights2D = 4;
			
			vec2 lightPos = GetLightPos(gl_VertexID);

			gl_Position = vec4(lightPos, 0.f, 1.f);
			
			//Get Cur Fire based on Pos
			vec2 fireUV = (lightPos + 1.f) * 0.5f;
			const float MipLevel = 7.f;
			float curFire = textureLod(FireTextureDownsampled, fireUV.xy, MipLevel).r;
			
			curFire *= 0.01;

			float lightIntensity = 0.0f;

			//curFire = 1.f;
			
			if(curFire > 0.f)
			{
				vec2 noiseuv;
				noiseuv.y = (float(gl_VertexID) + 0.5f) / float(NumLights2D * NumLights2D);
				noiseuv.x = Time * 0.13;
				noiseuv.y += Time * 0.0073;
				float noise = textureLod(NoiseTexture, noiseuv.xy, 0.f).r;
				noise = 1.f - min(1.f, Contrast(noise, 2.0f));
				lightIntensity = curFire * noise;
			}
			interpolatorIntensity = lightIntensity;
			
	  
		  }`;
}

export const LightsUpdatePS = /* glsl */ `#version 300 es
	  precision highp float;

	  flat in float interpolatorIntensity;

	  out float outIntensity;

	  void main()
	  {
		outIntensity = interpolatorIntensity;
	  }`;
