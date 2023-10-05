export const ShaderSourceApplyFireVS = /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;
	layout(location = 1) in vec2 TexCoordsBuffer;

	uniform vec2 GPositionOffset;
	uniform float SizeScale;
	uniform vec2 VelocityDir;

	out vec2 vsOutTexCoords;

	void main()
	{
		vsOutTexCoords = TexCoordsBuffer;

		vec2 pos = VertexBuffer.xy;
		pos.y *= 0.2;

		// Calculate the angle between the initial direction (1, 0) and the desired direction
		float angle = atan(VelocityDir.y, VelocityDir.x);
	
		// Rotate the stretched position
		float cosAngle = cos(angle);
		float sinAngle = sin(angle);
		vec2 rotatedPosition = vec2(
			pos.x * cosAngle - pos.y * sinAngle,
			pos.x * sinAngle + pos.y * cosAngle
		);

		pos = rotatedPosition;


		gl_Position = vec4(SizeScale * 2.5f * (pos.xy) + GPositionOffset.xy, 0, 1);
	}`;
export const ShaderSourceApplyFirePS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	out float OutColor;

	uniform sampler2D ColorTexture;

	in vec2 vsOutTexCoords;

	void main()
	{
		vec2 texCoords = vsOutTexCoords;
		texCoords.y = 1.f - texCoords.y;
		//vec4 Color = texture(ColorTexture, texCoords.xy).r;

		//Color.r = clamp((Color.r - 0.4) * 100.f, 0.5f, 1.f);
		const float AppliedFireIntensity = 1.5f;
		float Fire = AppliedFireIntensity;

		// Calculate the distance from the center
		vec2 center = vec2(0.5, 0.5); // Assuming center is at (0.5, 0.5)
		float distance = length(texCoords - center);	
		// Define the circle radius and threshold
		float radius = 0.555; // Adjust this value to change the circle size	
		// Create a circle mask
		float circleMask = smoothstep(radius, radius - 0.01, distance);	
		Fire *= (1.f - distance);


		OutColor = Fire;
	}`;
export const ShaderSourceFullscreenPassVS = /* glsl */ `#version 300 es

	precision highp float;

	layout(location = 0) in vec2 VertexBuffer;

	out vec2 vsOutTexCoords;

	void main()
	{
		gl_Position = vec4(VertexBuffer.xy, 0.0, 1.0);
		vsOutTexCoords = (VertexBuffer.xy + 1.0) * 0.5; // Convert to [0, 1] range
	}`;

