import { MathLerp } from "../utils";

function scTransformBasedOnMotion(condition: boolean) {
    if (condition) {
        return /* glsl */ `/* pos.y *= 0.2;
		// Calculate the angle between the initial direction (1, 0) and the desired direction
		float angle = atan(Velocity.y, Velocity.x);
		// Rotate the stretched position
		float cosAngle = cos(angle);
		float sinAngle = sin(angle);
		vec2 rotatedPosition = vec2(
			pos.x * cosAngle - pos.y * sinAngle,
			pos.x * sinAngle + pos.y * cosAngle
		);
		pos = rotatedPosition; */
		
		
		float velLength = length(Velocity) * 100.0 /* * 0.10 */;
		if(velLength > 0.f)
		{
			velLength = min(1.0, velLength);
			pos.y *= clamp(1.f - velLength * 0.5, 0.75f, 1.f);
			pos.x *= (1.f + velLength * 2.0);

			// Calculate the angle between the initial direction (1, 0) and the desired direction
			float angle = atan(Velocity.y, Velocity.x);

			// Rotate the stretched position
			float cosAngle = cos(angle);
			float sinAngle = sin(angle);
			vec2 rotatedPosition = vec2(
				pos.x * cosAngle - pos.y * sinAngle,
				pos.x * sinAngle + pos.y * cosAngle
			);
			
			pos = rotatedPosition;

		}
		
		
		`;
    } else {
        return ``;
    }
}

export function GetShaderSourceApplyFireVS(bMotion: boolean) {
    return (
        /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;
	layout(location = 1) in vec2 TexCoordsBuffer;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform vec3 FirePlanePositionOffset;

	uniform vec2 PointerPositionOffset;//ViewSpace
	uniform vec3 Orientation;
	uniform vec2 SizeScale;
	uniform vec2 Velocity;

	out vec2 vsOutTexCoords;

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

	vec2 rotateVectorWithRoll(vec2 v, float roll) {
		// Calculate sine and cosine of the roll angle
		float cosRoll = cos(roll);
		float sinRoll = sin(roll);
	
		// Rotation matrix for roll
		mat2 rotationMatrix = mat2(
			cosRoll, -sinRoll,
			sinRoll, cosRoll
		);
	
		// Rotate the vector
		vec2 rotatedVector = rotationMatrix * v;
	
		return rotatedVector;
	}

	void main()
	{
		vsOutTexCoords = TexCoordsBuffer;

		vec2 pos = VertexBuffer.xy;
		pos = rotateVectorWithRoll(pos.xy, Orientation.z);

	//Rotate based on velocity
	` +
        scTransformBasedOnMotion(bMotion) +
        /* glsl */ `

		vec2 scale = vec2(1.0);
		scale *= SizeScale;
		
		//calculate offset
		vec2 posOffset = PointerPositionOffset.xy;
		
		pos = (pos.xy * scale.xy) + posOffset.xy;
		
		gl_Position = vec4(pos.xy, 0.0, 1.0);
	}`
    );
}

export function GetShaderSourceApplyFirePaintVS() {
    return (
        /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;
	layout(location = 1) in vec2 TexCoordsBuffer;

	uniform vec4 CameraDesc;
	uniform float ScreenRatio;
	uniform vec3 FirePlanePositionOffset;

	uniform vec2 PointerPositionOffset;
	uniform vec2 PosPrev;
	uniform vec2 SizeScale;
	uniform vec2 VelocityLengthCurPrev;
	uniform float DeltaTime;

	out vec2 vsOutTexCoords;
	out float interpolatorLengthRatio;

	void main()
	{
		vsOutTexCoords = TexCoordsBuffer;
		
		//Compute Thickness
		const float thicknessScale = 50.0;

		float sizeInitial = SizeScale.x * 15.0;

		const float minSize = 0.0025;
		float thicknessCur = max(minSize, sizeInitial * max(0.0, (1.0 - VelocityLengthCurPrev.y * thicknessScale)));
		float thicknessPrev = max(minSize, sizeInitial * max(0.0, (1.0 - VelocityLengthCurPrev.x * thicknessScale)));

		vec3 curPos = vec3(PointerPositionOffset.xy, 0.0);
		vec3 prevPos = vec3(PosPrev.xy, 0.0);
	
		//Length can't be lower than cur thickness
		float thicknessMax = max(thicknessCur, thicknessPrev);
		float lengthScale = 1.3;
		if(VelocityLengthCurPrev.x > 0.02 )
		{
			lengthScale = 1.05;
		}
		float maxThicknessScale = 1.0;
		if(VelocityLengthCurPrev.x < 0.01)
		{
			maxThicknessScale = 1.0;
		}
		{
			vec2 rayOrigin = PointerPositionOffset;
			vec2 rayDirection = PosPrev - rayOrigin;
			float length = length(rayDirection);
			prevPos.xy = rayOrigin + normalize(rayDirection) * max(thicknessMax * maxThicknessScale, length * lengthScale);
		}
		{
			vec2 rayOrigin = PosPrev;
			vec2 rayDirection = PointerPositionOffset - rayOrigin;
			float length = length(rayDirection);
			curPos.xy = rayOrigin + normalize(rayDirection) * max(thicknessMax * maxThicknessScale, length * lengthScale);
		}
		

		interpolatorLengthRatio = length(curPos.xy - prevPos.xy) / (thicknessMax * 2.0);

		vec3 curDir = normalize(curPos - prevPos);
		const vec3 dirToCam = vec3(0.0, 0.0, 1.0);

		vec3 n = cross(curDir, dirToCam);
		n.z = 0.0;

		
		n = normalize(n);

		vec3 verts[4];

		verts[0] = prevPos - n * thicknessPrev;
		verts[1] = curPos - n * thicknessCur;
		verts[2] = curPos + n * thicknessCur;
		verts[3] = prevPos + n * thicknessPrev;

		vec2 uv[4];

		////Clockwise, starting from left down
		uv[0] = vec2(0.0, 0.0);
		uv[1] = vec2(0.0, 1.0);
		uv[2] = vec2(1.0, 1.0);
		uv[3] = vec2(1.0, 0.0);

		uint vertId = uint(gl_VertexID);
		vec3 pos = verts[3];
		vsOutTexCoords = uv[3];
		if(vertId == 0u || vertId == 3u)
		{
			pos = verts[0];
			vsOutTexCoords = uv[0];
		}
		else if(vertId == 1u)
		{
			pos = verts[1];
			vsOutTexCoords = uv[1];
		}
		else if(vertId == 2u || vertId == 4u)
		{
			pos = verts[2];
			vsOutTexCoords = uv[2];
		}
		
		gl_Position = vec4(pos.xy, 0.0, 1.0);


		
	}`
    );
}


