/* eslint-disable */
import { EParticleShadingMode, ParticleEmitterDesc } from "../particles";
import { MathLerp } from "../utils";

function scGetRandomInitialVelocity(inDesc: ParticleEmitterDesc) {
    if (inDesc.InitialVelocityScale > 0) {
        return (
            /* glsl */ `

		float vertexId = float(gl_VertexID);	
		vec2 uv = vec2(0.0);
		const float timeChangeSpeed = 1.0;
		uv.x += CurTime * 0.17 * timeChangeSpeed;
		uv.y += CurTime * 0.09 * timeChangeSpeed;
		const float instanceChangeSpeed = 1.13;
		uv.x += vertexId * 0.12f * instanceChangeSpeed;
		uv.y += vertexId * 0.07 * instanceChangeSpeed;
		//uv *= 0.1f;
		vec3 noise = textureLod(NoiseTextureHQ, uv.xy, 0.0).rgb;

		vec2 dirVec = noise.rg;
		dirVec = dirVec * 2.f - 1.f;

		/* if(gl_VertexID > 4 && gl_VertexID < 1000)
		{
			const vec2 dirVecOG = vec2(-2.0, 1.0) * 0.2;
			dirVec = dirVecOG + (dirVec) * vec2(0.3, 0.1);
			noise.z *= 0.5;
		} */

		dirVec.x *= float(`+inDesc.InitialVelocityAddScale.x+/* glsl */`);
		dirVec.y *= float(`+inDesc.InitialVelocityAddScale.y+/* glsl */`);
		#if 1
		/* if((gl_VertexID % 2) == 0)
		{
			dirVec.y = abs(dirVec.y);
		} */
		#endif

		#if !FALLING //MIN LENGTH
		float curLength = length(dirVec);
		const float minLength = 0.3;
		if(curLength < minLength)
		{
			dirVec /= curLength;
			dirVec *= minLength;
		}
		#endif

		//noise = normalize(noise);
		const float InitialVelocityScale = float(` + inDesc.InitialVelocityScale +  /* glsl */ `);

		netForce.xy = dirVec.xy * InitialVelocityScale;
		if(netForce.y < 0.f)
		{
			netForce.y += abs(netForce.y) * 0.75f;
		}

		#if THIRD_DIMENSION
		noise.z = MapToRange(noise.z, 0.2, 0.8, 0.f, 1.f);
		netForce.z = -noise.z * InitialVelocityScale * 0.35;
		#endif

		//outVelocity.y += InitialVelocityScale * 0.25f;
		//
		`
        );
    } else {
        return /* glsl */ `/* outVelocity = vec2(0, 0); */`;
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
				curPos.xy = noisePos.xy /* + uvPos.xy * 0.01 */;
			  }
		`;
    } else if (EInitialPositionMode == 2) {
        return /* glsl */ `
		curPos.xy = EmitterPosition.xy;
		#if THIRD_DIMENSION
		curPos.z = EmitterPosition.z;
		#endif
		`;
    } else {
        return /* glsl */ `
		curPos.xy = inDefaultPosition;
		`;
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
				outPosition = DIM_TYPE(10000.f);
				outPrevPosition = DIM_TYPE(10000.f);
				outVelocity = DIM_TYPE(0.0);
				return;
			}
		}
		`
        );
    } else {
        return ``;
    }
}

