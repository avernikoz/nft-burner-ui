export function GetShaderSourceBackgroundFloorRenderPerspectiveVS() {
    return /* glsl */ `#version 300 es

		precision highp float;
	
		layout(location = 0) in vec2 VertexBuffer;

		uniform vec4 CameraDesc;
		uniform float ScreenRatio;

		uniform float FloorScale;
		uniform float FloorOffset;
		uniform float FloorTexScale;

		uniform vec3 SpotlightPos;
		uniform vec3 SpotlightDirection;
	
		out vec2 vsOutTexCoords;
		out vec2 vsOutTexCoords2;

		out vec3 interpolatorWorldSpacePos;
		out vec3 interpolatorLightSpacePos;

		vec3 VectorRotateAroundX(vec3 vec, float angle)
		{
			vec3 res;
			res.x = vec.x;
			res.y = vec.y * cos(angle) - vec.z * sin(angle);
			res.z = vec.y * sin(angle) + vec.z * cos(angle);
			return res;
		}

		vec3 generateUpVector(vec3 direction) 
		{
    		vec3 rightVec = normalize(cross(direction, vec3(0.0, 1.0, 0.0)));
    		vec3 upVec = normalize(cross(rightVec, direction));
    		return upVec;
		}

		vec3 worldToViewWithoutMatrix(vec3 worldPosition, vec3 cameraPosition, vec3 camDir, vec3 cameraUp) 
		{
    		vec3 zAxis = camDir;
    		vec3 xAxis = normalize(cross(cameraUp, zAxis));
    		vec3 yAxis = cross(zAxis, xAxis);

    		vec3 delta = worldPosition - cameraPosition;

    		float x = dot(delta, xAxis);
    		float y = dot(delta, yAxis);
    		float z = dot(delta, zAxis);

    		return vec3(x, y, z);
		}

		vec4 worldToView(vec3 worldPosition, vec3 cameraPosition, vec3 cameraTarget, vec3 cameraUp)
		{
    		vec3 zAxis = normalize(cameraPosition - cameraTarget);
    		vec3 xAxis = normalize(cross(cameraUp, zAxis));
    		vec3 yAxis = cross(zAxis, xAxis);

    		mat4 viewMatrix = mat4(
    		    vec4(xAxis, 0.0),
    		    vec4(yAxis, 0.0),
    		    vec4(zAxis, 0.0),
    		    vec4(0.0, 0.0, 0.0, 1.0)
    		);
			
    		viewMatrix = transpose(viewMatrix);
    		viewMatrix[3] = vec4(-dot(xAxis, cameraPosition), -dot(yAxis, cameraPosition), -dot(zAxis, cameraPosition), 1.0);
			
    		vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
    
    		return viewPosition;
		}
	
		void main()
		{
			vec3 pos = vec3(VertexBuffer.xy, 0.0f);
			pos.z = pos.y;
			pos.y = 0.0; 
			
			pos *= FloorScale;

			pos.y += FloorOffset;
			interpolatorWorldSpacePos = pos;
			
			//light space
			vec3 upVec = generateUpVector(SpotlightDirection);
			interpolatorLightSpacePos = worldToViewWithoutMatrix(pos, SpotlightPos, SpotlightDirection, upVec).rgb;

			pos.xyz -= CameraDesc.xyz; 

			//Projection
			pos.xy *= CameraDesc.w;
			pos.x /= ScreenRatio;

			float w = 1.0f + (pos.z);
			gl_Position = vec4(pos.xy, 0.0, w);

			vec2 texcoord = (VertexBuffer.xy + 1.0) * 0.5;
			vsOutTexCoords2 = texcoord;
			vsOutTexCoords = texcoord * FloorTexScale; // Convert to [0, 1] range
		}`;
}

