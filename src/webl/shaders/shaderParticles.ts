import { EParticleShadingMode } from "../particles";
import { SceneDesc } from "../scene";
import { Vector2 } from "../types";

//SC - Shader Code
function scTranslateToBaseAtOrigin(condition: boolean) {
    if (condition) {
        return /* glsl */ `const float scaleOffsetAmount = 0.9f;
			pos.y += (scale / kViewSize.y) * scaleOffsetAmount;`;
    } else {
        return ``;
    }
}

function scGetRandomInitialVelocity(randomVelocityScale: number) {
    if (randomVelocityScale > 0) {
        return (
            /* glsl */ `
		vec2 uv = vec2(CurTime * 0.17f + 0.12f * float(gl_VertexID), CurTime * 0.09 + 0.07 * float(gl_VertexID));
		uv *= 0.1f;
		vec2 noise = texture(NoiseTextureHQ, uv.xy).rg;
		noise = noise * 2.f - 1.f;
		//noise = normalize(noise);
		const float InitialVelocityScale = float(` +
            randomVelocityScale +
            /* glsl */ `);
		outVelocity = (noise.xy) * InitialVelocityScale;
		/* if(outVelocity.y < 0.f)
		{
			outVelocity.y *= 0.25f;
		} */
		outVelocity.y += InitialVelocityScale * 0.25f;
		//outVelocity.y += abs(outVelocity.y) * 0.75f;
		`
        );
    } else {
        return /* glsl */ `outVelocity = vec2(0, 0);`;
    }
}

function scGetVectorFieldForce(scale: number) {
    if (scale > 0) {
        return (
            //sample vector field based on cur pos
            /* glsl */ `vec2 uv = (inPosition + 1.f) * 0.5f;
			//uv *= 0.5f;
			uv.y -= CurTime * 0.1f;
			//uv *= mix(0.1f, 0.5f, fract(mod(CurTime, 10.f) * 0.1f));
			vec3 randVelNoise = texture(NoiseTexture, uv.xy).rgb;
			//vec3 randVelNoise = texture(NoiseTextureHQ, uv.xy).rgb;
			vec2 randVel;
			randVel.x = randVelNoise.r;
			randVel.y = mix(randVelNoise.g, randVelNoise.b, fract(mod(CurTime, 10.f) * 0.1f));
			randVel = randVel * 2.f - 1.f;
			const float RandVelocityScale = float(` +
            scale +
            /* glsl */ `);
			//randVel = normalize(randVel);
			randVel = (randVel) * RandVelocityScale;
			curVel += randVel * DeltaTime;`
        );
    } else {
        return ``;
    }
}

function scParticleSampleFlipbook(condition: boolean) {
    if (condition) {
        return /* glsl */ `uint flipBookIndex1D = uint(floor(interpolatorFrameIndex));
		uvec2 FlipBookIndex2D;
		/* FlipBookIndex2D.x = 1u;
		FlipBookIndex2D.y = 1u; */
		FlipBookIndex2D.x = (flipBookIndex1D % uint(FlipbookSizeRC.x));
		FlipBookIndex2D.y = (flipBookIndex1D / uint(FlipbookSizeRC.x));

		vec2 frameSize = 1.f / (FlipbookSizeRC);
		vec2 uv = interpolatorTexCoords * frameSize;
		uv.x += (frameSize.x * float(FlipBookIndex2D.x));
		uv.y += (frameSize.y * float(FlipBookIndex2D.y));
		
		colorFinal = texture(ColorTexture, uv).rgba;

		//dissipation fade-out
		//float dissipationThres = 1.f - CircularFadeIn(interpolatorAge);
		//float dissipationThres = /* CircularFadeIn */(interpolatorAge);
		//float dissipationThres = 1.f - (interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74);
		/* if(colorFinal.a < (dissipationThres))
		{
			discard;
		} */
		//colorFinal.rgb *= dissipationThres;
		
		`;
    } else {
        return ``;
    }
}