function scGetVectorFieldForce(inDesc: ParticleEmitterDesc) {
    if ((inDesc.VelocityFieldForceScale > 0)) {
        return (
            //sample vector field based on cur pos
            /* glsl */ `

		#if !GRAVITY
			vec2 uv = (inPosition.xy + 1.f) * 0.5f;
			uv.x += float(gl_VertexID) * 0.025;
			uv.y += float(gl_VertexID) * 0.01;
			//uv *= 0.5f;
			uv.y -= CurTime * 0.1f;
			//uv *= mix(0.1f, 0.5f, fract(mod(CurTime, 10.f) * 0.1f));
			vec3 randVecNoise = texture(NoiseTexture, uv.xy).rgb;
			//vec3 randVecNoise = texture(NoiseTextureHQ, uv.xy).rgb;
			vec2 randVec;
			randVec.x = randVecNoise.r;
			randVec.y = mix(randVecNoise.g, randVecNoise.b, fract(mod(CurTime, 10.f) * 0.1f));
			randVec = randVec * 2.f - 1.f;
			const float RandVecScale = float(` + inDesc.VelocityFieldForceScale + /* glsl */ `);
			//randVec = normalize(randVec);
			randVec = (randVec) * RandVecScale * 2.0 /* * 0.5 */;


			//randVec = randVec * (2.0 - abs(dot(randVec, curVel.xy)));
			
			/* if(dot(randVec, curVel.xy) < 0.5)
			{
				//randVec = randVec * (1.0 - abs(dot(randVec, curVel.xy)));
				randVec *= 0.0;
			} */

			//LQ Noise
			uv = (inPosition.xy + 1.f) * 0.5f;
			uv *= 0.01f;
			uv.y -= CurTime * 0.00025f;
			uv.x += CurTime * 0.0025f;
			randVecNoise = texture(NoiseTexture, uv.xy).rgb;
			vec2 randVecLQ;
			randVecLQ.x = randVecNoise.r;
			randVecLQ.y = randVecNoise.g;
			randVecLQ = randVecLQ * 2.f - 1.f;
			//randVec += (randVecLQ) * RandVecScale;

			//const float clampValue = 10.f;
			const float clampValue = 100.f;
			randVec = clamp(randVec, vec2(-clampValue), vec2(clampValue));

			//randVel = normalize(vec2(-1, 0.0)) * 35.f * 0.5;

			//curVel += randVel * DeltaTime;
			netForce.xy += randVec;

			#if THIRD_DIMENSION
			//netForce.z -= 1000.0;
			#endif

			//Radial Velocity away from center
			//netForce.xy += normalize(inPosition) * 2.0;

		#else

			//curVel += vec2(0.0, -100.0) * DeltaTime;
			netForce.xy += vec2(0.0, -65.0);

		#endif//FALLING

			
			`
        );
    } else {
        return ``;
    }
}

function scGetParticleUpdateLogic(inDesc : ParticleEmitterDesc) : string
{
	if(inDesc.bOneShotParticle)
	{
		return (
		 /* glsl */ `
		if(curAge > -0.6f && curAge < 0.0f) //initial one sot age is -0.5
		{
			bAllowNewSpawn = true;
		}
		else
		{
		   if(bOutdatedParticle)
		   {
			#if ALWAYS_RESPAWN
				bAllowNewSpawn = true;
			#else
				curAge = -1.f; //MARK DEAD
			#endif
		   }
		   else
		   {
				bAllowUpdate = true;
		   }
		}`
        );
	}
	else
	{
		return (
			/* glsl */ `
		   //Get Cur Fire based on Pos
			vec2 fireUV = (inDefaultPosition + 1.f) * 0.5f;
			float curFire = textureLod(FireTexture, fireUV.xy, 0.0).r;
		  
			vec2 kSpawnRange = vec2(float(` + inDesc.SpawnRange.x + /* glsl */ `), 
			float(` + inDesc.SpawnRange.y + /* glsl */ `));
			bool bIsInSpawnRange = ((curFire >= kSpawnRange.x) && (curFire <= kSpawnRange.y ));

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
			  `
		   );
	}
}

