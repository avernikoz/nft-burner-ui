import { MathLerp } from "../utils";
export function GetShaderSourceFireVisualizerVS() {
    return /* glsl */ `#version 300 es

	precision mediump float;
	precision mediump sampler2D;
	
		layout(location = 0) in vec3 VertexBuffer;
		layout(location = 1) in vec2 TexCoordsBuffer;

		uniform vec4 CameraDesc;
		uniform float ScreenRatio;
		uniform vec3 FirePlanePositionOffset;
		uniform vec3 OrientationEuler;
	
		out vec2 vsOutTexCoords;
		out vec3 interpolatorWorldSpacePos;

		vec3 rotateVectorWithEuler(vec3 v, float pitch, float yaw, float roll) {
			// Rotation matrix for roll, pitch, and yaw
			mat3 rotationMatrix = mat3(
				cos(yaw)*cos(roll) - sin(pitch)*sin(yaw)*sin(roll), -cos(pitch)*sin(roll), cos(roll)*sin(yaw) + cos(yaw)*sin(pitch)*sin(roll),
				cos(yaw)*sin(roll) + sin(pitch)*sin(yaw)*cos(roll),  cos(pitch)*cos(roll), sin(yaw)*sin(roll) - cos(yaw)*sin(pitch)*cos(roll),
			   -cos(pitch)*sin(yaw), sin(pitch), cos(pitch)*cos(yaw)
			);
		
			// Rotate the vector
			vec3 rotatedVector = rotationMatrix * v;
		
			return rotatedVector;
		}
	
		void main()
		{
			vec3 pos = VertexBuffer;
			pos = rotateVectorWithEuler(pos, OrientationEuler.x, OrientationEuler.y, OrientationEuler.z);
			pos += FirePlanePositionOffset;
			interpolatorWorldSpacePos = pos;
			pos.xyz -= CameraDesc.xyz;

			pos.xy *= CameraDesc.w;

			//pos = vec3(VertexBuffer.xy, 0.0f);

			pos.x /= ScreenRatio;
			/* pos.xy *= 0.5f;
			pos.x += 0.5f; */

			gl_Position = vec4(pos.xy, pos.z / 20.0, (1.f + pos.z));
			//vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
			vsOutTexCoords = TexCoordsBuffer;
		}`;
}

export function GetShaderSourceFirePlanePreProcess() {
    return (
        /* glsl */ `#version 300 es

		precision mediump float;
		precision mediump sampler2D;

		layout(location = 0) out vec4 OutFirePlane;

		uniform sampler2D ImageTexture;

		in vec2 vsOutTexCoords;

		void main()
		{
			vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);

			vec3 surfaceColor = textureLod(ImageTexture, flippedUVs.xy, 0.0).rgb;

			const float kRandomValue = float(` +
        MathLerp(0.007, 0.07, Math.random()) +
        /* glsl */ `);
			const float BurnedImageSharpness = kRandomValue;
			float h = BurnedImageSharpness * 0.1;
			vec3 n = textureLod(ImageTexture, flippedUVs + vec2(0, h), 0.f).rgb;
			vec3 e = textureLod(ImageTexture, flippedUVs + vec2(h, 0), 0.f).rgb;
			vec3 s = textureLod(ImageTexture, flippedUVs + vec2(0, -h), 0.f).rgb;
			vec3 w = textureLod(ImageTexture, flippedUVs + vec2(-h, 0), 0.f).rgb;

			vec3 dy = (n - s)*.5;
			vec3 dx = (e - w)*.5;

			vec3 edge = sqrt(dx*dx + dy*dy);
			float luminance = dot( edge.rgb, vec3( 0.299f, 0.587f, 0.114f ) );

			OutFirePlane = vec4(surfaceColor.rgb, luminance);

		}`
    );
}