export function GetParticleUpdateShaderVS(
    spawnFireRange: Vector2,
    initialVelocityScale: number,
    velocityFieldForceScale: number,
    buoyancyForceScale: number,
) {
    return (
        /* glsl */ `#version 300 es
  
	  precision highp float;
  
	  layout(location = 0) in vec2 inPosition;
	  layout(location = 1) in vec2 inVelocity;
	  layout(location = 2) in float inAge;
	  layout(location = 3) in vec2 inDefaultPosition;
  
	  out vec2 outPosition;
	  out vec2 outVelocity;
	  out float outAge;
  
	  uniform float DeltaTime;
	  uniform float CurTime;
	  uniform float ParticleLife;
	  uniform sampler2D NoiseTexture;
	  uniform sampler2D NoiseTextureHQ;
	  uniform sampler2D FireTexture;
  
	  //check if particle was spawned at least once
	  bool IsParticleAlive()
	  {
		  const vec2 BoundsStart = vec2(-5.f, -5.f);//Make it -5 just to be sure
		  return ((inPosition.x >= BoundsStart.x) && (inPosition.y >= BoundsStart.y)); 
	  }
  
	  //check if particle should never be drawn again
	  bool IsParticleDead()
	  {
		  return (inAge < 0.f);
	  }
  
	  float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	  {
		  ///Translate to origin, scale by ranges ratio, translate to new position
		  return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	  }
  
	  void main()
	  {
  
		  bool bParticleDead = IsParticleDead();
  
		  if(bParticleDead)
		  {
			  outAge = inAge;
			  outVelocity = inVelocity;
			  outPosition = inPosition;
		  }
		  else
		  {
			  //Get Cur Fire based on Pos
			  vec2 fireUV = (inDefaultPosition + 1.f) * 0.5f;
			  float curFire = texture(FireTexture, fireUV.xy).r;
			
			  vec2 kSpawnRange = vec2(float(` +
        spawnFireRange.x +
        /* glsl */ `), float(` +
        spawnFireRange.y +
        /* glsl */ `));
			  /* if(gl_VertexID % 400 == 0)
			  {
				kSpawnRange.x = 0.001f;
			  } */
			  bool bIsInSpawnRange = ((curFire >= kSpawnRange.x) && (curFire <= kSpawnRange.y ));
			  bool bAllowNewSpawn = false;
			  bool bAllowUpdate = false;
			  bool bOutdatedParticle = inAge > ParticleLife;
			  float curAge = inAge;
  
			  if(bIsInSpawnRange)
			  {
				  if(bOutdatedParticle)
				  {
					  bAllowNewSpawn = true;
				  }
				  else
				  {
					  bAllowUpdate = true;
				  }
			  }
			  else
			  {
				  if(IsParticleAlive())
				  {
					  //check for lifetime, if exceeds, destroy, stop updating, and move to offscreen
					  if(bOutdatedParticle)
					  {
						  curAge = -1.f; //MARK DEAD
					  }
					  else
					  {
						  bAllowUpdate = true;
					  }
				  }
			  }
  
  
			  if(bAllowNewSpawn)
			  {
				  /* Particle has exceeded its lifetime. Respawn. */
				  #if 1
					  outPosition = inDefaultPosition;
					  //outPosition = vec2(0, -0.5);
				  #else
					  //random position
					  vec2 uvPos = vec2(CurTime * 0.01f, CurTime * 0.001);
					  vec3 noisePos = texture(NoiseTextureHQ, uvPos).rgb;
					  noisePos.x = MapToRange(noisePos.x, 0.2, 0.8, 0.f, 1.f);
					  noisePos.y = MapToRange(noisePos.y, 0.2, 0.8, 0.f, 1.f);
					  noisePos = noisePos * 2.f - 1.f;
					  outPosition = noisePos.xy;
				  #endif
  
				  ` +
        scGetRandomInitialVelocity(initialVelocityScale) +
        /* glsl */ `
  
				  outAge = 0.0; //TODO: Random Age
  
				  return;
			  }
			  else if(bAllowUpdate)
			  {
				  /* Update */

				  //Hotter particles are faster
				  const float MinSpeedScale = 0.85f;
				  const float MaxSpeedScale = 1.25f;
				  float temperature = clamp(MapToRange(curFire, kSpawnRange.x, 10.f, MinSpeedScale, MaxSpeedScale), MinSpeedScale, MaxSpeedScale);

				  outAge = inAge + DeltaTime * temperature;
  
				  vec2 curVel = inVelocity;

				  ` +
        scGetVectorFieldForce(velocityFieldForceScale) +
        /* glsl */ `
  
				  const float buoyancyForce = float(` +
        buoyancyForceScale +
        /* glsl */ `);

				  float ageNorm = curAge / ParticleLife;
				  float posYNorm = (inPosition.y + 1.f) * 0.5f;
				  curVel.y += buoyancyForce * DeltaTime * temperature;

				  float downwardForce = /* ageNorm * */ (posYNorm /* * posYNorm */) /* * buoyancyForce */ * 2.5f;
				  if(curVel.y > 0.f)
				  {
					curVel.y -= downwardForce * DeltaTime * curVel.y;
				  }
  
				  const float Damping = 0.99f;
				  curVel *= Damping;
				  outVelocity = curVel;
				  outPosition = inPosition + inVelocity * 0.1 * DeltaTime;
			  }
			  else
			  {
				  outAge = curAge;
				  outPosition = inPosition;
				  outVelocity = inVelocity;
			  }
		  }
  
		  
  
	  }`
    );
}
export const ParticleUpdatePS = /* glsl */ `#version 300 es
	  precision highp float;
	  void main()
	  {}`;