export function GetShaderSourceBackgroundFloorRenderPerspectivePS() {
    return /* glsl */ `#version 300 es
		
		precision highp float;
		precision highp sampler2D;
	
		layout(location = 0) out vec4 OutColor;
	
		uniform highp sampler2D ColorTexture;
		uniform highp sampler2D NormalTexture;
		uniform highp sampler2D RoughnessTexture;
		uniform highp sampler2D SpotlightTexture;
		uniform highp sampler2D PointLightsTexture;
		uniform highp sampler2D BloomTexture;
		uniform highp sampler2D SmokeNoiseTexture;
		uniform highp sampler2D OilTexture;
		uniform highp sampler2D PuddleTexture;
		
		uniform vec4 CameraDesc;
		uniform float ScreenRatio;
		uniform vec3 SpotlightPos;
		uniform vec3 SpotlightDirection;
		uniform vec3 SpotlightDesc;
		uniform vec2 ProjectedLightSizeScale;
		uniform float FloorBrightness;
		uniform float Time;
	
		in vec2 vsOutTexCoords;
		in vec2 vsOutTexCoords2;
		in vec3 interpolatorWorldSpacePos;
		in vec3 interpolatorLightSpacePos;
	
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

		vec3 DecodeNormalTexture(highp vec3 normTex, float angleScale)
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

		vec3 CalculateLightPBR(vec3 n, vec3 lightPos, vec3 camPos, vec3 pixelPos, vec3 albedo, float roughness, float metalness)
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

			float NdotL = max(dot(n, l), 0.25);   
    		return (kD * albedo /* * DiffuseIntensity */ /* / PI */ + specular *1.0/* * SpecularIntensityAndPower.x */) * radiance * NdotL; //final Radiance
		}

		vec4 RayAABBIntersection(vec3 rayOrigin, vec3 rayDirection, vec3 aabbCenter, vec3 aabbExtent)
		{
			// Calculate the inverse direction of the ray
			vec3 invDirection;
			invDirection.x = 1.0f / rayDirection.x;
			invDirection.y = 1.0f / rayDirection.y;
			invDirection.z = 1.0f / rayDirection.z;
		
			// Calculate the minimum and maximum t values for each axis
			float tmin = (aabbCenter.x - aabbExtent.x - rayOrigin.x) * invDirection.x;
			float tmax = (aabbCenter.x + aabbExtent.x - rayOrigin.x) * invDirection.x;
			float tymin = (aabbCenter.y - aabbExtent.y - rayOrigin.y) * invDirection.y;
			float tymax = (aabbCenter.y + aabbExtent.y - rayOrigin.y) * invDirection.y;
			float tzmin = (aabbCenter.z - aabbExtent.z - rayOrigin.z) * invDirection.z;
			float tzmax = (aabbCenter.z + aabbExtent.z - rayOrigin.z) * invDirection.z;
		
			// Find the maximum and minimum t values for intersection
			float tEnter = max(max(min(tmin, tmax), min(tymin, tymax)), min(tzmin, tzmax));
			float tExit = min(min(max(tmin, tmax), max(tymin, tymax)), max(tzmin, tzmax));
			
			vec4 result;//x:bool, y::distance, xz:tExit tEnter

			// Check if the intersection is outside the valid range
			if ((tExit < 0.f) || (tEnter > tExit))
			{
				result.x = -1.f;
			}
			else
			{
				result.x = 1.f;
			}
		
			// Set the intersection distance
			result.y = (tEnter >= 0.f) ? tEnter : tExit;

			result.z = tEnter;
			result.w = tExit;
		
			return result;
		}

		float GetLinePointDistance(vec3 LinePoint1, vec3 LinePoint2, vec3 Point)
		{
			vec3 PointVector = Point - LinePoint1;
			vec3 LineVector = LinePoint2 - LinePoint1;
		
			float LengthSq = dot(LineVector, LineVector);
		
			float PointProjectionScale = dot(PointVector, LineVector);
			PointProjectionScale = PointProjectionScale / LengthSq;
		
			vec3 DistanceVector = LineVector * PointProjectionScale;
			DistanceVector = PointVector - DistanceVector;
		
			return length(DistanceVector);
		}

		vec3 RayPlaneIntersectionWorldSpace(vec3 rayOrigin, vec3 rayDirection, vec3 planeNormal, float planeDistance) {
			float t = (planeDistance - dot(rayOrigin, planeNormal)) / dot(rayDirection, planeNormal);
			
			if (t >= 0.0) {
				return rayOrigin + t * rayDirection;  // Intersection point
			} else {
				return rayOrigin - 1.f;  // No intersection
			}
		}

		#define EPSILON 0.000001

		struct Ray {
			vec3 origin;
			vec3 direction;
		};
		
		struct Triangle {
			vec3 v0;
			vec3 v1;
			vec3 v2;
			vec2 uv0;
			vec2 uv1;
			vec2 uv2;
		};
		
		struct TriangleIntersectionResult {
			bool hit;
			vec3 intersectionPoint;
			vec3 barycentricCoords;
		};
		
		TriangleIntersectionResult intersectRayTriangle(Ray ray, Triangle triangle) {
			TriangleIntersectionResult result;
			result.hit = false;
		
			vec3 edge1 = triangle.v1 - triangle.v0;
			vec3 edge2 = triangle.v2 - triangle.v0;
			vec3 h = cross(ray.direction, edge2);
			float a = dot(edge1, h);
		
			if (a > -EPSILON && a < EPSILON) {
				return result;  // Ray is parallel to the triangle plane
			}
		
			float f = 1.0 / a;
			vec3 s = ray.origin - triangle.v0;
			result.barycentricCoords.x = f * dot(s, h);
		
			if (result.barycentricCoords.x < 0.0 || result.barycentricCoords.x > 1.0) {
				return result;
			}
		
			vec3 q = cross(s, edge1);
			result.barycentricCoords.y = f * dot(ray.direction, q);
		
			if (result.barycentricCoords.y < 0.0 || result.barycentricCoords.x + result.barycentricCoords.y > 1.0) {
				return result;
			}
		
			float t = f * dot(edge2, q);
		
			if (t > EPSILON) {
				result.hit = true;
				result.intersectionPoint = ray.origin + t * ray.direction;
			}
		
			return result;
		}

		vec2 barycentricToUV(vec3 barycentricCoords, vec2 uv0, vec2 uv1, vec2 uv2) {
			float u = barycentricCoords.x;
			float v = barycentricCoords.y;
			float w = 1.0 - u - v;
		
			vec2 uv = u * uv0 + v * uv1 + w * uv2;
		
			return uv;
		}
	
		void main()
		{
			//OutColor = vec4(vec3(vsOutTexCoords.x, 0.0, vsOutTexCoords.y), 1); return;
			//OutColor = vec4(vec3(1.0, 0.0, 1.0), 1.0); return;

			/* if(interpolatorWorldSpacePos.z > 2.f)
			{
				OutColor = vec4(vec3(vsOutTexCoords.x, 0.0, vsOutTexCoords.y), 1); return;
			} */

			vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
			vec2 materialSamplingUV = flippedUVs * 5.f;

			vec3 colorFinal = vec3(0.0);
			
			//Color
			vec3 imageColor = texture(ColorTexture, materialSamplingUV.xy).rgb;
			
			//imageColor = vec3(0.3);
			//OutColor = vec4(imageColor, 1.0); return;
			//imageColor *= 0.01f;

			//Roughness
			float roughness = texture(RoughnessTexture, materialSamplingUV.xy).r;
			//roughness = min(1.f, roughness * 5.f);
			//roughness = Contrast(roughness * 10.f, 5.f);

			//Normal
			highp vec3 normal = texture(NormalTexture, materialSamplingUV.xy).rgb;
			const float NormalHarshness = 1.0;
			normal = DecodeNormalTexture(normal, NormalHarshness);
			//rotate normals
			{
				float swap = -1.f * normal.z;
				normal.z = -1.f * normal.y;
				normal.y = swap;
			}

			vec3 camPos = CameraDesc.xyz;
			vec3 vToCam = normalize(camPos - interpolatorWorldSpacePos);
			vec3 spotlightPosViewSpace = SpotlightPos;
			vec3 vToLight = /* normalize */(SpotlightPos - interpolatorWorldSpacePos);
			float distanceToCurLight = length(vToLight);
			vToLight = normalize(vToLight);
			float LightRadius = SpotlightDesc.x;
			//float LightRadius = 100.f;
			float attenuation = clamp(1.f - (distanceToCurLight / LightRadius), 0.f, 1.f);

		#if 1//SSR
			vec3 reflectionColor = vec3(0.0);
			float planeWorldPosZ = 0.0f; 
			vec3 planeDirection = vec3(0.0, 0.0, -1.0);
			if(interpolatorWorldSpacePos.z < planeWorldPosZ)
			{
				vec3 vToCamForward = normalize(vec3(interpolatorWorldSpacePos.x, camPos.y, camPos.z-0.5) - interpolatorWorldSpacePos);
				const vec3 smoothNormal = vec3(0.0, 1.0, 0.0);
				//vec3 reflectionNormal = mix(smoothNormal, normal, roughness * 2.f);
				//vec3 reflectionVec = reflect(-vToCamForward, normal);
				vec3 reflectionVec = reflect(-vToCam, normal);

				//reflectionVec.x = 0.0;
				//reflectionVec.x = -vToCam.x;

				vec3 intersectionPosition = RayPlaneIntersectionWorldSpace(interpolatorWorldSpacePos, reflectionVec, planeDirection, planeWorldPosZ);
				if(intersectionPosition.z > (interpolatorWorldSpacePos.z - EPSILON))//we definitely hit further
				{
					//find screen space pos for current intersection pos
					vec3 intersectionPosScreenUV = vec3(intersectionPosition.x, intersectionPosition.y, intersectionPosition.z);
					intersectionPosScreenUV.xyz -= CameraDesc.xyz;
					intersectionPosScreenUV.xy *= CameraDesc.w;
					intersectionPosScreenUV.x /= ScreenRatio;
					intersectionPosScreenUV.xy /= (1.f + intersectionPosScreenUV.z);
					//map screen pos to UV, this is our sampling offset
					intersectionPosScreenUV.xy = (intersectionPosScreenUV.xy + 1.f) * 0.5;

					//get min allowed UV screen pos
					vec3 posScreenMin = vec3(interpolatorWorldSpacePos.x, interpolatorWorldSpacePos.y, planeWorldPosZ);
					posScreenMin.xyz -= CameraDesc.xyz;
					posScreenMin.xy *= CameraDesc.w;
					posScreenMin.x /= ScreenRatio;
					posScreenMin.xy /= (1.f + posScreenMin.z);
					//map screen pos to UV, this is our sampling offset
					posScreenMin.xy = (posScreenMin.xy + 1.f) * 0.5;

					if(all(greaterThan(intersectionPosScreenUV.xy, vec2(0.0, posScreenMin.y + 0.01))) && all(lessThan(intersectionPosScreenUV.xy, vec2(1.0))))
					{
						//fade out reflections as we approach the plane
						reflectionColor = texture(BloomTexture, intersectionPosScreenUV.xy).rgb;
						float s = clamp(MapToRange(interpolatorWorldSpacePos.z, planeWorldPosZ, -1.0, 0.0, 1.0), 0.0, 1.0);
						reflectionColor *= s;

						//distance fade
						s = clamp(MapToRange(interpolatorWorldSpacePos.z, planeWorldPosZ, -5.0, 1.0, 0.0), 0.0, 1.0);
						reflectionColor *= s;

						reflectionColor *= (1.0f - clamp((roughness), 0.0, 1.0));
						reflectionColor *= 2.f;
						reflectionColor *= 2.f;

						float reflNDotL = max(0.5, dot(normal, reflectionVec));
						reflectionColor *= reflNDotL;

						//imageColor += (pow(reflectionColor, vec3(2.0)) * (1.f - roughness)) * 5.f;
						//imageColor += reflectionColor;

					}
				}

				//OutColor = vec4(reflectionColor, 1.0); return;
				
			}
		#endif
			

			//Spotlight cutoff
			float SpotlightFalloff;
			vec3 vToLightModified = normalize(vec3(vToLight.x, vToLight.y, vToLight.z * 2.f));
			float curSpotlightAngle = dot(-vToLightModified, SpotlightDirection);
			vec2 Angles = vec2(SpotlightDesc.yz);
		#if 0//SIMPLE CUTOFF
			if(curSpotlightAngle < Angles.y)
			{
				SpotlightFalloff = 0.0f;
			}
			else
			{
				SpotlightFalloff = 1.0f;
				//SpotlightFalloff = pow(MapToRange(curSpotlightAngle, Angles.y, 1.0, 0.0, 1.0), 4.f);
			}
		#else
			vec2 SpotlightAngles;
			SpotlightAngles.x = 1.0f / (Angles.x - Angles.y);
			SpotlightAngles.y = Angles.y;
    		SpotlightFalloff = clamp((curSpotlightAngle - SpotlightAngles.y) * SpotlightAngles.x, 0.0, 1.0);
		#endif
			//SpotlightFalloff = 1.f;

			vec3 spotlightColor = vec3(SpotlightFalloff);

			#if 0//PROJECTION
			vec3 lightSpacePos = interpolatorLightSpacePos;
			lightSpacePos.xy /= (1.f + lightSpacePos.z);
			lightSpacePos.xy *= ProjectedLightSizeScale;
			//lightSpacePos.xy *= 2.f;
			lightSpacePos.xy = lightSpacePos.xy * 0.5 + 0.5;

			if(all(lessThan(lightSpacePos.xy, vec2(1.0))) && all(greaterThanEqual(lightSpacePos.xy, vec2(0.0)))) 
			{
				vec3 sc = texture(SpotlightTexture, lightSpacePos.xy).rgb;
				spotlightColor = sc;
				//OutColor = vec4(1.0, 0.0, 0.0, 1.0); return;
			}
			else
			{
				spotlightColor = vec3(0.0);
			}
			#endif

			float shadow = 1.f; 
		#if 1//SHADOW
			const vec3 planeCenter = vec3(0.0, 0.0, 0.0);
			vec3 planeExtent = vec3(1.0, 1.0, 0.01);
		
			//construct vertices
			vec3 vLeftDown = vec3(planeCenter.x - planeExtent.x, planeCenter.y - planeExtent.y, 0.0);
			vec3 vLeftUp = vec3(planeCenter.x - planeExtent.x, planeCenter.y + planeExtent.y, 0.0);
			vec3 vRightUp = vec3(planeCenter.x + planeExtent.x, planeCenter.y + planeExtent.y, 0.0);
			vec3 vRightDown = vec3(planeCenter.x + planeExtent.x, planeCenter.y - planeExtent.y, 0.0);
			vec2 uvLeftDown = vec2(0.0, 0.0);
			vec2 uvLeftUp = vec2(0.0, 1.0);
			vec2 uvRightUp = vec2(1.0, 1.0);
			vec2 uvRightDown = vec2(1.0, 0.0);
			
			Ray rayToLight;
			rayToLight.origin = interpolatorWorldSpacePos;
			rayToLight.direction = vToLight;

			//triangle right
			bool bHit = false;
			Triangle planeTriangle;
			planeTriangle.v0 = vRightUp;
			planeTriangle.v1 = vRightDown;
			planeTriangle.v2 = vLeftDown;

			planeTriangle.uv0 = uvLeftUp;
			planeTriangle.uv1 = uvRightUp;
			planeTriangle.uv2 = uvLeftDown;
			TriangleIntersectionResult triIntersectionRes = intersectRayTriangle(rayToLight, planeTriangle);
			if(triIntersectionRes.hit)
			{
				bHit = true;
			}
			else
			{
				planeTriangle.v0 = vLeftDown;
				planeTriangle.v1 = vLeftUp;
				planeTriangle.v2 = vRightUp;

				planeTriangle.uv0 = uvRightDown;
				planeTriangle.uv1 = uvLeftDown;
				planeTriangle.uv2 = uvRightUp;
				triIntersectionRes = intersectRayTriangle(rayToLight, planeTriangle);
				if(triIntersectionRes.hit)
				{
					bHit = true;
				}
			}

			if(bHit)
			{
				vec2 hitTriangleUV = barycentricToUV(triIntersectionRes.barycentricCoords, planeTriangle.uv0, planeTriangle.uv1, planeTriangle.uv2);
				/* float s = min(1.f, length(hitTriangleUV * 2.f - 1.f));
				s = pow(s, 4.f);
				s = max(0.f, s - hitTriangleUV.y);
				//shadow = s;
				shadow = mix(s, 0.0, hitTriangleUV.y); */

				float s = 0.f;
				//penumbra size depends on the distance to occluder + dist to light
				float dToSource = distanceToCurLight / 10.f;
				dToSource = pow(clamp(dToSource, 0.0, 1.0), 4.f);
				float dToOccluder = length(triIntersectionRes.intersectionPoint - interpolatorWorldSpacePos);
				dToOccluder = clamp(dToOccluder * 0.5, 0.0, 1.0);
				//OutColor = vec4(dToOccluder, 0.0, 0.0, 1.0); return;
				float horizonPenumbra = 1.f - (dToSource * 0.25 + dToOccluder * dToOccluder * 0.5) ; //higher value sharper penumbra
				vec2 rectSpacePos = hitTriangleUV * 2.f - 1.f;
				if(abs(rectSpacePos.x) > horizonPenumbra)
				{
					float m = MapToRange(abs(rectSpacePos.x), horizonPenumbra, 1.0, 0.0, 1.0);
					m = clamp(m, 0.0, 1.0);
					s += m;
				}

				const float verPenumbraScale = 0.5f;
				float vertPenumbra = 1.f - (dToSource + dToOccluder) * verPenumbraScale; //higher value sharper penumbra
				if(abs(rectSpacePos.y) > vertPenumbra)
				{
					float m = MapToRange(abs(rectSpacePos.y), vertPenumbra, 1.0, 0.0, 1.0);
					m = clamp(m, 0.0, 1.0);
					s += m;
				}

				//SSAO
				s *= min(1.f, dToOccluder * 10.f);

				shadow = clamp(s, 0.0, 1.0);
				shadow = clamp(shadow + (1.f - hitTriangleUV.y) * 0.1, 0.1, 1.0);
				
			}

			//SSAO
		const float planeSizeX = 1.f;
		if(abs(interpolatorWorldSpacePos.x) < planeSizeX)
		{
			vec3 occluderPos = vec3(interpolatorWorldSpacePos.x, -1.0, 0.0);
			const float ssaoRadius = 5.f;
			float distToOccluder = length(interpolatorWorldSpacePos - occluderPos);
			distToOccluder = 1.f - clamp(distToOccluder * 10.f, 0.0, 1.0);
			float fadeStart = 0.975;
			if(abs(interpolatorWorldSpacePos.x) > planeSizeX * fadeStart)
			{
				float m = MapToRange(abs(interpolatorWorldSpacePos.x), planeSizeX * fadeStart, 1.0, 1.0, 0.0);
				distToOccluder *= m;
			}
			shadow *= 1.f - clamp(distToOccluder, 0.0, 1.0);
		}
			
		#endif//SHADOW

		#if 1 //PBR
			normal = normalize(vec3(normal.x, normal.y, normal.z * -0.5));
			const float roughnessMin = 0.05; 
			colorFinal = CalculateLightPBR(normal, SpotlightPos, camPos, interpolatorWorldSpacePos, imageColor, clamp(roughness, roughnessMin, 1.0), 0.0);
			//colorFinal *= 0.5f;
			colorFinal *= attenuation;
			colorFinal *= spotlightColor;

			
			//colorFinal = min(vec3(1.0), colorFinal);
			colorFinal *= shadow;

			colorFinal.rgb += imageColor * reflectionColor * 1.f;
		#else
			//Diffuse
			float nDotL = max(0.0, dot(normal, vToLight));
			
			colorFinal = imageColor * nDotL * attenuation * SpotlightFalloff;

			//specular
			vec3 halfVecCur = normalize(vToLight + vToCam);
			float specularPowerScaledCur = mix(2.0, 256.0, 1.f - roughness) * 8.f;
			float specularCur = pow(max(0.f, dot(halfVecCur, normal)), specularPowerScaledCur);
			const float specularIntensityCur = 1.0f;
			colorFinal +=  nDotL * specularCur * specularIntensityCur * (1.f - roughness) * SpotlightFalloff * attenuation;
		#endif//PBR
			
	
			OutColor = vec4(colorFinal.rgb, 1);
	
		}`;
}

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

			//curFire = 0.1f;
			
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