function scParticleUpdateDefines(inDesc : ParticleEmitterDesc)
{
	const freeFall = `#define FALLING ` + (inDesc.bFreeFallParticle ? `1` : `0`);
	const gravity = `#define GRAVITY ` + (inDesc.bUseGravity ? `1` : `0`);
	const respawn = `#define ALWAYS_RESPAWN ` + (inDesc.bAlwaysRespawn ? `1` : `0`);
	const dim = `#define THIRD_DIMENSION ` + (inDesc.b3DSpace ? `1` : `0`); 
	const dimtype = `#define DIM_TYPE ` + (inDesc.b3DSpace ? `vec3` : `vec2`); 

	return freeFall + ` \n ` + respawn + ` \n ` + dim + ` \n ` + dimtype + ` \n ` + gravity;
}

export function GetParticleUpdateShaderVS(
    inDesc: ParticleEmitterDesc,
    /* spawnFireRange: Vector2,
    initialVelocityScale: number,
    velocityFieldForceScale: number,
    buoyancyForceScale: number,
    downwardForceScale: number,
    EInitialPositionMode: number, //0:default, 1:random, 2:from Emitter Pos constant
    randomSpawnThres: number,
    bOneShotParticle: boolean, */
) {
	const dimtype = (inDesc.b3DSpace ? `vec3` : `vec2`); 
    return (
        /* glsl */ `#version 300 es
  

		`+scParticleUpdateDefines(inDesc)+ /* glsl */`


	  precision highp float;
	  precision mediump sampler2D;
  
	  layout(location = 0) in DIM_TYPE inPosition;
	  layout(location = 1) in DIM_TYPE inVelocity;
	  layout(location = 2) in float inAge;
	  layout(location = 3) in vec2 inDefaultPosition;
	  layout(location = 4) in DIM_TYPE inPrevPosition;
  
	  out DIM_TYPE outPosition;
	  out DIM_TYPE outVelocity;
	  out float outAge;
	  out DIM_TYPE outPrevPosition;
  
	  uniform float DeltaTime;
	  uniform float CurTime;
	  uniform float ParticleLife;
	  uniform DIM_TYPE EmitterPosition; 
	  uniform float FloorPosY;

	  uniform sampler2D NoiseTexture;
	  uniform sampler2D NoiseTextureHQ;
	  uniform sampler2D FireTexture;
  
	  //check if particle was spawned at least once
	  bool IsParticleAlive()
	  {
		  const vec2 BoundsStart = vec2(-10.f, -10.f);
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
			  #if FALLING
			  outPrevPosition = inPrevPosition;
			  #endif
		  }
		  else
		  {
			  bool bAllowNewSpawn = false;
			  bool bAllowUpdate = false;
			  bool bOutdatedParticle = inAge > ParticleLife;

			  float curAge = inAge;

				` + scGetParticleUpdateLogic(inDesc) + /* glsl */`
  
			  if(bAllowNewSpawn)
			  {
					
				  /* Particle has exceeded its lifetime. Respawn. */

				  ` +
        scRandomiseParticleSpawn(inDesc.RandomSpawnThres) +
        /* glsl */ `
				  
					outAge = 0.0; //TODO: Random Age

					DIM_TYPE netForce = DIM_TYPE(0.0);
					DIM_TYPE curPos = DIM_TYPE(0.0);

				  ` +
        scGetInitialPosition(inDesc.EInitialPositionMode) +
        /* glsl */ `
  
				  ` +
        scGetRandomInitialVelocity(inDesc) +
        /* glsl */ `

				//Intergrate
			#if FALLING
				outPrevPosition = curPos;
			#endif//FALLING
				DIM_TYPE vel = netForce * 100.0 * DeltaTime;
    			curPos = curPos + vel * DeltaTime;
				outVelocity = vel;
				outPosition = curPos;
				return;
				
			  }
			  else if(bAllowUpdate)
			  {
				/* Update */
				//Hotter particles are faster
				/* const float MinSpeedScale = 0.85f;
				const float MaxSpeedScale = 1.25f;
				float temperature = clamp(MapToRange(curFire, kSpawnRange.x, 10.f, MinSpeedScale, MaxSpeedScale), MinSpeedScale, MaxSpeedScale); */

				outAge = inAge + DeltaTime;

				DIM_TYPE curVel = inVelocity;
				DIM_TYPE netForce = DIM_TYPE(0.0);
				` + scGetVectorFieldForce(inDesc) + /* glsl */ `

				const float buoyancyForce = float(` + inDesc.BuoyancyForceScale + /* glsl */ `);
				//curVel.y += buoyancyForce * DeltaTime;
				netForce.y += buoyancyForce;
				const float downwardForceScale = float(` + inDesc.DownwardForceScale + /* glsl */ `);
				float posYNorm = (inPosition.y + 1.f) * 0.5f;
				float downwardForce = posYNorm  * downwardForceScale;
				if(curVel.y > 0.f)
				{
					//curVel.y -= downwardForce * DeltaTime * curVel.y;
					netForce.y -= downwardForce * curVel.y;
				}

				DIM_TYPE curPos = inPosition;
				DIM_TYPE prevPos = inPrevPosition;

				//Intergrate
				const float Damping = 0.99f;
			#if FALLING
				//Verlet
				DIM_TYPE prevVelocity = (curPos - prevPos);
    			prevPos = curPos;
    			prevVelocity = prevVelocity * Damping;
    			curPos = curPos + prevVelocity + netForce * 0.1 * DeltaTime * DeltaTime;
				outVelocity = (curPos - prevPos) / DeltaTime * 10.0 * 1.5;
			#else
				//Euler
				curVel += netForce * DeltaTime;
				curVel *= Damping;
				curPos = curPos + curVel * 0.1 * DeltaTime;
				outVelocity = curVel;
			#endif//FALLING
				
				#if FALLING
				//Floor Intersection
				const float CollisionResponseCoef = 1.25;
				float curDist = abs(curPos.y - FloorPosY);
				const float particleRadius = 0.025;

				bool bCollision = false;

				if(curPos.y < FloorPosY)
				{
					curPos.y = FloorPosY + particleRadius;
					bCollision = true;
					
				}
				else if(curDist <= particleRadius)
				{
					float delta = particleRadius - curDist;
					const vec2 planeNormal = vec2(0.0, 1.0);
					curPos.xy += (planeNormal * delta * CollisionResponseCoef);
					bCollision = true;
				}

				if(bCollision)
				{
					curPos.x = mix(curPos.x, prevPos.x, 0.25);
					#if THIRD_DIMENSION
					curPos.z = mix(curPos.z, prevPos.z, 0.25);
					#endif
				}
				#endif

				outPosition = curPos;
				outPrevPosition = prevPos;
				

			  }
			  else
			  {
				outAge = curAge;
				outPosition = inPosition;
				outPrevPosition = inPrevPosition;
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

function scTransformBasedOnMotion(inDesc: ParticleEmitterDesc) {
    if (inDesc.bMotionBasedTransform) {
        return /* glsl */ `DIM_TYPE curVelocity = inVelocity;
			float velLength = length(curVelocity.xy) * 0.10;
			#if THIRD_DIMENSION
			velLength *= (1.0 - ageNorm) * (1.0 - ageNorm);
			//velLength += curVelocity.z * 0.05;
			#endif
			velLength *= float(`+inDesc.MotionStretchScale+/* glsl */`);
			velLength *= max(0.5, (1.0 - min(1.0, inAge * 0.5)));
			#if (0 && THIRD_DIMENSION)
			/* if(distToCam < 2.0)
			{
				velLength *= 0.0;
			} */
			velLength *= clamp(MapToRange(distToCam, 3.0, 1.0, 1.0, 0.0), 0.0, 1.0);
			#endif
			//if(velLength > 0.f)
			{
				velLength = min(5.0, velLength);
				pos.y *= clamp(1.f - velLength * 0.75, 0.5f, 1.f);
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

export function GetParticleRenderInstancedVS(inDesc: ParticleEmitterDesc) {
    return (
        /* glsl */ `#version 300 es
  
		precision mediump float;
		precision mediump sampler2D;

		`+scParticleUpdateDefines(inDesc)+ /* glsl */`
	
		layout(location = 0) in vec2 VertexBuffer;
		layout(location = 1) in vec2 TexCoordsBuffer;
	
		layout(location = 2) in DIM_TYPE inPosition;
		layout(location = 3) in float inAge;
		layout(location = 4) in DIM_TYPE inVelocity;
	
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
		#if (0 && THIRD_DIMENSION)
		flat out float interpolatorDistToCam;
		#endif
	
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
        inDesc.InitialTranslate.x +
        /* glsl */ `), float(` +
        inDesc.InitialTranslate.y +
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
				
				
  
			#if 1 //NOISE-DRIVEN SIZE
			const float kSizeChangeSpeed = float(` +
        inDesc.RandomSizeChangeSpeed +
        /* glsl */ `);
			if(kSizeChangeSpeed > 0.01)
			{
				const vec2 kSizeRangeMinMax = vec2(float(` +
        inDesc.SizeRangeMinMax.x +
        /* glsl */ `), float(` +
        inDesc.SizeRangeMinMax.y +
        /* glsl */ `));
				const vec2 kSizeClampMax = vec2(float(` +
        inDesc.SizeClampMax.x +
        /* glsl */ `), float(` +
        inDesc.SizeClampMax.y +
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
				pos.x *= float(` + inDesc.DefaultSize.x + /* glsl */ `);
				pos.y *= float(` + inDesc.DefaultSize.y + /* glsl */ `);

			#if (0 && THIRD_DIMENSION)
				float distToCam = length(inPosition.xyz - CameraDesc.xyz);
				float distToCamZ = abs(inPosition.z - CameraDesc.z);
				interpolatorDistToCam = distToCamZ;
				pos.xy *= 1.0 + (1.0 - min(1.0, distToCamZ * 0.5)) * 20.0;
			#endif


		//fade in-out
		` +
        scFadeInOutTransform(inDesc.EFadeInOutMode) +
        /* glsl */ `

			//Rotate based on velocity
			` +
        scTransformBasedOnMotion(inDesc) +
        /* glsl */ `



				DIM_TYPE translation = inPosition;
				pos.xy += translation.xy;
				pos.xy -= CameraDesc.xy;
				pos.xy *= CameraDesc.w;
				#if THIRD_DIMENSION
				pos.xy /= (1.0 + translation.z - CameraDesc.z);
				#else
				pos.xy /= kSizeScale;
				#endif
				pos.x /= ScreenRatio;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scFlameSpecificShading(bUsesTexture: boolean) {
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

		//colorFinal.rgb = max(vec3(0.0), Contrast(colorFinal.rgb, 1.5));

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

		/* float brightness = mix(0.35, 0.15, interpolatorAge);
		colorFinal.rgb *= brightness; */
		
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

		/* #if 1
		float radialDistanceScale = length(interpolatorTexCoords - vec2(0.5, 0.5));
		radialDistanceScale = (1.f - clamp(radialDistanceScale, 0.f, 1.f));
		colorFinal.a *= pow(radialDistanceScale, 5.f);
		#endif */
		#if 1
		float s = 1.0 - interpolatorTexCoords.y;
		if(s < 0.3)
		{
			s = MapToRange(s, 0.0, 0.3, 0.0, 1.0);
			colorFinal *= s;
		}
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
		t = CircularFadeOut(t);

	#if 1
		vec3 colorBright = vec3(1.0 * (1.0 + (14.0 * (1. - t))), 0.75, 0.1);
		//vec3 colorBright = vec3(1.0 * (1.0 + (14.0 * (1. - t))));
		vec3 colorLow = vec3(1.0, 0.75, 0.5);
		colorFinal.rgb = mix(colorBright, colorLow , t);

	#else
		colorFinal.rgb = vec3(1.0, 0.5, 0.2) * 10.0;
		colorFinal.rgb = mix(colorFinal.rgb, vec3(0.5, 0.0, 0.5), interpolatorAge * interpolatorAge);
	#endif

		colorFinal.rgb *= 2.f * (1.0 - t);

		float s = length(interpolatorTexCoords - vec2(0.5, 0.5));
		s = (1.f - clamp(s, 0.f, 1.f));
		colorFinal.rgb *= s;

		colorFinal.rgb *= 3.0f;

		s = 1.0;

		float thres = mix(0.0, 0.2, interpolatorAge);
		if(interpolatorTexCoords.x > (1.0 - thres))
		{	
			float m = MapToRange(interpolatorTexCoords.x, (1.0 - thres), 1.0, 1.0, 0.0);
			s = m * m;
			colorFinal.rgb = min(vec3(1.0), colorFinal.rgb);
		}
		else if(interpolatorTexCoords.x < thres)
		{
			float m = MapToRange(interpolatorTexCoords.x, 0.0, thres, 0.0, 1.0);
			s = m * m;
			colorFinal.rgb = min(vec3(1.0), colorFinal.rgb);
		}

		colorFinal.rgb = mix(colorFinal.rgb, vec3(0.0), 1.0 - s);

		`;
}

function scEmbersImpactSpecificShading(inDesc : ParticleEmitterDesc) {
    return /* glsl */ `
		/* vec3 colorBright = vec3(1.f, 0.5f, 0.1f) * 1.5f;
		vec3 colorLow = vec3(0.5f, 0.5f, 0.5f); */

		
		//t = sqrt(1.0 - t*t);
		//t = 1.0 - t;
		
		//vec3 colorBright = vec3(1.0, 0.5, 0.1);
		//vec3 colorBright = vec3(0.8, 0.7, 1.0);
		const vec3 colorBright = vec3(`+inDesc.Color.x+`, `+inDesc.Color.y+`, `+inDesc.Color.z+ /* glsl */`);

		colorFinal.rgb = colorBright * DynamicBrightness;

		const float riseTHres = 0.2;
		if(interpolatorAge < riseTHres)
		{
			float mm = MapToRange(interpolatorAge, 0.0, riseTHres, 0.5, 1.0);
			colorFinal.rgb *= mm;
		}

		float t = interpolatorAge;
		t = 1.0 - CircularFadeOut(t);
		t = min(1.0, t + 0.2);

		colorFinal.rgb *= 2.f /* * t */;

		//t = interpolatorAge
		
		colorFinal.rgb *= 10.0;

		float s = length(interpolatorTexCoords - vec2(0.5, 0.5));
		//s *= 1.25f;
		//s *= (1.0 + interpolatorAge * 1.0);
		/* if(s > 0.5f)
		{
			s += 0.25f;
			//s = 1.f;
		}
		else
		{
			s -= 0.25f;
			//s = 0.f;
		} */
		//s += 0.15f;
		s = (1.f - clamp(s, 0.f, 1.f));
		

		#if (0 && THIRD_DIMENSION)//DoF
		float dNorm = 1.0 - clamp(MapToRange(interpolatorDistToCam, 2.0, 0.5, 0.0, 1.0), 0.0, 1.0);
		dNorm = 1.0;
		float dof = length(interpolatorTexCoords - vec2(0.5, 0.5));
		float c = 0.75;
		//float c = 0.1;
		//dof *= 2.f;
		if(dof > 0.5f)
		{
			dof += c;
			//s = 1.f;
		}
		else
		{
			dof -= c;
			//s = 0.f;
		}
		dof = (1.f - clamp(dof, 0.f, 1.f));

		//s = mix(s, dof, min(1.0, dNorm));

		vec3 colorRadialCut = colorFinal.rgb * s * s * 2.25f * 2.0;

		vec3 colorDoF = colorFinal.rgb * dof * clamp(1.0 - dNorm, 0.5, 1.0);

		colorFinal.rgb = mix(colorRadialCut, colorDoF, dNorm);

		#else


		float dNorm = 0.0;

		colorFinal.rgb *= s * s;
		colorFinal.rgb *= 2.25f * 2.0;

		#endif //DoF

		
		#if 1 && THIRD_DIMENSION //sides fade
		float s2 = 1.0;
		float thres = mix(0.0, 0.2, max(0.0, interpolatorAge - dNorm));
		if(interpolatorTexCoords.x > (1.0 - thres))
		{	
			float m = MapToRange(interpolatorTexCoords.x, (1.0 - thres), 1.0, 1.0, 0.0);
			s2 = m * m;
			//colorFinal.rgb = min(vec3(1.0), colorFinal.rgb);
		}
		else if(interpolatorTexCoords.x < thres)
		{
			float m = MapToRange(interpolatorTexCoords.x, 0.0, thres, 0.0, 1.0);
			s2 = m * m;
			//colorFinal.rgb = min(vec3(1.0), colorFinal.rgb);
		}
		colorFinal.rgb = mix(colorFinal.rgb, vec3(0.0), 1.0 - s2);
		#endif

		#if 0
		t = interpolatorAge;
		const float fThres = 0.55;
		if(t > fThres)
		{
			t = MapToRange(t, fThres, 1.0, 0.0, 1.0);
			t = clamp(t, 0.0, 1.0);
			colorFinal.rgb = mix(colorFinal.rgb, vec3(0.1) * s, t);
		}
		#endif
		


		
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

function scGetBasedOnShadingMode(inDesc: ParticleEmitterDesc, bUsesTexture: boolean, alphaScale: number) {
    switch (inDesc.ESpecificShadingMode) {
        case EParticleShadingMode.Default:
            return scDefaultShading();
        case EParticleShadingMode.Flame:
            return scFlameSpecificShading(bUsesTexture);
        case EParticleShadingMode.Embers:
            return scEmbersSpecificShading();
        case EParticleShadingMode.EmbersImpact:
            return scEmbersImpactSpecificShading(inDesc);
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

export function GetParticleRenderColorPS(inDesc: ParticleEmitterDesc, bUsesTexture: boolean) {
    return (
        /* glsl */ `#version 300 es
	  
		precision mediump float;
		precision mediump sampler2D;

		
		`+scParticleUpdateDefines(inDesc)+ /* glsl */`
	
	
		out vec4 OutColor;
	
		flat in float interpolatorAge;
		flat in float interpolatorFrameIndex;
		in vec2 interpolatorTexCoords;
		flat in int interpolatorInstanceId;
		#if (0 && THIRD_DIMENSION)
		flat in float interpolatorDistToCam;
		#endif

		uniform sampler2D ColorTexture;
		uniform sampler2D FlameColorLUT;
		
		uniform vec2 FlipbookSizeRC;
		uniform float CurTime;
		uniform float DynamicBrightness;
  
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

		float Contrast(float color, float contrast)
		{
			return max(float(0.f), contrast * (color - 0.5f) + 0.5f);
		}

		vec3 Contrast(vec3 color, float contrast)
		{
			return vec3(Contrast(color.r, contrast), Contrast(color.g, contrast), Contrast(color.b, contrast));
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
        scGetBasedOnShadingMode(inDesc, bUsesTexture, inDesc.AlphaScale) +
        /* glsl */ `

		//fade in-out
		` +
        scAlphaFade(inDesc.EAlphaFade) +
        /* glsl */ `

		//initial brightness
		` +
        scApplyBrightness(inDesc.Brightness) +
        /* glsl */ `

			OutColor = colorFinal;
		}`
    );
}