function scTransformBasedOnMotion(condition: boolean) {
    if (condition) {
        return /* glsl */ `vec2 curVelocity = inVelocity;
			float velLength = length(curVelocity) * 0.1;
			if(velLength > 0.f)
			{
				pos.y *= clamp(1.f - velLength, 0.15f, 0.35f);
				pos.x *= (1.f + velLength);
				
				// Calculate the angle between the initial direction (1, 0) and the desired direction
				float angle = atan(curVelocity.y, curVelocity.x);

				// Rotate the stretched position
				float cosAngle = cos(angle);
				float sinAngle = sin(angle);
				vec2 rotatedPosition = vec2(
					pos.x * cosAngle - pos.y * sinAngle,
					pos.x * sinAngle + pos.y * cosAngle
				);
				
				pos = rotatedPosition;
			}`;
    } else {
        return ``;
    }
}

function scFadeInOutTransform(condition: boolean) {
    if (condition) {
        return /* glsl */ `
		#if 1 //SINGLE CURVE SCALE FADE OUT

		float velLength = length(inVelocity);//TODO Optimization : Replace with compile time const
		if(ageNorm < 0.333f)
		{
			ageNorm = ageNorm * (1.0 - ageNorm) * (1.0 - ageNorm) * 6.74;
			pos.x *= clamp(ageNorm, 0.2, 1.f);
			pos.y *= clamp(ageNorm, 0.05, 1.f);
		}
		else if((velLength < 0.01))
		{
			ageNorm = ageNorm * (1.0 - ageNorm) * (1.0 - ageNorm) * 6.74;
			pos.x *= clamp(ageNorm, 0.5, 1.f);
			pos.y *= clamp(ageNorm, 0.0, 1.f);
		}
	  #else
		float normAgeFadeInPow = sqrt(1.f - pow(1.f - ageNorm, 8.f));
		pos.xy *= normAgeFadeInPow;

		float normAgeFadeOutPow = 1.f - clamp(pow(ageNorm, 4.f), 0.f, 1.f);
		pos.xy *= normAgeFadeOutPow;
	  #endif
	  `;
    } else {
        return ``;
    }
}