export function GetShaderSourceSpotlightRenderVS() {
    return /* glsl */ `#version 300 es
	
			precision highp float;
		
			layout(location = 0) in vec2 VertexBuffer;
	
			uniform vec4 CameraDesc;
			uniform float ScreenRatio;
			uniform vec3 SpotlightPos;
			uniform vec3 SpotlightDirection;
			uniform vec2 SpotlightScale;
		
			out vec2 vsOutTexCoords;
		
			void main()
			{
				vec3 pos = vec3(VertexBuffer.xy, 0.0f);
				pos.y -= 1.f;
				pos.xy *= SpotlightScale;

			#if 1 //DIRECTION BASED TRANSFORM
				//pos.y *= 0.2;
				// Calculate the angle between the initial direction (1, 0) and the desired direction
				vec3 sd = normalize(vec3(SpotlightDirection.x, SpotlightDirection.y, 0.0));
				
				float angle = atan(sd.x, -sd.y);
				// Rotate the stretched position
				float cosAngle = cos(angle);
				float sinAngle = sin(angle);
				vec2 rotatedPosition = vec2(
					pos.x * cosAngle - pos.y * sinAngle,
					pos.x * sinAngle + pos.y * cosAngle
				);
				pos.xy = rotatedPosition;
			#endif

				pos.xy += SpotlightPos.xy;
				pos.z += SpotlightPos.z; //===============PROJECTION
				pos.xyz -= CameraDesc.xyz;
	
				pos.xy *= CameraDesc.w;
				pos.x /= ScreenRatio;
	
				gl_Position = vec4(pos.xy, 0.0, (1.f + pos.z));
				vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
			}`;
}

export function GetShaderSourceSpotlightRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out float outSpotlightColor;

	uniform sampler2D SpotlightTexture;

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

	void main()
	{
		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		if(vsOutTexCoords.y > 0.5)
		{
			//outSpotlightColor = 1.0f; return;
		}
		float light = texture(SpotlightTexture, flippedUVs.xy).r;

		vec2 uvNDC = MapToRange(vsOutTexCoords, 0.0, 1.0, -1.0, 1.0);
		const float horizontalFadeThres = 0.25;
		float s = 1.0;
		float v = abs(uvNDC.x);
		if(v > horizontalFadeThres)
		{
			float m = MapToRange(v, horizontalFadeThres, 1.0, 1.0, 0.0);
			s *= m;
		}
		const float verticalFadeThres = 0.9;
		v = abs(uvNDC.y);
		if(v > verticalFadeThres)
		{
			float m = MapToRange(v, verticalFadeThres, 1.0, 1.0, 0.0);
			s *= sqrt(m);
		}
		{
			float m = min(1.f, 0.5 * length(uvNDC));
			m = 1.f - m;
			s *= m;
		}
		light *= clamp(s, 0.0, 1.0);

		outSpotlightColor = light;

	}`;
}

export function GetShaderSourceLightFlareRenderVS() {
    return /* glsl */ `#version 300 es
	
			precision highp float;
		
			layout(location = 0) in vec2 VertexBuffer;
	
			uniform vec4 CameraDesc;
			uniform float ScreenRatio;
			uniform vec3 SpotlightPos;
			uniform vec2 SpotlightScale;
		
			out vec2 vsOutTexCoords;
		
			void main()
			{
				vec3 pos = vec3(VertexBuffer.xy, 0.0f);
				//pos.y -= 0.01f;
				pos.xy *= SpotlightScale * 0.75;
				pos.x *= 2.f;
				pos.xy += SpotlightPos.xy;
				pos.xy -= normalize(SpotlightPos.xy) * 0.05;
				pos.z += SpotlightPos.z;
				pos.xyz -= CameraDesc.xyz;
	
				pos.xy *= CameraDesc.w;
				pos.x /= ScreenRatio;
	
				gl_Position = vec4(pos.xy, 0.0, (1.f + pos.z));
				vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
			}`;
}
export function GetShaderSourceLightFlareRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outSpotlightColor;

	uniform sampler2D SpotlightTexture;

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

	void main()
	{
		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		if(vsOutTexCoords.y > 0.5)
		{
			//outSpotlightColor = 1.0f; return;
		}
		float light = texture(SpotlightTexture, flippedUVs.xy).r;


		outSpotlightColor = vec3(light * 2.0f);

	}`;
}

