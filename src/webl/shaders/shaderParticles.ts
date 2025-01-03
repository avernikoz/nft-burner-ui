import { EParticleShadingMode } from "../particles";
import { Vector2 } from "../types";
import { MathLerp } from "../utils";

//sc_ - ShaderCode

function scGetRandomInitialVelocity(randomVelocityScale: number) {
    if (randomVelocityScale > 0) {
        return (
            /* glsl */ `
		vec2 uv = vec2(CurTime * 0.17f + 0.12f * float(gl_VertexID), CurTime * 0.09 + 0.07 * float(gl_VertexID));
		//uv *= 0.1f;
		vec2 noise = textureLod(NoiseTextureHQ, uv.xy, 0.0).rg;
		noise = noise * 2.f - 1.f;
	#if 1 //MIN LENGTH
		float curLength = length(noise);
		const float minLength = 0.3;
		if(curLength < minLength)
		{
			noise /= curLength;
			noise *= minLength;
		}
	#endif
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

function scGetInitialPosition(EInitialPositionMode: number) {
    if (EInitialPositionMode == 1) {
        return /* glsl */ `
			{
				//random position
				vec2 uvPos = vec2(0.0);
				uvPos.y = float(gl_VertexID) * 0.007 + CurTime * 0.01;
				uvPos.x = float(gl_VertexID) * 0.0013 + CurTime * 0.07;
				vec3 noisePos = textureLod(NoiseTextureHQ, uvPos, 0.f).rgb;
				noisePos.x = MapToRange(noisePos.x, 0.4, 0.6, -2.f, 2.f);
				noisePos.y = MapToRange(noisePos.y, 0.4, 0.6, -1.f, 2.f);
				//noisePos = noisePos * 2.f - 1.f;
				outPosition = noisePos.xy /* + uvPos.xy * 0.01 */;
			  }
		`;
    } else if (EInitialPositionMode == 2) {
        return /* glsl */ `outPosition = EmitterPosition;`;
    } else {
        return /* glsl */ `outPosition = inDefaultPosition;`;
    }
}

function scRandomiseParticleSpawn(threshold: number) {
    if (threshold < 1.0) {
        return (
            /* glsl */ `
		{
			const float thres = float(` +
            threshold +
            /* glsl */ `);
			vec2 uvPos = vec2(0.0, float(gl_VertexID) * 0.047);
			uvPos += vec2(CurTime * 0.0007f, CurTime * 0.0003);
			float noiseVal = texture(NoiseTexture, uvPos).r;
			noiseVal = MapToRange(noiseVal, 0.4, 0.6, 0.f, 1.f);
			if(noiseVal < thres)
			{
				outAge = ParticleLife;
				//outPosition = vec2(0.f, 0.f);
				outPosition = vec2(10000.f, 10000.f);
				outVelocity = vec2(0, 0);
				return;
			}
		}
		`
        );
    } else {
        return ``;
    }
}

function scGetVectorFieldForce(scale: number) {
    if (scale > 0) {
        return (
            //sample vector field based on cur pos
            /* glsl */ `vec2 uv = (inPosition + 1.f) * 0.5f;
			uv.x += float(gl_VertexID) * 0.025;
			uv.y += float(gl_VertexID) * 0.01;
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
			randVel = (randVel) * RandVelocityScale * 2.0 /* * 0.5 */;


			//LQ Noise
			uv = (inPosition + 1.f) * 0.5f;
			uv *= 0.01f;
			uv.y -= CurTime * 0.00025f;
			uv.x += CurTime * 0.0025f;
			randVelNoise = texture(NoiseTexture, uv.xy).rgb;
			vec2 randVelLQ;
			randVelLQ.x = randVelNoise.r;
			randVelLQ.y = randVelNoise.g;
			randVelLQ = randVelLQ * 2.f - 1.f;
			randVel += (randVelLQ) * RandVelocityScale * 0.5;

			//const float clampValue = 10.f;
			const float clampValue = 50.f;
			randVel = clamp(randVel, vec2(-clampValue), vec2(clampValue));


			//randVel = normalize(vec2(-1, 0.0)) * 35.f * 0.5;

			curVel += randVel * DeltaTime;`
        );
    } else {
        return ``;
    }
}

function scSmoothTransitionFlipbookSample(condition: boolean) {
    if (condition) {
        return /* glsl */ `
	#if 1//SMOOTH TRANSITION //TODO:COMPILE TIME CONDITIONAL
	float numFrames = float(FlipbookSizeRC.x * FlipbookSizeRC.y);
	//if(ceil(interpolatorFrameIndex) < numFrames)
	{
		flipBookIndex1D = uint(ceil(interpolatorFrameIndex));
		FlipBookIndex2D.x = (flipBookIndex1D % uint(FlipbookSizeRC.x));
		FlipBookIndex2D.y = (flipBookIndex1D / uint(FlipbookSizeRC.x));
		uv = interpolatorTexCoords * frameSize;
		uv.x += (frameSize.x * float(FlipBookIndex2D.x));
		uv.y += (frameSize.y * float(FlipBookIndex2D.y));
		vec4 color2 = texture(ColorTexture, uv).rgba;
		colorFinal = mix(colorFinal, color2, fract(interpolatorFrameIndex));
	}
	#endif
	`;
    } else {
        return ``;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scParticleSampleFlipbook(condition: boolean, bSmoothTransition = true) {
    if (condition) {
        return (
            /* glsl */ `
		vec2 frameSize = 1.f / (FlipbookSizeRC);
		vec2 uv = interpolatorTexCoords * frameSize;

		uint flipBookIndex1D = uint(floor(interpolatorFrameIndex));
		uvec2 FlipBookIndex2D;
		FlipBookIndex2D.x = (flipBookIndex1D % uint(FlipbookSizeRC.x));
		FlipBookIndex2D.y = (flipBookIndex1D / uint(FlipbookSizeRC.x));

		uv.x += (frameSize.x * float(FlipBookIndex2D.x));
		uv.y += (frameSize.y * float(FlipBookIndex2D.y));
		
		colorFinal = texture(ColorTexture, uv).rgba;

		` + scSmoothTransitionFlipbookSample(bSmoothTransition)
        );
    } else {
        return ``;
    }
}

export function GetParticleUpdateShaderVS(
    spawnFireRange: Vector2,
    initialVelocityScale: number,
    velocityFieldForceScale: number,
    buoyancyForceScale: number,
    downwardForceScale: number,
    EInitialPositionMode: number, //0:default, 1:random, 2:from Emitter Pos constant
    randomSpawnThres: number,
    bOneShotParticle: boolean,
) {
    return (
        /* glsl */ `#version 300 es
  
	  precision highp float;
	  precision mediump sampler2D;
  
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
	  uniform vec2 EmitterPosition; 

	  uniform sampler2D NoiseTexture;
	  uniform sampler2D NoiseTextureHQ;
	  uniform sampler2D FireTexture;
  
	  //check if particle was spawned at least once
	  bool IsParticleAlive()
	  {
		  const vec2 BoundsStart = vec2(-10.f, -10.f);//Make it -5 just to be sure
		  return ((inPosition.x >= BoundsStart.x) && (inPosition.y >= BoundsStart.y)); 
	  }
  
	  //check if particle should never be drawn again
	  bool IsParticleDead()
	  {
		 //dead particles are set to -1.0
		 return (inAge < -0.5f);
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


			const int bOneShotParticle = ` +
        (bOneShotParticle ? 1 : 0) +
        /* glsl */ `;

			  //Get Cur Fire based on Pos
			  vec2 fireUV = (inDefaultPosition + 1.f) * 0.5f;
			  float curFire = textureLod(FireTexture, fireUV.xy, 0.0).r;
			
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
			  if(inAge < 0.0 && inAge > -1.0)
			  {
				 //one shot particles have initial range of -0.25 and are allowed to spawn once
				 bAllowNewSpawn = true;
			  }
			  float curAge = inAge;
  
			  if(bIsInSpawnRange)
			  {
				  if(bOutdatedParticle)
				  {
					if(!bAllowNewSpawn)//only one shot particle might have set this to true
					{
						bAllowNewSpawn = true && (bOneShotParticle == 0);
					}
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
				  
					outAge = 0.0; //TODO: Random Age

					` +
        scRandomiseParticleSpawn(randomSpawnThres) +
        /* glsl */ `

				  ` +
        scGetInitialPosition(EInitialPositionMode) +
        /* glsl */ `
  
				  ` +
        scGetRandomInitialVelocity(initialVelocityScale) +
        /* glsl */ `
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

				  const float downwardForceScale = float(` +
        downwardForceScale +
        /* glsl */ `);
				  float downwardForce = /* ageNorm * */ (posYNorm /* * posYNorm */) /* * buoyancyForce */ * downwardForceScale;
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
			float velLength = length(curVelocity) * 0.10;
			if(velLength > 0.f)
			{
				velLength = min(1.0, velLength);
				pos.y *= clamp(1.f - velLength * 0.8, 0.5f, 1.f);
				pos.x *= (1.f + velLength * 4.0);
				
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

//0-disabled
//1-fadeIn only
//2-fadeOut only
//3-enable all
function scFadeInOutTransform(condition: number) {
    if (condition) {
        return (
            /* glsl */ `
		#if 1 //SINGLE CURVE SCALE FADE OUT
		const int curFadeSetting = int(` +
            condition +
            /* glsl */ `);
		
		if(ageNorm < 0.333f && (curFadeSetting != 2)) 
		{
			float fadeParam = ageNorm * (1.0 - ageNorm) * (1.0 - ageNorm) * 6.74;
			pos.x *= clamp(fadeParam, 0.2, 1.f);
			pos.y *= clamp(fadeParam, 0.05, 1.f);
		}
		else if((curFadeSetting != 1))
		{
			float fadeParam = ageNorm * (1.0 - ageNorm) * (1.0 - ageNorm) * 6.74;
			pos.x *= clamp(fadeParam, 0.5, 1.f);
			pos.y *= clamp(fadeParam, 0.0, 1.f);
		}
	  #else
		float normAgeFadeInPow = sqrt(1.f - pow(1.f - ageNorm, 8.f));
		pos.xy *= normAgeFadeInPow;

		float normAgeFadeOutPow = 1.f - clamp(pow(ageNorm, 4.f), 0.f, 1.f);
		pos.xy *= normAgeFadeOutPow;
	  #endif
	  `
        );
    } else {
        return ``;
    }
}

export function GetParticleRenderInstancedVS(
    bUsesTexture: boolean,
    defaultSize: Vector2,
    EFadeInOutMode: number,
    sizeRangeMinMax: Vector2,
    sizeClampMax: Vector2,
    initialTranslation: Vector2,
    bMotionBasedTransform: boolean,
    randomSizeChangeSpeed: number,
) {
    return (
        /* glsl */ `#version 300 es
  
		precision mediump float;
	precision mediump sampler2D;
	
		layout(location = 0) in vec2 VertexBuffer;
		layout(location = 1) in vec2 TexCoordsBuffer;
	
		layout(location = 2) in vec2 inPosition;
		layout(location = 3) in float inAge;
		layout(location = 4) in vec2 inVelocity;
	
		uniform vec4 CameraDesc;
		uniform float ScreenRatio;
		uniform vec3 FirePlanePositionOffset;

		uniform float ParticleLife;
		uniform float NumLoops;
		uniform float CurTime;
		uniform vec2 FlipbookSizeRC;
  
		uniform sampler2D NoiseTexture;
	
		flat out float interpolatorAge;
		flat out float interpolatorFrameIndex;
		out vec2 interpolatorTexCoords;
		flat out int interpolatorInstanceId;
	
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
			float kSizeScale = 1.f + 0.0 - CameraDesc.z;

			const vec2 kInitTranslate = vec2(float(` +
        initialTranslation.x +
        /* glsl */ `), float(` +
        initialTranslation.y +
        /* glsl */ `));

			if(IsParticleDead())
			{
				gl_Position = vec4(-1000, -1000, -1000, 1.0);
				return;
			}
			else
			{	
				
				interpolatorInstanceId = gl_InstanceID;

				vec2 uvLocal = vec2(TexCoordsBuffer.x, 1.f - TexCoordsBuffer.y);
			#if 1//flip uv's
				if(gl_InstanceID % 3 == 0)
				{
					uvLocal.x = 1.f - uvLocal.x;
				}
			#endif
  
				interpolatorTexCoords = uvLocal;
				float ageNorm = min(0.999f, inAge / ParticleLife);
				//float ageNorm = min(inAge, ParticleLife) / ParticleLife;
				interpolatorAge = ageNorm;
  

				//TODO: Do it on per-particle update stage and load it in PS without using interpolators
				float animationParameterNorm = ageNorm;
				if(NumLoops > 1.f)
				{
				  //animationParameterNorm = fract((inAge + float(gl_InstanceID % 5) * 0.097f) / (ParticleLife / NumLoops));
				  //animationParameterNorm = mod((inAge + float(gl_InstanceID % 5) * 0.097f) / (ParticleLife / NumLoops), 1.f);
				  animationParameterNorm = fract((inAge) / (ParticleLife / NumLoops));
				}
				float TotalFlipFrames = FlipbookSizeRC.x * FlipbookSizeRC.y;
				interpolatorFrameIndex = (animationParameterNorm * TotalFlipFrames);
	
				//=======================================================================================Position & Scale
				vec2 pos = VertexBuffer.xy;

				//offset
				pos += kInitTranslate;
				
				pos.xy *= CameraDesc.w;
				pos.x /= ScreenRatio;
				pos.xy /= kSizeScale;
  
			#if 1 //NOISE-DRIVEN SIZE
			const float kSizeChangeSpeed = float(` +
        randomSizeChangeSpeed +
        /* glsl */ `);
			if(kSizeChangeSpeed > 0.01)
			{
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
				
				float scale = 1.0f;
				vec2 noiseUV = vec2((inPosition.x + 1.f) * 0.5f, (inPosition.y + 1.f) * 0.5f);
				noiseUV *= 0.25f;
				//noiseUV.x += CurTime * 0.017f;
				noiseUV.y += CurTime * 0.033f * kSizeChangeSpeed;
				vec2 noise = textureLod(NoiseTexture, noiseUV.xy, 0.f).rg;

				scale = clamp(MapToRange(noise.r, 0.35, 0.65, kSizeRangeMinMax.x, kSizeRangeMinMax.y), kSizeRangeMinMax.x, kSizeRangeMinMax.y);

				const float particleDiffScale = 0.17f;
				
				const float sizeChangeSpeed = 0.77 * kSizeChangeSpeed;
				noiseUV = vec2(CurTime * kSizeChangeSpeed * 0.0017f + 0.23f * float(gl_InstanceID) * particleDiffScale, CurTime * sizeChangeSpeed * 0.1f + 0.17 * float(gl_InstanceID) * particleDiffScale);
				noise = textureLod(NoiseTexture, noiseUV.xy, 0.f).rg;

				if(kSizeChangeSpeed < 0.5)
				{

				}
				else
				{
					float t = mod(CurTime, 2.f);
					if(t < 1.f)
					{
						noise.r = mix(noise.r, noise.g, t);
					}
					else
					{
						noise.r = mix(noise.g, noise.r, t - 1.f);
					}
				}
				
				float scale2 = clamp(MapToRange(noise.r, 0.35, 0.65, kSizeRangeMinMax.x, kSizeRangeMinMax.y), kSizeRangeMinMax.x, kSizeRangeMinMax.y);

				scale = scale * scale2;
				//scale = scale2;

				if(scale < 0.2f)
				{
				  gl_Position = vec4(-1000, -1000, -1000, 1.0);
				  return;
				}

				pos.x *= max(kSizeClampMax.x, scale);
				pos.y *= max(kSizeClampMax.y, scale);

			}
			#endif//NOISE DRIVEN SIZE

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
        scFadeInOutTransform(EFadeInOutMode) +
        /* glsl */ `
  
				//translate
				vec2 translation = inPosition;
				//translation += FirePlanePositionOffset.xy;
				translation -= CameraDesc.xy;
				translation.xy *= CameraDesc.w;
				translation /= kSizeScale;
				translation.x /= ScreenRatio;

				pos.xy += translation;
	
				gl_Position = vec4(pos.xy, 0.0, 1.0);
				
			}
			
		}`
    );
}

function scAlphaFade(condition: number) {
    if (condition == 1) {
        return /* glsl */ `float ageNorm = interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74;
		colorFinal.rgba *= ageNorm;`;
    } else if (condition == 2) {
        return /* glsl */ `
		const float fadeStart = 0.9f;
		if(interpolatorAge >= fadeStart)
		{
			float fade = MapToRange(interpolatorAge, fadeStart, 1.0, 0.0, 1.0);
			colorFinal.rgba *= (1.f - fade);
		}
		`;
    } else {
        return ``;
    }
}

function scApplyBrightness(value: number) {
    if (value != 1.0) {
        return /* glsl */ `colorFinal.rgb *= float(` + value + /* glsl */ `);`;
    } else {
        return ``;
    }
}

function scDefaultShading() {
    return;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scFlameSpecificShading(bUsesTexture: boolean, artificialFlameAmount: number) {
    return (
        scParticleSampleFlipbook(bUsesTexture, false) +
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
        MathLerp(0.2, 0.95, Math.random()) +
        /* glsl */ `);

		colorFinal.rgb = mix(colorFinal.rgb, colorFinal.a * flameColor * 5.0f, t);

		//colorFinal.rgb *= CircularFadeOut(interpolatorTexCoords.y);

	  #endif
		
		//float ageNormalized = interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74;
		//colorFinal.rgb *= (1.f - interpolatorAge);
		`
    );
}

function scSmokeSpecificShading(alphaScale = 0.25) {
    return (
        scParticleSampleFlipbook(true) +
        /* glsl */ `

		const float alphaScale = float(` +
        alphaScale +
        /* glsl */ `);

		colorFinal.a *= (alphaScale + colorFinal.r * 0.75);

		#if 1
		float radialDistanceScale = length(interpolatorTexCoords - vec2(0.5, 0.5));
		radialDistanceScale = (1.f - clamp(radialDistanceScale, 0.f, 1.f));
		colorFinal.a *= radialDistanceScale * radialDistanceScale;
		#endif

		float brightness = mix(0.35, 0.15, interpolatorAge);
		colorFinal.rgb *= brightness;
		
		colorFinal.rgb *= colorFinal.a;
		`
    );
}

function scAfterBurnSmokeSpecificShading(alphaScale = 0.25) {
    return (
        scParticleSampleFlipbook(true) +
        /* glsl */ `

		const float alphaScale = float(` +
        alphaScale +
        /* glsl */ `);

		colorFinal.a *= (alphaScale + colorFinal.r * 0.75);

		#if 1
		float radialDistanceScale = length(interpolatorTexCoords - vec2(0.5, 0.5));
		radialDistanceScale = (1.f - clamp(radialDistanceScale, 0.f, 1.f));
		colorFinal.a *= pow(radialDistanceScale, 5.f);
		#endif

		float brightness = mix(0.35, 0.15, interpolatorAge);
		colorFinal.rgb *= brightness;
		
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
		
		curFire = 1.0;

		vec3 colorBright = vec3(curFire * (1.0 + (14.0 * (1. - t))), curFire * 0.75, curFire * 0.1);
		vec3 colorLow = vec3(curFire, curFire * 0.75, curFire * 0.5);

		colorFinal.rgb = mix(colorBright, colorLow , t);

		colorFinal.rgb *= 2.f * (1.0 - t);

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
		colorFinal.rgb *= 2.25f;
		//colorFinal.rgb *= 50.f;
		`;
}

function scEmbersImpactSpecificShading() {
    return /* glsl */ `
		/* vec3 colorBright = vec3(1.f, 0.5f, 0.1f) * 1.5f;
		vec3 colorLow = vec3(0.5f, 0.5f, 0.5f); */

		float t = interpolatorAge;
		t = CircularFadeOut(clamp(t, 0.f, 1.f));
		float curFire = (1.f - t) * 10.f;
		
		curFire = 1.0;

		vec3 colorBright = vec3(0.8, 0.7, 1.0) * curFire;
		vec3 colorLow = vec3(0.7, 0.4, 1.0) * curFire;

		colorFinal.rgb = mix(colorBright, colorLow , interpolatorTexCoords.x);

		colorFinal.rgb *= 2.f * (1.0 - t);
		
		colorFinal.rgb *= 10.0;

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
		colorFinal.rgb *= 2.25f;
		//colorFinal.rgb *= 50.f;
		`;
}

function scAshesSpecificShading() {
    return (
        //scParticleSampleFlipbook(true) +
        /* glsl */ `
		
		vec2 uv = interpolatorTexCoords * 0.05f;
		float instanceId = float(interpolatorInstanceId);
		uv.x += instanceId * 0.073f;
		uv.y += instanceId * 0.177f;
		uv.y += interpolatorFrameIndex * 0.0037f;
		uv.x += interpolatorFrameIndex * 0.0053f;
		float noise = texture(ColorTexture, uv).r;
		noise = clamp(MapToRange(noise, 0.4, 0.6, 1.0, 0.0), 0.f, 1.f);
		
		const vec3 colorEmber = vec3(0.5, 0.4, 0.4);
		const vec3 colorEmber2 = vec3(0.9, 0.4, 0.1f) * 10.f;
		const vec3 colorAsh  = vec3(0.1, 0.1, 0.1);
		vec3 colorEmberFinal;
		if((interpolatorInstanceId % 2) == 0)
		{
			colorEmberFinal = mix(colorEmber2, colorEmber, noise);
		}
		else
		{
			colorEmberFinal = mix(vec3(0.75) * 10.f, colorEmber, noise);
			//colorEmberFinal = vec3(0.75);
		}

		vec3 color = mix(colorEmberFinal, colorAsh, min(1.f, 3.5f * interpolatorAge));
		
		/* if(noise <= clamp((interpolatorAge) + 0.25, 0.0, 0.9))
		{
			noise = 0.0f;
		}
		else
		{
			noise = 1.0f;
		} */

		noise = clamp(noise, 0.f, 1.f);

		float radialDistanceScale = length(interpolatorTexCoords - vec2(0.5, 0.5));
		radialDistanceScale *= 2.f;
		if(radialDistanceScale > 0.5f)
		{
			radialDistanceScale = 1.f;
		}
		else
		{
			radialDistanceScale = 0.f;
		}
		radialDistanceScale = (1.f - clamp(radialDistanceScale, 0.f, 1.f));

		noise *= radialDistanceScale;

		

		color *= noise;

		/* float dx = abs(dFdx(noise));
		float dy = abs(dFdy(noise)); */
		//color += colorEmber * (dx + dy) * 0.5f;

		
		colorFinal.rgb = color;
		if(noise < 0.5)
		{
			noise = 0.0;
		}
		colorFinal.a = noise;
		
		const float thres = 0.8f;
		if(interpolatorAge >= thres)
		{
			float s = MapToRange(interpolatorAge, thres, 1.0, 1.0, 0.0);
			colorFinal.rgba *= s;
			
		}

		`
    );
}

function scDustSpecificShading() {
    return (
        /* glsl */ `

		//vec2 uv = interpolatorTexCoords * 0.005f;
		vec2 uv = interpolatorTexCoords * 0.01f;
		float instanceId = float(interpolatorInstanceId);
		uv.x += instanceId * 0.073f;
		uv.y += instanceId * 0.177f;
		uv.x += interpolatorFrameIndex * 0.0053f;
		float noise = texture(ColorTexture, uv).r;
		noise = clamp(MapToRange(noise, 0.4, 0.6, 1.0, 0.0), 0.f, 1.f);

		uv = interpolatorTexCoords * 0.005f;
		uv.x += instanceId * 0.093f;
		uv.y += instanceId * 0.277f;
		uv.y += interpolatorFrameIndex * 0.0017f;
		float alphaNoise = texture(ColorTexture, uv).r;
		alphaNoise = clamp(MapToRange(alphaNoise, 0.4, 0.6, 1.0, 0.0), 0.f, 1.f);

		colorFinal.rgb = vec3(` +
        Math.random() * 0.35 +
        /* glsl */ ` * alphaNoise);
		//colorFinal.a = 0.35 * (1.f - noise);
		colorFinal.a = alphaNoise * (1.f - noise);

		float s = length(interpolatorTexCoords - vec2(0.5, 0.5));
		float c = noise * 0.5;
		//float c = 0.1;
		s *= 2.f;
		if(s > 0.5f)
		{
			s += c;
			//s = 1.f;
		}
		else
		{
			s -= c;
			//s = 0.f;
		}
		//s += 0.15f;
		s = (1.f - clamp(s, 0.f, 1.f));
		colorFinal.rgb *= s;
		colorFinal.a *= s * s;
		colorFinal.rgb *= 1.0 + c * 0.5;
		`
    );
}

function scGetBasedOnShadingMode(
    shadingMode: number,
    bUsesTexture: boolean,
    alphaScale: number,
    artificialFlameAmount: number,
) {
    switch (shadingMode) {
        case EParticleShadingMode.Default:
            return scDefaultShading();
        case EParticleShadingMode.Flame:
            return scFlameSpecificShading(bUsesTexture, artificialFlameAmount);
        case EParticleShadingMode.Embers:
            return scEmbersSpecificShading();
        case EParticleShadingMode.EmbersImpact:
            return scEmbersImpactSpecificShading();
        case EParticleShadingMode.Smoke:
            return scSmokeSpecificShading(alphaScale);
        case EParticleShadingMode.AfterBurnSmoke:
            return scAfterBurnSmokeSpecificShading(alphaScale);
        case EParticleShadingMode.Ashes:
            return scAshesSpecificShading();
        case EParticleShadingMode.Dust:
            return scDustSpecificShading();
    }
}

export function GetParticleRenderColorPS(
    eShadingMode: number,
    bUsesTexture: boolean,
    EAlphaFadeEnabled: number, //0:disabled, 1:smooth, 2:fast
    alphaScale: number,
    brightness = 1.0,
    artificialFlameAmount = 0.45,
) {
    return (
        /* glsl */ `#version 300 es
	  
		precision mediump float;
		precision mediump sampler2D;
	
		out vec4 OutColor;
	
		flat in float interpolatorAge;
		flat in float interpolatorFrameIndex;
		in vec2 interpolatorTexCoords;
		flat in int interpolatorInstanceId;

		uniform sampler2D ColorTexture;
		uniform sampler2D FlameColorLUT;
		
		uniform vec2 FlipbookSizeRC;
		uniform float CurTime;
  
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
        scGetBasedOnShadingMode(eShadingMode, bUsesTexture, alphaScale, artificialFlameAmount) +
        /* glsl */ `

		//fade in-out
		` +
        scAlphaFade(EAlphaFadeEnabled) +
        /* glsl */ `

		//initial brightness
		` +
        scApplyBrightness(brightness) +
        /* glsl */ `

			OutColor = colorFinal;
		}`
    );
}