export function GetParticleRenderInstancedVS(
    bUsesTexture: boolean,
    defaultSize: Vector2,
    sizeRangeMinMax: Vector2,
    sizeClampMax: Vector2,
    bOriginAtCenter = true,
    bMotionBasedTransform = false,
) {
    const sizeScale = SceneDesc.FirePlaneSizeScaleNDC;
    const viewSize = SceneDesc.ViewRatioXY;
    return (
        /* glsl */ `#version 300 es
  
		precision highp float;
	
		layout(location = 0) in vec2 VertexBuffer;
		layout(location = 1) in vec2 TexCoordsBuffer;
	
		layout(location = 2) in vec2 inPosition;
		layout(location = 3) in float inAge;
		layout(location = 4) in vec2 inVelocity;
	
		uniform float ParticleLife;
		uniform float NumLoops;
		uniform float CurTime;
		uniform vec2 FlipbookSizeRC;
  
		uniform sampler2D NoiseTexture;
	
		flat out float interpolatorAge;
		flat out float interpolatorFrameIndex;
		out vec2 interpolatorTexCoords;
		flat out float interpolatorSize;
	
		//check if particle should never be drawn again
		bool IsParticleDead()
		{
			return (inAge < 0.f);
		}
  
		float MapToRange(float t, float t0, float t1, float newt0, float newt1)
		{
			///Translate to origin, scale by ranges ratio, translate to new position
			return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
		}
	
		void main()
		{
			if(IsParticleDead())
			{
				gl_Position = vec4(-10, -10, -10, 1.0);
			}
			else
			{	
	
				vec2 uvLocal = vec2(TexCoordsBuffer.x, 1.f - TexCoordsBuffer.y);
			#if 1//flip uv's
				if(gl_InstanceID % 3 == 0)
				{
					uvLocal.x = 1.f - uvLocal.x;
				}
			#endif
  
				interpolatorTexCoords = uvLocal;
				float ageNorm = min(inAge, ParticleLife - 0.0001) / ParticleLife;
				//float ageNorm = min(inAge, ParticleLife) / ParticleLife;
				interpolatorAge = ageNorm;
  

				float animationParameterNorm = ageNorm;
				if(NumLoops > 1.f)
				{
				  animationParameterNorm = fract((inAge + float(gl_InstanceID % 5) * 0.097f) / (ParticleLife / NumLoops));
				}
				float TotalFlipFrames = FlipbookSizeRC.x * FlipbookSizeRC.y;
				interpolatorFrameIndex = (animationParameterNorm * TotalFlipFrames);
	
	
				float kSizeScale = float(` +
        sizeScale +
        /* glsl */ `);
				const vec2 kViewSize = vec2(float(` +
        viewSize.x +
        /* glsl */ `), float(` +
        viewSize.y +
        /* glsl */ `));

				vec2 pos = VertexBuffer.xy;
				pos /= kViewSize;
  
				//scale
				float scale = 1.0f;
			  #if 1 //NOISE-DRIVEN SIZE
				vec2 noiseUV = vec2((inPosition.x + 1.f) * 0.5f, (inPosition.y + 1.f) * 0.5f);
				noiseUV *= 0.25f;
				//noiseUV.x += CurTime * 0.017f;
				noiseUV.y += CurTime * 0.033f;
				vec2 noise = textureLod(NoiseTexture, noiseUV.xy, 0.f).rg;

				const vec2 kSizeRangeMinMax = vec2(float(` +
        sizeRangeMinMax.x +
        /* glsl */ `), float(` +
        sizeRangeMinMax.y +
        /* glsl */ `));
				const vec2 kSizeClampMax = vec2(float(` +
        sizeClampMax.x +
        /* glsl */ `), float(` +
        sizeClampMax.y +
        /* glsl */ `));

				scale = clamp(MapToRange(noise.r, 0.35, 0.65, kSizeRangeMinMax.x, kSizeRangeMinMax.y), kSizeRangeMinMax.x, kSizeRangeMinMax.y);

				
				float particleDiffScale = 0.17f;
				float sizeChangeSpeed = 0.77;
				noiseUV = vec2(CurTime * 0.0017f + 0.23f * float(gl_InstanceID) * particleDiffScale, CurTime * sizeChangeSpeed * 0.1f + 0.17 * float(gl_InstanceID) * particleDiffScale);
				noise = textureLod(NoiseTexture, noiseUV.xy, 0.f).rg;
				float t = mod(CurTime, 2.f);
				if(t < 1.f)
				{
					noise.r = mix(noise.r, noise.g, t);
				}
				else
				{
					noise.r = mix(noise.g, noise.r, t - 1.f);
				}

				float scale2 = clamp(MapToRange(noise.r, 0.35, 0.65, kSizeRangeMinMax.x, kSizeRangeMinMax.y), kSizeRangeMinMax.x, kSizeRangeMinMax.y);

				scale = scale * scale2;
				//scale = scale2;

				if(scale < 0.2f)
				{
				  gl_Position = vec4(-10, -10, -10, 1.0);
				  return;
				}

				scale *= kSizeScale;
				pos.x *= max(kSizeClampMax.x, scale);
				pos.y *= max(kSizeClampMax.y, scale);

				
				#endif//NOISE DRIVEN SIZE

				interpolatorSize = scale;
				

				//offset to origin
				` +
        scTranslateToBaseAtOrigin(!bOriginAtCenter) +
        /* glsl */ `

				//scale
				pos.x *= float(` +
        defaultSize.x +
        /* glsl */ `);
				pos.y *= float(` +
        defaultSize.y +
        /* glsl */ `);


			//Rotate based on velocity
			` +
        scTransformBasedOnMotion(bMotionBasedTransform) +
        /* glsl */ `

			//fade in-out
		` +
        scFadeInOutTransform(bUsesTexture) +
        /* glsl */ `
  
				//translate
				vec2 translation = inPosition;
				translation *= kSizeScale;
				translation.x /= float(` +
        viewSize.x +
        /* glsl */ `);
				translation.y /= float(` +
        viewSize.y +
        /* glsl */ `);
				pos.xy += translation;
	
				gl_Position = vec4(pos.xy, 0.0, 1.0);
				
			}
			
		}`
    );
}