export function GetShaderSourceLightSourceSpriteRenderVS() {
    return /* glsl */ `#version 300 es
	
			precision highp float;
		
			layout(location = 0) in vec2 VertexBuffer;
	
			uniform vec4 CameraDesc;
			uniform float ScreenRatio;
			uniform vec3 SpotlightPos;
			uniform vec3 SpotlightDirection;
			uniform vec2 SpotlightScale;
		
			out vec2 vsOutTexCoords;

			mat3 rotate_object(vec3 direction) {
				vec3 zaxis = normalize(direction);
				vec3 xaxis = normalize(cross(vec3(0.0, 1.0, 0.0), zaxis));
				vec3 yaxis = cross(zaxis, xaxis);
				return mat3(
					(xaxis),
					(yaxis),
					(zaxis)
				);
			}

			vec3 rotatePoint(vec3 point, vec3 new_normal) {
				mat3 rotMat = rotate_object(new_normal);
				return rotMat * point;
			}
		
			void main()
			{
				vec3 pos = vec3(VertexBuffer.xy, 0.0f);
				pos.xy *= 0.125;
				pos = rotatePoint(pos, -SpotlightDirection);
				pos.xy += (SpotlightPos.xy);
				pos.xy -= normalize(SpotlightPos.xy) * 0.05;
				pos.z += SpotlightPos.z;
				pos.xyz -= CameraDesc.xyz;
	
				pos.xy *= CameraDesc.w;
				pos.x /= ScreenRatio;
	
				gl_Position = vec4(pos.xy, 0.0, (1.f + pos.z));
				vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
			}`;
}
export function GetShaderSourceLightSourceSpriteRenderPS() {
    return /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec3 outSpotlightColor;

	uniform sampler2D SpotlightTexture;

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

	void main()
	{
		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		if(vsOutTexCoords.y > 0.5)
		{
			//outSpotlightColor = 1.0f; return;
		}
		vec3 light = vec3(1.f);
		//light = texture(SpotlightTexture, flippedUVs.xy).rgb * 5.f;

		float s = length(vsOutTexCoords - vec2(0.5));
		if(s > 0.5)
		{
			s += 0.5f;
			//light = vec3(0.0f);
		}

		light *= pow(1.f - clamp(s, 0.0, 1.0), 2.f);

		outSpotlightColor = vec3(min(vec3(1.0), light * 2.0f));

	}`;
}