export function GetShaderSourceFireVisualizerPS() {
    return (
        /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	layout(location = 0) out vec3 OutFirePlane;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform vec3 FirePlanePositionOffset;
	uniform vec3 OrientationEuler;
	uniform vec3 SpotlightPos;

	uniform vec3 ToolPosition;
	uniform float ToolRadius;
	uniform vec3 ToolColor;

	uniform float AfterBurnEmbersParam;

	uniform float NoiseTextureInterpolator;
	uniform float Time;

	//Shading Constants
	uniform vec4 RoughnessScaleAddContrastMin;
	uniform vec2 SpecularIntensityAndPower;
	uniform float DiffuseIntensity;
	uniform vec2 MaterialUVOffset;//negative value means flip

	uniform sampler2D FireTexture;
	uniform sampler2D FuelTexture;
	uniform sampler2D PaintTexture;
	uniform sampler2D FlameColorLUT;
	uniform sampler2D ImageTexture;
	uniform sampler2D AshTexture;
	uniform sampler2D AfterBurnTexture;
	uniform sampler2D NoiseTexture;
	uniform sampler2D NoiseTextureLQ;
	uniform sampler2D PointLightsTexture;
	uniform sampler2D RoughnessTexture;
	uniform sampler2D SurfaceMaterialColorTexture;
	uniform sampler2D NormalsTexture;
	uniform sampler2D SpotlightTexture;

	in vec2 vsOutTexCoords;
	in vec3 interpolatorWorldSpacePos;

	vec3 rotateVectorWithEuler(vec3 v, float pitch, float yaw, float roll) {
		// Rotation matrix for roll, pitch, and yaw
		mat3 rotationMatrix = mat3(
			cos(yaw)*cos(roll) - sin(pitch)*sin(yaw)*sin(roll), -cos(pitch)*sin(roll), cos(roll)*sin(yaw) + cos(yaw)*sin(pitch)*sin(roll),
			cos(yaw)*sin(roll) + sin(pitch)*sin(yaw)*cos(roll),  cos(pitch)*cos(roll), sin(yaw)*sin(roll) - cos(yaw)*sin(pitch)*cos(roll),
		   -cos(pitch)*sin(yaw), sin(pitch), cos(pitch)*cos(yaw)
		);
	
		// Rotate the vector
		vec3 rotatedVector = rotationMatrix * v;
	
		return rotatedVector;
	}

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

	vec3 DecodeNormalTexture(vec3 normTex, float angleScale)
	{
		normTex.y = 1.0f - normTex.y;//Flip Y coord to align with DirectX UV Basis
		normTex.x = normTex.x * 2.0f - 1.0f;
	    normTex.y = normTex.y * 2.0f - 1.0f;
	    normTex.z = normTex.z * 2.0f - 1.0f;
		normTex.z *= angleScale;
		normTex.z *= -1.f;
	    return normalize(normTex);
	}

	#define PI 3.141592654f

	vec3 FresnelSchlick(float cosTheta, vec3 F0)
	{
	    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
	}
	float FresnelSchlick(float cosTheta, float F0)
	{
	    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
	}

	float NormalDistributionGGX(vec3 N, vec3 H, float roughness)
	{
	    float a      = roughness*roughness;
	    float a2     = a*a;
	    float NdotH  = max(dot(N, H), 0.0);
	    float NdotH2 = NdotH*NdotH;

	    float num   = a2;
	    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
	    denom = PI * denom * denom;

	    return num / denom;
	}

	float GeometrySchlickGGX(float NdotV, float roughness)
	{
	    float r = (roughness + 1.0);
	    float k = (r*r) / 8.0;

	    float num   = NdotV;
	    float denom = NdotV * (1.0 - k) + k;

	    return num / denom;
	}

	float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
	{
	    float NdotV = max(dot(N, V), 0.0);
	    float NdotL = max(dot(N, L), 0.0);
	    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
	    float ggx1  = GeometrySchlickGGX(NdotL, roughness);

	    return ggx1 * ggx2;
	}

	vec3 CalculateLightPBR(vec3 n, vec3 lightPos, vec3 camPos, vec3 pixelPos, vec3 albedo, float roughness, float lightMask, float metalness)
	{
		vec3 v = normalize(camPos - pixelPos);
		vec3 l = normalize(lightPos - pixelPos);
		vec3 h = normalize(v + l);

		vec3 radiance = vec3(1.0); //lightDesc.Color * lightDesc.Intensity * attenuation;

		//calculate specular-diffuse ratio with Fresnel
		vec3 F0 = vec3(0.04); //surface reflection at zero incidence
		F0 = mix(F0, albedo, metalness);
		vec3 F  = FresnelSchlick(max(dot(h, v), 0.0), F0);

		//normal distribution function
		float NDF = NormalDistributionGGX(n, h, roughness);  

		//geometry function     
		float G = GeometrySmith(n, v, l, roughness);  

		//Cook-Torrance BRDF:
		vec3 numerator    = NDF * G * F;
		float denominator = 4.0 * max(dot(n, v), 0.0) * max(dot(n, l), 0.0) + 0.0001;
		vec3 specular     = numerator / denominator;  

		//refracted diffuse vs reflected specular
		vec3 kS = F;
		vec3 kD = vec3(1.0) - kS;

		float NdotL = max(dot(n, l), 0.1);   
    	return (kD * albedo * DiffuseIntensity * lightMask /* / PI */ + specular * SpecularIntensityAndPower.x * lightMask) * radiance * NdotL; //final Radiance

	}

	#define PAPER 0
	#define WOOD 0

	void main()
	{
		const float ImageMixRoughnessScale = 0.75f;
		const bool bInverseRoughness = false;
		const float TopSpecFadeScale = 2.0;
		const float NormalHarshness = float(` +
        MathLerp(0.5, 1.0, Math.random()) +
        /* glsl */ `);

		float curFire = texture(FireTexture, vsOutTexCoords.xy).r;
		float curFuel = texture(FuelTexture, vsOutTexCoords.xy).r;
		//curFuel = 0.0;
		//float curPaint = texture(PaintTexture, vsOutTexCoords.xy).r;
		bool bIsBurntSurface = curFuel < 0.01;
		bool bIsPureUnBurntSurface = curFuel > 0.995;
		
		vec3 surfaceColor = vec3(0.0);

		//OutFirePlane = vec3(1.0, 0.5, 0.05) * curPaint * 20.0; return;
		//OutFirePlane = vec3(1.0, 0.5, 0.7) * 1.0; return;

		//if(curFire < 4.0f || curFuel < 0.5)
		{
			//Surface might be visible

			

			vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);

			vec2 materialSamplingUV = flippedUVs;

			if(MaterialUVOffset.x < 0.0)
			{
				materialSamplingUV.x = 1.0 - materialSamplingUV.x;
			}
			if(MaterialUVOffset.y < 0.0)
			{
				materialSamplingUV.y = 1.0 - materialSamplingUV.y;
			}

			highp vec2 ndcSpace = vec2(vsOutTexCoords.x * 2.f - 1.f, vsOutTexCoords.y * 2.f - 1.f);

			//===================
			//		NORMAL
			//===================
			vec3 normal = texture(NormalsTexture, (3.f - RoughnessScaleAddContrastMin.z) * materialSamplingUV.xy).rgb;
			normal = DecodeNormalTexture(normal, NormalHarshness);
			normal = normalize(rotateVectorWithEuler(normal, OrientationEuler.x, OrientationEuler.y, OrientationEuler.z));

			#if 0//Rect Heightmap
			{
				const highp float rectPow = 4.f;
				highp float rectCircleLength = pow(abs(ndcSpace.x), rectPow) + pow(abs(ndcSpace.y), rectPow);
				const float rectCircleFadeStart = 0.95;
				float height = 1.0;
				if(rectCircleLength > rectCircleFadeStart)
				{
					float s = 1.f - clamp(MapToRange(rectCircleLength, rectCircleFadeStart, 2.0, 0.0, 1.0), 0.0, 1.0);
					height = s * s;
					height = min(1.f, height + (1.f-vsOutTexCoords.y));
					float dx = (dFdx(height));
					float dy = (dFdy(height));
					vec3 heightNormal = vec3(-dx, -dy, normal.z * 0.1);
					heightNormal = normalize(heightNormal);
					normal = normalize(mix(heightNormal, normal, s));
				}
			}
			#endif

			const float specFadeThres = 0.9975;
			if(vsOutTexCoords.y > specFadeThres)
			{
				//float t = MapToRange(vsOutTexCoords.y, specFadeThres, 1.0, 0.0, 1.0);
				//imageColor *= max(1.f, TopSpecFadeScale * t);
				//normal.yz = mix(normal.yz, vec2(1.0, 0.0), t);
				normal.yz = vec2(0.75, 0.0);
				normal = normalize(normal);
			}
			if(abs(ndcSpace.x) > specFadeThres)
			{
				//float t = MapToRange(abs(ndcSpace.x), specFadeThres, 1.0, 0.0, 1.0);
				//normal.xz = mix(normal.xz, vec2(ndcSpace.x, 0.0), t);
				normal.xz = vec2(ndcSpace.x > 0.f ? 0.75 : -0.75, 0.0);
				normal = normalize(normal);
			}

			//===================
			//	   ROUGHNESS
			//===================
			float roughness = 0.95f;
			if(!bIsBurntSurface)
			{
				roughness = texture(RoughnessTexture, materialSamplingUV).r;
				if(bInverseRoughness)
				{
					roughness = 1.f - roughness;
				}
				roughness = min(1.f, Contrast(roughness, RoughnessScaleAddContrastMin.z));
				roughness = clamp(roughness * RoughnessScaleAddContrastMin.x + RoughnessScaleAddContrastMin.y, 0.0, 1.0);
				//roughness = roughness * clamp(pow(length(vsOutTexCoords.xy - vec2(0.5) * 1.0f), 1.f/4.f), 0.0, 1.0);

				roughness = max(roughness,RoughnessScaleAddContrastMin.w); 
			}

			//===================
			//		SHADING
			//===================

			vec3 lightingDiffuseFinal = vec3(0.f);
			vec3 lightingSpecFinal = vec3(0.f);

			{
				//Shading Constants

				float specularPowerScaledCur = mix(2.0, SpecularIntensityAndPower.y, 1.f - roughness) * 8.f;

				vec3 lightPos = SpotlightPos;
				lightPos.z = min(-1.f, lightPos.z);
				vec3 vToLight = normalize(lightPos - interpolatorWorldSpacePos);

				//Vignette
				float vignette = 1.f - min(1.f, 0.5 * length(vec2((ndcSpace.x * 1.5), ndcSpace.y * 0.75)));
				vignette = min(1.f, 0.1 + vignette * 2.0f);
				vignette *= max(0.75, vsOutTexCoords.y);

				const float ambientLight = 0.2f;
				float spotlightMask = 1.0f;

	    		vec3 vToCam = normalize(CameraDesc.xyz - interpolatorWorldSpacePos);
				vec3 halfVec = normalize(vToLight + vToCam);

				//Spotlight
				{
					//Mask
					ivec2 texelPos = ivec2(gl_FragCoord.xy);
					//spotlightMask = texelFetch(SpotlightTexture, texelPos, 0).r;

					const float spotLightMaskScale = 5.0f;
					const float spotlightAmbientLight = 0.15f;
					//spotlightMask = clamp(spotlightMask * spotLightMaskScale, spotlightAmbientLight, 1.0);

					//spotlightMask = 2.0f;
					float nDotL = dot(normal, vToLight);
					if(nDotL < 0.0f)
					{
						nDotL *= 0.1;
					}
					nDotL = max(ambientLight, abs(nDotL));
					lightingDiffuseFinal += min(2.f, nDotL * spotlightMask * vignette * DiffuseIntensity);

					//Specular
					float specular = pow(max(0.f, dot(halfVec, normal)), specularPowerScaledCur);
					//float specular = pow(max(0.f, dot(halfVec, normal)), SpecularIntensityAndPower.y * 8.f);
					lightingSpecFinal += min(5.f, specular * max(0.25, curFuel) * SpecularIntensityAndPower.x * max(0.75,(1.f - roughness)) * nDotL * spotlightMask);
				}

				//Tool Light
				if(ToolRadius > 0.0)
				{
					vec3 vToCurLight = /* normalize */(ToolPosition - interpolatorWorldSpacePos);
					float distanceToCurLight = length(vToCurLight);
					vToCurLight = normalize(vToCurLight);
					float lightScaleDiffuseFromNormal = max(0.0, dot(normal, vToCurLight));
					float attenuation = clamp(1.f - pow(distanceToCurLight / ToolRadius, 2.0), 0.f, 1.f);
					lightingDiffuseFinal += ToolColor * lightScaleDiffuseFromNormal * attenuation;
					//specular
					vec3 halfVecCur = normalize(vToCurLight + vToCam);
					float specularCur = pow(max(0.f, dot(halfVecCur, normal)), specularPowerScaledCur);
					lightingSpecFinal += ToolColor * specularCur * max(0.25, curFuel) * SpecularIntensityAndPower.x * attenuation * max(0.5,(1.f - roughness));
				}

			}

			#if 1 //VIRTUAL POINT LIGHTS
			{
				const int NumLights2D = 4;

				const float FirePlaneSizeScaleNDC = 1.f;

				const float distanceBetweenLightsNDC = (FirePlaneSizeScaleNDC * 2.f) / float(NumLights2D - 1);
	    	    const float domainStart = (FirePlaneSizeScaleNDC * -1.0)/*  + distanceBetweenLightsNDC * 0.5f */;

				vec3 pixelPosNDCSpace = vec3(ndcSpace.xy, 0.0);

				vec3 virtualPointLightsColor = vec3(1.f, 0.5f, 0.1f);

				//Make normals harsher
				vec3 normalHarsh = normalize(vec3(normal.xy, normal.z * 0.25));

				vec3 vToCam = normalize(CameraDesc.xyz - interpolatorWorldSpacePos);

				for(int y = 0; y < NumLights2D; y++)
				{
					for(int x = 0; x < NumLights2D; x++)
					{
						ivec2 lightIndex2D = ivec2(x,y);
						float curLightIntensity = texelFetch(PointLightsTexture, lightIndex2D, 0).r;
						curLightIntensity *= float(` +
        (0.5 + Math.random() * 0.5) +
        /* glsl */ `);
						vec3 lightPos;
						lightPos.x = domainStart + float(lightIndex2D.x) * distanceBetweenLightsNDC;
	    	    		lightPos.y = domainStart + float(lightIndex2D.y) * distanceBetweenLightsNDC;
						lightPos.z = -0.5;

						vec3 vToCurLight = /* normalize */(lightPos - pixelPosNDCSpace);
						float distanceToCurLight = length(vToCurLight);
						vToCurLight = normalize(vToCurLight);

						float lightScaleDiffuseFromNormal = max(0.0, dot(normalHarsh, vToCurLight));
						const float VirtualLightRadius = 2.0f;
						float attenuation = clamp(1.f - (distanceToCurLight / VirtualLightRadius), 0.f, 1.f);
						lightingDiffuseFinal += virtualPointLightsColor * curLightIntensity * lightScaleDiffuseFromNormal * attenuation * 2.5f;

						//specular
						vec3 halfVecCur = normalize(vToCurLight + vToCam);
						const float specularPowerScaledCur = 2.f * 8.f;
						float specularCur = pow(max(0.f, dot(halfVecCur, normalHarsh)), specularPowerScaledCur);
						const float specularIntensityCur = 2.5f;
						lightingSpecFinal += virtualPointLightsColor * specularCur * curLightIntensity * specularIntensityCur * (1.f - roughness);

					}
				}
			}
			#endif////VIRTUAL POINT LIGHTS


			vec4 firePlaneImageTexture = texture(ImageTexture, vsOutTexCoords.xy).rgba;



			//======================
			//		AFTER BURN
			//======================

			if(!bIsBurntSurface)
			{
				//Surface Material
				surfaceColor = firePlaneImageTexture.rgb;

				#if 0
				vec3 surfaceMaterialColor = texture(SurfaceMaterialColorTexture, materialSamplingUV.xy).rgb;
				surfaceMaterialColor = min(vec3(1.0), surfaceMaterialColor *= 3.0f);
				#else
				vec3 surfaceMaterialColor = vec3(1.0);
				#endif
				surfaceColor.rgb = mix(surfaceColor.rgb, surfaceMaterialColor.rgb, roughness * ImageMixRoughnessScale);
			}


			if(curFuel < 0.5)
			{
				#if PAPER
			vec3 ashesColor = vec3(0.1);
			float afterBurnEmbers = 0.0;
		#elif WOOD
			vec3 ashesColor = vec3(texture(AshTexture, vsOutTexCoords.xy).r) * 0.5;
			float afterBurnEmbers = 0.0;
		#else
			vec3 ashesColor = vec3(texture(AshTexture, vsOutTexCoords.xy).r) * 1.5;
			{
				vec2 ashesTintUV = vsOutTexCoords.xy * (0.1 + float(` +
        Math.random() * 0.6 +
        /* glsl */ `));
				ashesTintUV.x += float(` +
        Math.random() +
        /* glsl */ `);
				ashesTintUV.y += float(` +
        Math.random() +
        /* glsl */ `);
				const float ashesTintScale = float(` +
        (0.1 + Math.random() * 0.4) +
        /* glsl */ `);
				ashesColor += ashesTintScale * vec3(0., 0.725,  1.0) * MapToRange(textureLod(NoiseTextureLQ, ashesTintUV, 0.f).r, 0.4, 0.6, 0.0, 1.0);
			}
			//OutFirePlane = vec4(ashesColor.rgb, 1); return;
			const float kRandomOffset = float(` +
        MathLerp(0.01, 0.5, Math.random()) +
        /* glsl */ `);
			float afterBurnEmbers = texture(AfterBurnTexture, vsOutTexCoords.xy + vec2(kRandomOffset, 0.0)).r;
			afterBurnEmbers = afterBurnEmbers * clamp(pow(length(vsOutTexCoords.xy - vec2(0.5) * 1.0f), 1.f), 0.0, 1.0);
			//afterBurnEmbers = 1.f - afterBurnEmbers;
		#endif
			
			vec3 embersColor = vec3(0.2, 0.2, 1.0) * afterBurnEmbers;
			float emberScale = 1.f;
		#if 1 //NOISE EMBERS SCALE
			//float noiseConst = textureLod(NoiseTextureLQ, 0.5 * (vsOutTexCoords.xy - vec2(Time * 0.0013, Time * 0.0043)), 0.f).r;
			//float noiseConst = textureLod(NoiseTextureLQ, 50.f + vec2(Time * 0.0013, Time * 0.0093), 0.f).r;
			float noiseConst = textureLod(NoiseTextureLQ, 50.f + vec2(Time * 0.013, Time * 0.0093), 0.f).r;
			noiseConst = clamp(MapToRange(noiseConst, 0.4, 0.6, 0.25, 1.0), 0.1f, 1.f);
		#if (1 && (PAPER || WOOD))
			
			vec3 noiseVec = textureLod(AfterBurnTexture, (vsOutTexCoords.xy - vec2(Time * 0.0013, Time * 0.0043)), 0.f).rgb;
			//vec3 noiseVec = textureLod(AfterBurnTexture, (vsOutTexCoords.xy - vec2(Time * 0.00013, Time * 0.00043)), 0.f).rgb;
			emberScale = noiseVec.x * noiseVec.y * noiseVec.z; 
			emberScale = Contrast(emberScale, 1.5f) * (10.f * noiseConst);
			emberScale *= 1.f + emberScale;
			if(emberScale > 1.f)
			{
				emberScale *= emberScale;
			}
			//emberScale *= emberScale;
			//emberScale = (sin(Time * PI * 0.35) + 1.0f) * 0.5;
		#else
			vec3 noiseVec = textureLod(NoiseTextureLQ, vsOutTexCoords.xy - vec2(Time * 0.0013, Time * 0.0093), 0.f).rgb;
			float t = NoiseTextureInterpolator;
			//float t = mod(Time, 3.f);
			if(t < 1.f)
			{
				emberScale = mix(noiseVec.x, noiseVec.y, t);
			}
			else if(t < 2.f)
			{
				emberScale = mix(noiseVec.y, noiseVec.z, t - 1.f);
			}
			else
			{
				emberScale = mix(noiseVec.z, noiseVec.x, t - 2.f);
			}
			emberScale = clamp(MapToRange(emberScale, 0.4, 0.6, 0.0, 1.0), 0.25f, 2.f);
			emberScale *= 1.5;
			//emberScale *= clamp(noiseConst + 0.5, 0.5, 1.5);
			emberScale *= clamp(noiseConst * 1.25, 0.5, 1.25);
			#endif


			#if PAPER
			//emberScale = max(0.25, emberScale * 0.75);
			//emberScale *= 0.5;
			//emberScale = 0.0f;
			#endif
		#endif

			embersColor = embersColor * 15.f * emberScale;

			//if(AfterBurnEmbersParam > 0.0)
			{
				embersColor = mix(embersColor, vec3(0.2, 0.2, 0.2), AfterBurnEmbersParam * 0.5);
			}

			ashesColor.rgb += embersColor;
			#if !(PAPER)
			ashesColor.b += (1.f - emberScale) * 0.05f;
			#endif

		#if 1 //BURNED IMAGE

			vec3 burnedImageTexture = vec3(0.f);
		#if 0//NOT PREPROCESSED
			const float kRandomValue = float(` +
        MathLerp(0.005, 0.075, Math.random()) +
        /* glsl */ `);
			const float BurnedImageSharpness = kRandomValue;
			float h = BurnedImageSharpness * 0.1;
			vec3 n = textureLod(ImageTexture, flippedUVs + vec2(0, h), 0.f).rgb;
			vec3 e = textureLod(ImageTexture, flippedUVs + vec2(h, 0), 0.f).rgb;
			vec3 s = textureLod(ImageTexture, flippedUVs + vec2(0, -h), 0.f).rgb;
			vec3 w = textureLod(ImageTexture, flippedUVs + vec2(-h, 0), 0.f).rgb;

			vec3 dy = (n - s)*.5;
			vec3 dx = (e - w)*.5;

			vec3 edge = sqrt(dx*dx + dy*dy);
			float luminance = dot( edge.rgb, vec3( 0.299f, 0.587f, 0.114f ) );
		#else//PREPROCESS
			float luminance = firePlaneImageTexture.a;
			//luminance += curPaint;
		#endif//PREPROCESS
			
			//burnedImageTexture = luminance * 10.0 * vec3(1, 0.2, 0.1);
			//burnedImageTexture = luminance * 10.0 * vec3(0.5, 0.2, 0.7);
			burnedImageTexture = luminance * 10.0 * vec3(0.2, 0.2, 1.0);
			//ashesColor.rgb += burnedImageTexture * emberScale;
		#if PAPER
			ashesColor.rgb += luminance * min(0.5, Contrast(surfaceMaterialColor.r * 0.5f, 5.f));
			ashesColor += burnedImageTexture * emberScale;
		#elif WOOD
			ashesColor.rgb += luminance * min(0.5, Contrast(surfaceMaterialColor.r * 0.5f, 5.f));
			ashesColor += burnedImageTexture * emberScale * 4.f;
			ashesColor += burnedImageTexture * noiseConst * noiseConst;
		#else
			//ashesColor.rgb += min(1.0, luminance * 5.0) * 0.25;
			//ashesColor += burnedImageTexture;
			//float curFireLOD = texture(FireTexture, vsOutTexCoords.xy).r;
			vec3 finalAfterBurnColor = max(ashesColor.rgb, burnedImageTexture * 2.0f *emberScale);
			ashesColor.rgb = mix(finalAfterBurnColor * (1.0 - AfterBurnEmbersParam) * (1.0 - AfterBurnEmbersParam), max(0.75, (1.0 - AfterBurnEmbersParam * 0.75)) * max(ashesColor.rgb, vec3(min(0.9, luminance * 10.0) * 1.0)), AfterBurnEmbersParam);

			/* float gr = dot(vec3(0.3), ashesColor.rgb);
			ashesColor.rgb = vec3(gr);
			ashesColor.rgb = max(ashesColor.rgb, curPaint * vec3(0.1, 0.925,  0.8) * 15.0); */
		#endif
		#endif////BURNED IMAGE

		#if PAPER
			ashesColor = vec3(0.0);
		#endif

			surfaceColor = mix(ashesColor, surfaceColor, /* saturate */(curFuel));

			}

			if(surfaceColor.r <= 1.f || curFuel > 0.99f)
			{

			#if 1 //!PBR
				surfaceColor = surfaceColor * lightingDiffuseFinal;
				surfaceColor += lightingSpecFinal;
			#else
				const float minRoughness = 0.25f;
				surfaceColor = CalculateLightPBR(normal, lightPos, camPos, interpolatorWorldSpacePos,
					 surfaceColor * vignette, clamp(roughness, minRoughness, 1.0), spotlightMask, 0.0);
			#endif
			}

			const float shadowFadeThres = 0.01;
			if(vsOutTexCoords.y < shadowFadeThres)
			{
				surfaceColor *= MapToRange(vsOutTexCoords.y, shadowFadeThres, 0.0, 1.0, 0.75);
			}

		#if 1//RECT FADE BUMPY
			const highp float rectPow = 32.f;
			highp float rectCircleLength = pow(abs(ndcSpace.x), rectPow) + pow(abs(ndcSpace.y), rectPow);
			//float rectCircleLength = abs(vsOutTexCoords.x * 2.f - 1.f) + abs(vsOutTexCoords.y * 2.f - 1.f);
			const float rectCircleFadeStart = 0.8;
			const float edgeBumpScale = 1.0f;
			if(rectCircleLength > rectCircleFadeStart)
			{
				float f = clamp(1.f - MapToRange(rectCircleLength, rectCircleFadeStart, edgeBumpScale, 0.0, 1.0), 0.0, 1.0);
				float s = f;

				//surfaceColor *= clamp(s, min(1.0, 0.5 + vsOutTexCoords.y * 0.5), 1.0);

				vec2 bumpsSamplingUV = vsOutTexCoords.xy;
				bumpsSamplingUV *= 0.23f;

				bumpsSamplingUV += vec2(0.13, 0.15); //===================================================================!!!TODO: Randomise on boot=====!!!

				float bumpNoise = texture(NoiseTextureLQ, bumpsSamplingUV.xy).r;
				bumpNoise = min(1.f, Contrast(bumpNoise * 1.0, 2.5f));
				s = min(1.0, mix(bumpNoise, 1.0, s));
				surfaceColor *= s * s;
				//urfaceColor.r = s * s;

				s = f;
				bumpsSamplingUV = vsOutTexCoords.xy;
				bumpsSamplingUV *= 2.73f;
				bumpsSamplingUV += vec2(0.2, 0.3); //===================================================================!!!TODO: Randomise on boot=====!!!
				bumpNoise = texture(NoiseTextureLQ, bumpsSamplingUV.xy).r;
				bumpNoise = min(1.f, Contrast(bumpNoise * (1.25 + vsOutTexCoords.y * 0.25 + (1.0 - abs(ndcSpace.x)) * 0.5), 5.0f));
				s = clamp(mix(bumpNoise, 1.0, s), 0.0, 1.0);
				surfaceColor *= s * s;
				//surfaceColor.r = s;
			}
			if(rectCircleLength > 1.25)
			{
				surfaceColor *= 0.25f;
			}
		#elif 1 //RECT FADE SIMPLE
			const highp float rectPow = 4.f;
			highp float rectCircleLength = pow((ndcSpace.x), rectPow) + pow((ndcSpace.y), rectPow);
			const float rectCircleFadeStart = 1.8;
			if(rectCircleLength > rectCircleFadeStart)
			{
				float f = /* clamp */(1.f - MapToRange(rectCircleLength, rectCircleFadeStart, 2.0, 0.0, 1.0)/* , -1.0, 1.0 */);
				surfaceColor *= (f * f);
				//surfaceColor.r = f * f;
			}
		#endif//RECT FADE

		}

		//=======================
		//	SURFACE FIRE COLOR
		//=======================

		vec3 fireColor = vec3(0.0);
	#if 0 //USE LUT
		float uvu = clamp(MapToRange(curFire, 0., 7.5, 0.01, 1.), 0.01f, 0.99f);
		//float uvu = clamp(curFire, 0.f, 1.f);
		fireColor = texture(FlameColorLUT, vec2(uvu, 0.5)).rgb;
		//fireColor = vec3(uvu,uvu,uvu);
	#else

		const float FireBrightnessScale = 0.25f;

		curFire *= FireBrightnessScale;

		vec3 brightFlameColor = vec3(1.0, 0.2, 0.1) * curFire;
		
		if(curFire > 4.f)
		{
			fireColor = brightFlameColor;
		}
		else if(curFire > 2.0)
		{
			vec3 lowFlameColor = vec3(0.1f, 0.2, 1.0) * (curFire * 0.5) - 1.0;
			float f = (curFire * 0.5) - 1.0;
			f *= f;
			fireColor = mix(lowFlameColor, brightFlameColor, f);
		}
		else if(curFire > 0.001)
		{
			vec3 lowFlameColor = vec3(0.1f, 0.2, 1.0) * (curFire * 0.5);
			float fireInv = clamp(1.f - curFire, 0.0, 1.0);
			vec3 lowestFlameColor = vec3(0.4f, 0.26, 0.12) * fireInv * 0.01;
			float t = curFire * 0.5;
			t *= t;
			t *= t;
			fireColor = mix(lowestFlameColor, lowFlameColor, min(1.0, t + (1.0 - curFuel)));
		}

		//fireColor = vec3(0.4f, 0.26, 0.12) * 0.01;


	#if 1//ADD NOISE TO FIRE COLOR
		if(curFire > 1.0)
		{
			vec2 noiseUV = vec2(vsOutTexCoords.x + Time * 0.01, vsOutTexCoords.y - Time * 0.2);
			//noiseUV *= 0.35f;
			noiseUV *= 1.5f;
			vec3 noiseTexture = texture(NoiseTexture, noiseUV.xy).rgb;
			float fireScale = 1.f;
			fireScale = noiseTexture.r;
			fireScale = MapToRange(fireScale, 0.2, 0.8, 0.f, 1.f);
			//fireScale = 1.f - fireScale;
			fireColor.rg *= clamp(fireScale, 0., 1.f);
			fireColor.b *= clamp(fireScale, 0.5, 1.f);
		}
	#endif

	#endif

		fireColor = clamp(fireColor, 0.f, 1.25f);
		
		vec3 finalColor;

		#if 0
		if(curFuel > 0.1)
		{
			finalColor = fireColor + surfaceColor * (1.f - clamp(curFire, 0.01, 1.0));
		}
		else
		{
			finalColor = max(surfaceColor, fireColor);
		}
		#else
		{
			vec3 colorBurning = fireColor + surfaceColor * (1.f - clamp(curFire * 2.0, 0.0, 1.0));
			vec3 colorAfterBurn =  max(surfaceColor, fireColor);
			finalColor = mix(colorAfterBurn, colorBurning, pow(curFuel, 1.0 / 8.0));
		}
		#endif
		

		#if PAPER //ASH DISSOLVE EFFECT 
		if(curFire > 0.1f)
		{
			if(curFire > 1.f || curFuel > 0.1f)
			{
				fireColor = brightFlameColor * 0.0;
			}
			else
			{
				finalColor = vec3(clamp(1.f - curFire, 0.0, 1.0) * 0.3);
			}
		}
		else
		{
			finalColor = surfaceColor;
		}
		#endif

		OutFirePlane = finalColor.rgb;

	}`
    );
}

export function GetShaderSourceFireVisualizerExportPS() {
    return (
        /* glsl */ `#version 300 es
	
	precision mediump float;
	precision mediump sampler2D;

	layout(location = 0) out vec3 OutFirePlane;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform vec3 FirePlanePositionOffset;
	uniform vec3 OrientationEuler;
	uniform vec3 SpotlightPos;

	uniform vec3 ToolPosition;
	uniform float ToolRadius;
	uniform vec3 ToolColor;

	uniform float AfterBurnEmbersParam;

	uniform float NoiseTextureInterpolator;
	uniform float Time;

	//Shading Constants
	uniform vec4 RoughnessScaleAddContrastMin;
	uniform vec2 SpecularIntensityAndPower;
	uniform float DiffuseIntensity;
	uniform vec2 MaterialUVOffset;//negative value means flip

	uniform sampler2D FireTexture;
	uniform sampler2D FuelTexture;
	uniform sampler2D FlameColorLUT;
	uniform sampler2D ImageTexture;
	uniform sampler2D AshTexture;
	uniform sampler2D AfterBurnTexture;
	uniform sampler2D NoiseTexture;
	uniform sampler2D NoiseTextureLQ;
	uniform sampler2D PointLightsTexture;
	uniform sampler2D RoughnessTexture;
	uniform sampler2D SurfaceMaterialColorTexture;
	uniform sampler2D NormalsTexture;
	uniform sampler2D SpotlightTexture;

	in vec2 vsOutTexCoords;
	in vec3 interpolatorWorldSpacePos;

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

	vec3 DecodeNormalTexture(vec3 normTex, float angleScale)
	{
		normTex.y = 1.0f - normTex.y;//Flip Y coord to align with DirectX UV Basis
		normTex.x = normTex.x * 2.0f - 1.0f;
	    normTex.y = normTex.y * 2.0f - 1.0f;
	    normTex.z = normTex.z * 2.0f - 1.0f;
		normTex.z *= angleScale;
		normTex.z *= -1.f;
	    return normalize(normTex);
	}

	#define PI 3.141592654f

	#define PAPER 0
	#define WOOD 0

	void main()
	{
		const float ImageMixRoughnessScale = 0.75f;
		const bool bInverseRoughness = false;
		const float TopSpecFadeScale = 2.0;
		const float NormalHarshness = float(` +
        MathLerp(0.5, 1.0, Math.random()) +
        /* glsl */ `);

		
		vec3 surfaceColor = vec3(0.0);

		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		highp vec2 ndcSpace = vec2(vsOutTexCoords.x * 2.f - 1.f, vsOutTexCoords.y * 2.f - 1.f);
		vec4 firePlaneImageTexture = textureLod(ImageTexture, vsOutTexCoords.xy, 0.0).rgba;

			//======================
			//		AFTER BURN
			//======================

			vec3 ashesColor = vec3(texture(AshTexture, vsOutTexCoords.xy).r) * 1.5;
			{
				vec2 ashesTintUV = vsOutTexCoords.xy * (0.1 + float(` +
        Math.random() * 0.6 +
        /* glsl */ `));
				ashesTintUV.x += float(` +
        Math.random() +
        /* glsl */ `);
				ashesTintUV.y += float(` +
        Math.random() +
        /* glsl */ `);
				const float ashesTintScale = float(` +
        (0.1 + Math.random() * 0.4) +
        /* glsl */ `);
				ashesColor += ashesTintScale * vec3(0., 0.725,  1.0) * MapToRange(textureLod(NoiseTextureLQ, ashesTintUV, 0.f).r, 0.4, 0.6, 0.0, 1.0);
			}
			//OutFirePlane = vec4(ashesColor.rgb, 1); return;
			const float kRandomOffset = float(` +
        MathLerp(0.01, 0.5, Math.random()) +
        /* glsl */ `);
			float afterBurnEmbers = texture(AfterBurnTexture, vsOutTexCoords.xy + vec2(kRandomOffset, 0.0)).r * 1.5;
			afterBurnEmbers = afterBurnEmbers * clamp(pow(length(vsOutTexCoords.xy - vec2(0.5) * 1.0f), 1.f), 0.0, 1.0);
			
			vec3 embersColor = vec3(afterBurnEmbers, afterBurnEmbers * 0.2, afterBurnEmbers * 0.1);
			float emberScale = 1.f;
		#if 1 //NOISE EMBERS SCALE
			float noiseConst = 0.5;
		
			vec3 noiseVec = textureLod(NoiseTextureLQ, vsOutTexCoords.xy - vec2(Time * 0.0013, Time * 0.0093), 0.f).rgb;
			float t = NoiseTextureInterpolator;
			if(t < 1.f)
			{
				emberScale = mix(noiseVec.x, noiseVec.y, t);
			}
			else if(t < 2.f)
			{
				emberScale = mix(noiseVec.y, noiseVec.z, t - 1.f);
			}
			else
			{
				emberScale = mix(noiseVec.z, noiseVec.x, t - 2.f);
			}
			emberScale = clamp(MapToRange(emberScale, 0.4, 0.6, 0.0, 1.0), 0.25f, 2.f);
			emberScale *= 1.5;
			emberScale *= clamp(noiseConst * 1.25, 0.5, 1.25);
		#endif

			embersColor = embersColor * 15.f * emberScale;

			ashesColor.rgb += embersColor;
			#if !(PAPER)
			ashesColor.b += (1.f - emberScale) * 0.05f;
			#endif

			ashesColor *= 0.75;

			vec3 burnedImageTexture = vec3(0.f);
		
			float luminance = firePlaneImageTexture.a;
			
			burnedImageTexture = luminance * 10.0 * vec3(1, 0.2, 0.1);
			vec3 finalAfterBurnColor = max(ashesColor.rgb, burnedImageTexture * 4.0f * max(0.5, emberScale));
			ashesColor.rgb = mix(finalAfterBurnColor * (1.0 - AfterBurnEmbersParam) * (1.0 - AfterBurnEmbersParam), max(0.75, (1.0 - AfterBurnEmbersParam * 0.75)) * max(ashesColor.rgb, vec3(min(0.9, luminance * 10.0) * 1.0)), clamp(emberScale * 0.5, 0.0, 1.0));

			//Vignette
			float vignette = 1.f - min(1.f, 0.5 * length(vec2((ndcSpace.x * 1.5), ndcSpace.y * 0.75)));
			vignette = min(1.f, 0.1 + vignette * 2.0f);
			vignette *= max(0.75, vsOutTexCoords.y);
			surfaceColor = ashesColor * vignette;

			const float shadowFadeThres = 0.01;
			if(vsOutTexCoords.y < shadowFadeThres)
			{
				surfaceColor *= MapToRange(vsOutTexCoords.y, shadowFadeThres, 0.0, 1.0, 0.75);
			}

		#if 1//RECT FADE BUMPY
			const highp float rectPow = 32.f;
			highp float rectCircleLength = pow(abs(ndcSpace.x), rectPow) + pow(abs(ndcSpace.y), rectPow);
			//float rectCircleLength = abs(vsOutTexCoords.x * 2.f - 1.f) + abs(vsOutTexCoords.y * 2.f - 1.f);
			const float rectCircleFadeStart = 0.8;
			const float edgeBumpScale = 1.0f;
			if(rectCircleLength > rectCircleFadeStart)
			{
				float f = clamp(1.f - MapToRange(rectCircleLength, rectCircleFadeStart, edgeBumpScale, 0.0, 1.0), 0.0, 1.0);
				float s = f;

				//surfaceColor *= clamp(s, min(1.0, 0.5 + vsOutTexCoords.y * 0.5), 1.0);

				vec2 bumpsSamplingUV = vsOutTexCoords.xy;
				bumpsSamplingUV *= 0.23f;

				bumpsSamplingUV += vec2(0.13, 0.15); //===================================================================!!!TODO: Randomise on boot=====!!!

				float bumpNoise = texture(NoiseTextureLQ, bumpsSamplingUV.xy).r;
				bumpNoise = min(1.f, Contrast(bumpNoise * 1.0, 2.5f));
				s = min(1.0, mix(bumpNoise, 1.0, s));
				surfaceColor *= s * s;
				//urfaceColor.r = s * s;

				s = f;
				bumpsSamplingUV = vsOutTexCoords.xy;
				bumpsSamplingUV *= 2.73f;
				bumpsSamplingUV += vec2(0.2, 0.3); //===================================================================!!!TODO: Randomise on boot=====!!!
				bumpNoise = texture(NoiseTextureLQ, bumpsSamplingUV.xy).r;
				bumpNoise = min(1.f, Contrast(bumpNoise * (1.25 + vsOutTexCoords.y * 0.25 + (1.0 - abs(ndcSpace.x)) * 0.5), 5.0f));
				s = clamp(mix(bumpNoise, 1.0, s), 0.0, 1.0);
				surfaceColor *= s * s;
				//surfaceColor.r = s;
			}
			if(rectCircleLength > 1.25)
			{
				surfaceColor *= 0.25f;
			}
		#elif 1 //RECT FADE SIMPLE
			const highp float rectPow = 4.f;
			highp float rectCircleLength = pow((ndcSpace.x), rectPow) + pow((ndcSpace.y), rectPow);
			const float rectCircleFadeStart = 1.8;
			if(rectCircleLength > rectCircleFadeStart)
			{
				float f = /* clamp */(1.f - MapToRange(rectCircleLength, rectCircleFadeStart, 2.0, 0.0, 1.0)/* , -1.0, 1.0 */);
				surfaceColor *= (f * f);
				//surfaceColor.r = f * f;
			}
		#endif//RECT FADE

		OutFirePlane = surfaceColor.rgb * 0.5;

	}`
    );
}