export const ShaderSourceFireUpdatePS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out float OutFire;
	layout(location = 1) out float OutFuel;

	uniform float DeltaTime;
	uniform float NoiseTextureInterpolator;

	uniform sampler2D FireTexture;
	uniform sampler2D FuelTexture;
	uniform sampler2D NoiseTexture;

	void main()
	{
		ivec2 SampleCoord = ivec2(gl_FragCoord.xy);

		float curFire = texelFetch(FireTexture, SampleCoord, 0).r;
		float curFuel = texelFetch(FuelTexture, SampleCoord, 0).r;

		const float GFireSpreadSpeed = 10.;
		const float GFuelConsumeSpeed = 2.5f;
		const float GFireDissipationSpeed = 1.0f;

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

		#if 1//SIDES
			//right
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(1, 0), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
			if(SampleCoord.x > 0)
			{
				//left
				neighborFire = texelFetch(FireTexture, SampleCoord - ivec2(1, 0), 0).r;
				if(neighborFire > originalFireValue)
				{
					accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
				}
			}	
			if(SampleCoord.y > 0)
			{
				//up
				neighborFire = texelFetch(FireTexture, SampleCoord - ivec2(0, 1), 0).r;
				if(neighborFire > originalFireValue)
				{
					accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
				}
			}	
			//down
			neighborFire = texelFetch(FireTexture, SampleCoord + ivec2(0, 1), 0).r;
			if(neighborFire > originalFireValue)
			{
				accumulatedFire += neighborFire * weight * GFireSpreadSpeed * DeltaTime;
			}
		#endif

		#if 0//CORNERS
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
	#endif//CORNERS

			vec3 noiseTexture = texelFetch(NoiseTexture, SampleCoord, 0).rgb;

		#if 1//NOISE BASED SPREAD
			vec2 noiseVec = noiseTexture.xy;
			noiseVec = noiseVec * 2.f - 1.f;
			//noiseVec = normalize(noiseVec) * 2.f;
			noiseVec = normalize(noiseVec) + 0.5f;
			//noiseVec *= 0.5;
			ivec2 noiseVecOffset = ivec2(floor(noiseVec));
			neighborFire = texelFetch(FireTexture, (SampleCoord + noiseVecOffset), 0).r;
			if(neighborFire > originalFireValue)
			{
				const float NoiseAdvectedSpreadStrength = 0.35f;
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
			accumulatedFire *= max(finalNoise, 0.75f);
		#endif

			curFire += accumulatedFire;

			/* 
			Fuel Consume
			*/
			if(curFire > 1.f)
			{
				curFuel -= clamp(curFire, 0.1, 0.5) * GFuelConsumeSpeed * DeltaTime; 
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
		OutFire = curFire;

	}`;

export const ShaderSourceFireVisualizerPS = /* glsl */ `#version 300 es
	
	precision highp float;
	precision highp sampler2D;

	layout(location = 0) out vec4 OutFirePlane;

	uniform float NoiseTextureInterpolator;
	uniform float Time;

	uniform sampler2D FireTexture;
	uniform sampler2D FuelTexture;
	uniform sampler2D FlameColorLUT;
	uniform sampler2D ImageTexture;
	uniform sampler2D AshTexture;
	uniform sampler2D AfterBurnTexture;
	uniform sampler2D NoiseTexture;

	in vec2 vsOutTexCoords;

	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}

	void main()
	{
		ivec2 SampleCoord = ivec2(gl_FragCoord.xy);

		float curFire = texture(FireTexture, vsOutTexCoords.xy).r;
		float curFuel = texture(FuelTexture, vsOutTexCoords.xy).r;

		//vec3 imageColor = texture(ImageTexture, vsOutTexCoords.xy).rgb;
		vec2 flippedUVs = vec2(vsOutTexCoords.x, 1.f - vsOutTexCoords.y);
		vec3 imageColor = texture(ImageTexture, flippedUVs.xy).rgb * 0.5;

		vec3 ashesColor = texture(AshTexture, vsOutTexCoords.xy).rgb * 0.25;
		float afterBurnNoise = texture(AfterBurnTexture, vsOutTexCoords.xy).r;
		vec3 embersColor = vec3(afterBurnNoise, afterBurnNoise * 0.2, afterBurnNoise * 0.1);
		ashesColor.rgb += embersColor * 10.f;

		vec3 paperColor = ashesColor;

		if(curFuel > 0.)
		{
			paperColor = mix(ashesColor, imageColor, /* saturate */(curFuel));
		}

		vec3 fireColor;
	#if 0 //USE LUT
		float uvu = clamp(MapToRange(curFire, 0., 7.5, 0.01, 1.), 0.01f, 0.99f);
		//float uvu = clamp(curFire, 0.f, 1.f);
		fireColor = texture(FlameColorLUT, vec2(uvu, 0.5)).rgb;
		//fireColor = vec3(uvu,uvu,uvu);
	#else

		const float FireBrightnessScale = 0.5f;

		curFire *= FireBrightnessScale;

		vec3 brightFlameColor = vec3(curFire, curFire * 0.2, curFire * 0.1);
		vec3 lowFlameColor = vec3(curFire * 0.1f, curFire * 0.2, curFire);
		if(curFire > 1.f)
		{
			fireColor = brightFlameColor;
		}
		else
		{
			float t = 1.f - sqrt(1.f - curFire * curFire);
			//float t = curFire;
			fireColor = mix(lowFlameColor, brightFlameColor, t);
		}

		#if 1//ADD NOISE TO FIRE COLOR
		vec2 noiseUV = vec2(vsOutTexCoords.x + Time * 0.01, vsOutTexCoords.y - Time * 0.2);
		//noiseUV *= 0.35f;
		noiseUV *= 1.5f;
		vec3 noiseTexture = texture(NoiseTexture, noiseUV.xy).rgb;
		float fireScale = 1.f;
		fireScale = noiseTexture.r;
		/* if(NoiseTextureInterpolator < 1.f)
		{
			fireScale = mix(noiseTexture.x, noiseTexture.y, NoiseTextureInterpolator);
		}
		else if(NoiseTextureInterpolator < 2.f)
		{
			fireScale = mix(noiseTexture.y, noiseTexture.z, fract(NoiseTextureInterpolator));
		}
		else
		{
			fireScale = mix(noiseTexture.z, noiseTexture.x, fract(NoiseTextureInterpolator));
		} */
		fireScale = MapToRange(fireScale, 0.2, 0.8, 0.f, 1.f);
		//fireScale = 1.f - fireScale;
		fireColor.rg *= clamp(fireScale, 0., 1.f);
		fireColor.b *= clamp(fireScale, 0.5, 1.f);
		#endif

	#endif
		

		vec3 finalColor = max(paperColor, fireColor);

		OutFirePlane = vec4(finalColor.rgb, 1);

	}`;