function scAlphaFade(condition: boolean) {
    if (condition) {
        return /* glsl */ `float ageNorm = interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74;
		colorFinal.rgb *= ageNorm;`;
    } else {
        return ``;
    }
}

function scDefaultShading() {
    return;
}

function scFlameSpecificShading(bUsesTexture: boolean, artificialFlameAmount: number) {
    return (
        scParticleSampleFlipbook(bUsesTexture) +
        /* glsl */ `

	  #if 1 //ARTIFICIAL COLOR
		float lutSamplingU = 1.f - interpolatorTexCoords.y;
		lutSamplingU *= clamp((1.f - interpolatorAge), 0.25, 0.75f);
		//lutSamplingU *= 0.2f;
		vec3 flameColor = texture(FlameColorLUT, vec2(lutSamplingU, 0.5)).rgb;
		//flameColor = vec3(0., 0.f, 1.0);
		float t = interpolatorAge;
		t = (t * t) + MapToRange(interpolatorTexCoords.y, 0.f, 1.f, -1.f, 1.05f);
		t = CircularFadeIn(clamp(t, 0.f, 1.f));

		//const float ArtFlameAmount = 0.45f;//TODO:Randomise this
		t *= float(` +
        artificialFlameAmount +
        /* glsl */ `);

		colorFinal.rgb = mix(colorFinal.rgb, colorFinal.a * flameColor * 5.0f, t);

		//colorFinal.rgb *= CircularFadeOut(interpolatorTexCoords.y);

	  #endif
		
		//float ageNormalized = interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74;
		//colorFinal.rgb *= (1.f - interpolatorAge);
		`
    );
}

function scSmokeSpecificShading() {
    return (
        scParticleSampleFlipbook(true) +
        /* glsl */ `

		
		//float alphaScale = 0.4f;
		float alphaScale = 0.5f;
		colorFinal.a *= alphaScale;
		
		/* float brightness = mix(0.35, 0.15, interpolatorAge);
		colorFinal.rgb *= brightness; */

		colorFinal.rgba *= (1.f - interpolatorAge);


		colorFinal.rgb *= colorFinal.a;

		
		`
    );
}

function scEmbersSpecificShading() {
    return /* glsl */ `
		/* vec3 colorBright = vec3(1.f, 0.5f, 0.1f) * 1.5f;
		vec3 colorLow = vec3(0.5f, 0.5f, 0.5f); */

		float t = interpolatorAge;
		t = CircularFadeOut(clamp(t, 0.f, 1.f));
		float curFire = (1.f - t) * 10.f;

		vec3 colorBright = vec3(curFire * 0.4, curFire * 0.2, curFire * 0.1);
		vec3 colorLow = vec3(curFire * 0.2f, curFire * 0.2, curFire * 0.2f);

		if(t < 0.5f)
		{
			colorFinal.rgb = colorBright;
		}
		else
		{
			colorFinal.rgb = mix(colorBright, colorLow, (t - 0.5f) * 2.f);
		}
		
		float s = length(interpolatorTexCoords - vec2(0.5, 0.5));
		s *= 2.f;
		if(s > 0.5f)
		{
			s += 0.25f;
			//s = 1.f;
		}
		else
		{
			s -= 0.25f;
			//s = 0.f;
		}
		//s += 0.15f;
		s = (1.f - clamp(s, 0.f, 1.f));
		colorFinal.rgb *= s;
		//colorFinal.rgb *= 50.f;
		//colorFinal.r *= s;
		`;
}