export const ShaderSourceApplyFirePS =
    /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out float OutFire;
	layout(location = 1) out float OutPaint;

	uniform float AppliedFireStrength;
	uniform float Time;
	uniform int bSmoothOutEdges;
	uniform int bApplyFireUseNoise;
	uniform int bApplyFireUseMask;


	uniform sampler2D ColorTexture;
	uniform sampler2D MaskTexture;


	in vec2 vsOutTexCoords;
	in float interpolatorLengthRatio;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	float rand(vec2 co) {
		return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
	}

	void main()
	{
		vec2 texCoords = vsOutTexCoords;

		float s = 1.0; //Net Color Scale

		

		texCoords.y = 1.f - texCoords.y;
		
		float Fire = AppliedFireStrength;

	#if 0 //CAPSULE
		//if(interpolatorLengthRatio > 1.0)
		{
			vec2 st = vsOutTexCoords.yx;
		
			vec2 objectSize = vec2(interpolatorLengthRatio * 1.5, 1.0);
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
					s = 0.0;
				}
			}
			else if(objectSpacePos.x < circle2Pos.x)
			{
				float distToCircle1 = length(objectSpacePos - circle2Pos);
				if(distToCircle1 > radius)
				{
					s = 0.0;
				}
			}

		}

		//else
		{	

			/* if(s < 0.45)
			{
				s = 0.0;
			}
			else
			{
				s = 1.0;
			} */

			/* const float thres = 0.75;
			if(bSmoothOutEdges == 0)
			{
				
				if(s < thres)
				{
					const float sThres = 0.6;
					if(s > sThres)
					{
						//s = MapToRange(s, sThres,thres, 0.75, 1.0);
						s = 1.0;
					}
					else
					{
						s = 0.0;
					}
				}
				else
				{
					s = 1.0;
				}
			}
			else
			{
				if(s < 0.3)
				{
					s = 0.0;
				}
				else
				{
					s = 1.0;
				}
			} */

		}

	#endif

		// Calculate the distance from the center
		float l = length(texCoords - vec2(0.5));	
		l = min(1.0, l);
		l = 1.f - l;

		if(bApplyFireUseMask > 0)
		{	
			s *= texture(MaskTexture, texCoords.xy).r;
		}

		if(bApplyFireUseNoise > 0)
		{
			vec3 noise = texture(ColorTexture, (texCoords.xy + Time) * float(` +
    MathLerp(0.05, 0.4, Math.random()) +
    /* glsl */ `)).rgb;
			noise.r = MapToRange(noise.r, 0.4, 0.6, 0.0, 1.0);
			noise.g = MapToRange(noise.g, 0.4, 0.6, 0.0, 1.0);
			noise.b = MapToRange(noise.b, 0.4, 0.6, 0.0, 1.0);
			noise.r = noise.r * noise.g * noise.b;
			s *= (noise.r * noise.r * noise.r);
		}
		
	#if 0 //blur border
		const float thres = 0.1;
		if(vsOutTexCoords.x > (1.0 - thres))
		{
			s *= MapToRange(vsOutTexCoords.x, 1.0 - thres, 1.0, 1.0, 0.0);
		}
		else if(vsOutTexCoords.x < thres)
		{
			s *= MapToRange(vsOutTexCoords.x, 0.0, thres, 0.0, 1.0);
		}
	#endif

		
		OutFire = Fire * s;

		s *= rand(vsOutTexCoords * 100.0);
		OutPaint = 1.0 * s;
	}`;

export const ShaderSourceFireUpdatePS =
    /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out float OutFire;
	layout(location = 1) out float OutFuel;

	uniform float DeltaTime;
	uniform float Time;
	uniform float NoiseTextureInterpolator;

	uniform highp sampler2D FireTexture;
	uniform highp sampler2D FuelTexture;
	uniform highp sampler2D NoiseTexture;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		ivec2 SampleCoord = ivec2(gl_FragCoord.xy);

		float curFire = texelFetch(FireTexture, SampleCoord, 0).r;
		float curFuel = texelFetch(FuelTexture, SampleCoord, 0).r;
		//curFuel = 0.001f;
		
		const float kMutualScale = 1.0 + float(` + Math.random() * 1.5 + /* glsl */ `);
		const float GFireSpreadSpeed = 3. * kMutualScale;
		const float NoiseAdvectedSpreadStrength = 0.45f;
		const float GFuelConsumeSpeed = float(` + MathLerp(0.4, 0.9, Math.random()) + /* glsl */ `) * kMutualScale;
		const float GFireDissipationSpeed = 0.5f * kMutualScale; //How fast fire fades when no more fuel is left. Try 0.05
		const float kIgnitionThreshold = 0.75; //When pixel becomes a source of fire
		const float kHeatRaiseSpeedDuringCombustion = 1.0;
		const float kMaxHeat = 100.0;

		/* const float GFireSpreadSpeed = 10.;
		const float NoiseAdvectedSpreadStrength = 0.45f;
		const float GFuelConsumeSpeed = 2.5f;
		const float GFireDissipationSpeed = 1.0f; */

		if(curFuel > 0.0)
		{
			/* 
			Fire Spread
			*/
			float originalFireValue = curFire;
		
			//read neighbor fire values
			float neighborFire;

			const float weight = 1.f / 8.f;

			float accumulatedFire = 0.f;

		#if 1//SIDES SPREAD
			//right
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(1, 0), 0).r;
			if(neighborFire > originalFireValue && neighborFire > kIgnitionThreshold)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
			if(SampleCoord.x > 0)
			{
				//left
				neighborFire = texelFetch(FireTexture, SampleCoord - ivec2(1, 0), 0).r;
				if(neighborFire > originalFireValue && neighborFire > kIgnitionThreshold)
				{
					accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
				}
			}	
			if(SampleCoord.y > 0)
			{
				//up
				neighborFire = texelFetch(FireTexture, SampleCoord - ivec2(0, 1), 0).r;
				if(neighborFire > originalFireValue && neighborFire > kIgnitionThreshold)
				{
					accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
				}
			}	
			//down
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(0, 1), 0).r;
			if(neighborFire > originalFireValue && neighborFire > kIgnitionThreshold)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
		#endif//SIDES SPREAD

		#if 1//RAND LENGTH SIDES SPREAD
		{
			//map to UV
			const float fireTextureSize = 512.0;
			vec2 texCoords = vec2((float(SampleCoord.x) + 0.5) / (fireTextureSize), (float(SampleCoord.y) + 0.5) / (fireTextureSize));

			vec2 noiseSamplingUV = vec2(0.0);
			noiseSamplingUV = vec2(Time * 0.13, Time * 0.093);
			float noiseConst = textureLod(NoiseTexture, noiseSamplingUV, 0.f).r;
			const float samplingLengthMin = 0.05;
			noiseConst = clamp(MapToRange(noiseConst, 0.4, 0.6, samplingLengthMin, 1.0), samplingLengthMin, 1.0);
			float samplingLength = noiseConst * 0.1;
			float distWeight = 1.0 - noiseConst;
			distWeight *= distWeight;
			distWeight *= 0.01;
			//right
			neighborFire = textureLod(FireTexture, texCoords + vec2(samplingLength, 0), 0.f).r;
			if(neighborFire > originalFireValue /* && neighborFire > kIgnitionThreshold */)
			{
				accumulatedFire += neighborFire * weight * distWeight * GFireSpreadSpeed * DeltaTime;
			}	
			//left
			neighborFire = textureLod(FireTexture, texCoords - vec2(samplingLength, 0), 0.f).r;
			if(neighborFire > originalFireValue /* && neighborFire > kIgnitionThreshold */)
			{
				accumulatedFire += neighborFire * weight * distWeight * GFireSpreadSpeed * DeltaTime;
			}	
			//up
			//fire is pointing upwards so enhance the spread here
			neighborFire = textureLod(FireTexture, texCoords - vec2(0, samplingLength * 2.0), 0.f).r;
			if(neighborFire > originalFireValue /* && neighborFire > kIgnitionThreshold */)
			{
				//accumulatedFire += neighborFire * weight * distWeight * GFireSpreadSpeed * DeltaTime;
				accumulatedFire += neighborFire * weight * distWeight * 25.f * GFireSpreadSpeed * DeltaTime;
			}	
			//down
			neighborFire = textureLod(FireTexture, texCoords + vec2(0, samplingLength), 0.f).r;
			if(neighborFire > originalFireValue /* && neighborFire > kIgnitionThreshold */)
			{
				accumulatedFire += neighborFire * weight * distWeight * GFireSpreadSpeed * DeltaTime;
			}
		}
		#endif

		const vec3 kRandomValues = vec3(float(` +
    Math.random() +
    /* glsl */ `), float(` +
    Math.random() +
    /* glsl */ `),
		float(` +
    Math.random() +
    /* glsl */ `)
		);

		#if 1//NOISE UV SPREAD
		{
			vec2 noisePrecisionMinMax = vec2(0.01, 0.25);
			float noisePrecision = mix(noisePrecisionMinMax.x, noisePrecisionMinMax.y, kRandomValues.x);
			vec2 offsetLengthMinMax = vec2(0.01, 0.1); //>= 0.2 for cool effects
			float offsetLength = mix(offsetLengthMinMax.x, offsetLengthMinMax.y, kRandomValues.y);

			//map to UV
			const float fireTextureSize = 512.0;
			vec2 texCoords = vec2((float(SampleCoord.x) + 0.5) / (fireTextureSize), (float(SampleCoord.y) + 0.5) / (fireTextureSize));
			vec2 noiseSamplingUV = texCoords;
			noiseSamplingUV *= noisePrecision;
			const float noiseChangeSpeed = float(`+(Math.random() * 10.0)+/* glsl */`);
			noiseSamplingUV += vec2(Time * 0.00013, Time * 0.000093) * noiseChangeSpeed;
			vec3 noiseVec3 = textureLod(NoiseTexture, noiseSamplingUV, 0.f).rgb;
			vec2 noiseDirVec = noiseVec3.rg;
			{
				float t = mod(Time, 8.0) * 0.25;
				if(t > 1.0)
				{
					noiseDirVec.x = mix(noiseVec3.z, noiseVec3.x, 2.0 - t);
				}
				else
				{
					//t < 1
					noiseDirVec.x = mix(noiseVec3.x, noiseVec3.z, t);
				}
			}
			noiseDirVec.x = clamp(MapToRange(noiseDirVec.x, 0.4, 0.6, -1.0, 1.0), -1.0, 1.0);
			noiseDirVec.y = clamp(MapToRange(noiseDirVec.y, 0.4, 0.6, -1.0, 1.0), -1.0, 1.0);

			float distWeight = 1.f - min(1.0, length(noiseDirVec));
			distWeight *= distWeight;

			noiseDirVec *= offsetLength;

			neighborFire = textureLod(FireTexture, texCoords + noiseDirVec, 0.f).r;
			if(neighborFire > originalFireValue && neighborFire > kIgnitionThreshold * 0.5)
			{
				accumulatedFire += neighborFire * distWeight * NoiseAdvectedSpreadStrength * GFireSpreadSpeed * DeltaTime;
			}

		}
		#endif

		#if 0//CORNERS SPREAD
			neighborFire = texelFetch(FireTexture, SampleCoord - ivec2(1, 1), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(1, 1), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}	
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(-1, 1), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}	
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(1, -1), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
	#endif//CORNERS SPREAD

			vec3 noiseTexture = texelFetch(NoiseTexture, SampleCoord, 0).rgb;

		#if 0//NOISE BASED SPREAD
			vec2 noiseVec = noiseTexture.xy;
			noiseVec = noiseVec * 2.f - 1.f;
			//noiseVec = normalize(noiseVec) * 2.f;
			noiseVec = normalize(noiseVec) + 0.5f;
			//noiseVec *= 0.5;
			ivec2 noiseVecOffset = ivec2(floor(noiseVec));
			neighborFire = texelFetch(FireTexture, (SampleCoord + noiseVecOffset), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * NoiseAdvectedSpreadStrength * GFireSpreadSpeed * DeltaTime;
			}
		#endif

		#if 1//NOISE
			float finalNoise;

			if(NoiseTextureInterpolator < 1.f)
			{
				finalNoise = mix(noiseTexture.x, noiseTexture.y, NoiseTextureInterpolator);
			}
			else if(NoiseTextureInterpolator < 2.f)
			{
				finalNoise = mix(noiseTexture.y, noiseTexture.z, fract(NoiseTextureInterpolator));
			}
			else
			{
				finalNoise = mix(noiseTexture.z, noiseTexture.x, fract(NoiseTextureInterpolator));
			}
			accumulatedFire *= max(finalNoise, 0.85f);
		#endif

			curFire += accumulatedFire;
			curFire = min(kMaxHeat, curFire);

			/* 
			Fuel Consume
			*/
			if(curFire > max(1.0, kIgnitionThreshold))
			{
				curFuel = max(0.0, curFuel - clamp(curFire, 0.1, 0.5) * GFuelConsumeSpeed * DeltaTime); 
				//curFuel = max(0.0, curFuel - clamp(curFire, 0.0, 2.0) * GFuelConsumeSpeed * DeltaTime); 

				if(curFire < kMaxHeat * 0.5)
				{
					curFire += kHeatRaiseSpeedDuringCombustion * DeltaTime;
				}
			}


		}
		else
		{
			/* 
			Fire Dissipation
			*/
			if(curFire > 0.01)
			{
				curFire -= curFire * GFireDissipationSpeed * DeltaTime;
			}
		}

		OutFuel = curFuel;
		OutFire = min(kMaxHeat, curFire);

	}`;