function scAshesSpecificShading() {
    return /* glsl */ `
	
		/* const vec3 colorBright = vec3(0.9, 0.25, 0.0) * 2.f;
		const vec3 colorLow = vec3(0.2, 0.25, 0.9); */

		/* float t = sin(interpolatorAge) + 1.f;
		if(t < 1.f)
		{
			colorFinal.rgb = mix(colorBright, colorLow, t);
		}
		else
		{
			colorFinal.rgb = mix(colorBright, colorLow, t - 1.f);
		} */

		//colorFinal.rgb = mix(colorBright, colorLow, interpolatorAge);

		colorFinal.rgb = vec3(0.5);

		float s = length(interpolatorTexCoords - vec2(0.5, 0.5));
		s *= 2.f;

		//Color LUT 
		/* const vec3 redColor = vec3(1.0, 0.3, 0.1);
		const vec3 yellowColor = vec3(0.9, 0.9, 0.1);
		const vec3 blueColor = vec3(0.1, 0.1, 0.9);

		float t = s * 3.f;

		if(t < 1.f)
		{
			colorFinal.rgb = mix(redColor, yellowColor, t);
		}
		else if(t < 2.f)
		{
			colorFinal.rgb = mix(yellowColor, blueColor, t - 1.f);
		}
		else
		{
			colorFinal.rgb = mix(redColor, blueColor, t - 2.f);
		} */

		float blurRadius = 0.5f;
		blurRadius = interpolatorAge * 0.75;
		if(s > 0.5f)
		{
			s += blurRadius;
			//s = 1.f;
		}
		else
		{
			s -= blurRadius;
			//s = 0.f;
		}
		//s += 0.15f;
		s = (1.f - clamp(s, 0.f, 1.f));
		colorFinal.rgba *= s;
		//colorFinal.rgba *= 0.25f;
		//colorFinal.rgb *= 50.f;
		//colorFinal.r *= s;
		`;
}

function scGetBasedOnShadingMode(shadingMode: number, bUsesTexture: boolean, artificialFlameAmount: number) {
    switch (shadingMode) {
        case EParticleShadingMode.Default:
            return scDefaultShading();
        case EParticleShadingMode.Flame:
            return scFlameSpecificShading(bUsesTexture, artificialFlameAmount);
        case EParticleShadingMode.Embers:
            return scEmbersSpecificShading();
        case EParticleShadingMode.Smoke:
            return scSmokeSpecificShading();
        case EParticleShadingMode.Ashes:
            return scAshesSpecificShading();
    }
}

export function GetParticleRenderColorPS(
    eShadingMode: number,
    bUsesTexture: boolean,
    bAlphaFadeEnabled: boolean,
    artificialFlameAmount = 0.45,
) {
    return (
        /* glsl */ `#version 300 es
	  
		precision highp float;
	
		out vec4 OutColor;
	
		flat in float interpolatorAge;
		flat in float interpolatorFrameIndex;
		in vec2 interpolatorTexCoords;
		flat in float interpolatorSize;

		uniform sampler2D ColorTexture;
		uniform sampler2D FlameColorLUT;
		
		uniform vec2 FlipbookSizeRC;
  
		float CircularFadeIn(float x) 
		{
		  float y = 1.f - sqrt(1.f - x * x);
		  return y;
		}
  
		float CircularFadeOut(float x) 
		{
		  float y = sqrt(1.f - ((1.f - x) * (1.f - x)));
		  return y;
		}
  
		float MapToRange(float t, float t0, float t1, float newt0, float newt1)
		{
			///Translate to origin, scale by ranges ratio, translate to new position
			return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
		}
	
		void main()
		{
			if(interpolatorAge < 0.f)
			{
				discard;
			}

			//OutColor = vec4(0.5, 0.5, 0.5, 1); return;
			vec4 colorFinal = vec4(1.f, 0.55f, 0.1f, 1.f);
			` +
        scGetBasedOnShadingMode(eShadingMode, bUsesTexture, artificialFlameAmount) +
        /* glsl */ `

		//fade in-out
		` +
        scAlphaFade(bAlphaFadeEnabled) +
        /* glsl */ `

			OutColor = colorFinal;
		}`
    );
}
