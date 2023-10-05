export function GetParticleUpdateShaderVS() {
    return /* glsl */ `#version 300 es
  
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
			  
			  bool bIsBurning = curFire >= 0.99f;
			  bool bAllowNewSpawn = false;
			  bool bAllowUpdate = false;
			  bool bOutdatedParticle = inAge > ParticleLife;
			  float curAge = inAge;
  
			  if(bIsBurning)
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
  
				  #if 1
					  outVelocity = vec2(0, 0);
					  //outVelocity = vec2(0, 1);
				  #else
					  //random init velocity
					  vec2 uv = vec2(CurTime * 0.17f + 0.12f * float(gl_VertexID), CurTime * 0.09 + 0.07 * float(gl_VertexID));
					  uv *= 0.1f;
					  vec2 noise = texture(NoiseTextureHQ, uv.xy).rg;
					  noise = noise * 2.f - 1.f;
					  //noise = normalize(noise);
					  const float InitialVelocityScale = 10.f;
					  outVelocity = (noise.xy) * InitialVelocityScale;
				  #endif
  
				  outAge = 0.0; 
  
				  return;
			  }
			  else if(bAllowUpdate)
			  {
				  /* Update */
				  outAge = inAge + DeltaTime;
  
				  vec2 curVel = inVelocity;
  
				  #if 0//sample velocity based on curPos
					  vec2 uv = (inPosition + 1.f) * 0.5f;
					  uv.y -= CurTime * 0.1f;
					  uv *= 0.35f;
					  //uv *= mix(0.1f, 0.5f, fract(mod(CurTime, 10.f) * 0.1f));
					  vec3 randVelNoise = texture(NoiseTexture, uv.xy).rgb;
					  //vec3 randVelNoise = texture(NoiseTextureHQ, uv.xy).rgb;
					  vec2 randVel;
					  randVel.x = randVelNoise.r;
					  randVel.y = mix(randVelNoise.g, randVelNoise.b, fract(mod(CurTime, 10.f) * 0.1f));
					  randVel = randVel * 2.f - 1.f;
					  const float RandVelocityScale = 5.f;
					  //randVel = normalize(randVel);
					  randVel = (randVel) * RandVelocityScale;
					  curVel += randVel * DeltaTime;
				  #endif
  
				  const float buoyancyForce = 0.f;
				  curVel.y += buoyancyForce * DeltaTime;
  
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
  
		  
  
	  }`;
}
export const ParticleUpdatePS = /* glsl */ `#version 300 es
	  precision highp float;
	  void main()
	  {}`;

export const ParticleRenderInstancedVS = /* glsl */ `#version 300 es
  
	  precision highp float;
  
	  layout(location = 0) in vec2 VertexBuffer;
	  layout(location = 1) in vec2 TexCoordsBuffer;
  
	  layout(location = 2) in vec2 inPosition;
	  layout(location = 3) in float inAge;
  
	  uniform float ParticleLife;
	  uniform float NumLoops;
	  uniform float CurTime;
	  uniform vec2 FlipbookSizeRC;

	  uniform sampler2D NoiseTexture;
  
	  flat out float interpolatorAge;
	  flat out float interpolatorFrameIndex;
	  out vec2 interpolatorTexCoords;
  
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
			  float ageNorm = inAge / ParticleLife;
			  interpolatorAge = ageNorm;

			  float animationParameterNorm = ageNorm;
			  if(NumLoops > 1.f)
			  {
				animationParameterNorm = fract(inAge / (ParticleLife / NumLoops));
			  }
  
			  float TotalFlipFrames = FlipbookSizeRC.x * FlipbookSizeRC.y;
			  interpolatorFrameIndex = (animationParameterNorm * TotalFlipFrames);
  
  
			  vec2 pos = VertexBuffer.xy;

			  //scale
			  float scale = 0.075f;
			#if 1 //NOISE-DRIVEN SIZE
			  vec2 noiseUV = vec2(CurTime * 0.17f + 0.23f * float(gl_InstanceID), CurTime * 0.09 + 0.17 * float(gl_InstanceID));
			  //noiseUV *= 0.1f;
			  vec2 noise = textureLod(NoiseTexture, noiseUV.xy, 0.f).rg;
			  //noise.r = clamp(MapToRange(noise.r, 0.4, 0.6, 0.f, 1.f), 0.f, 2.f);
			  noise.r = clamp(MapToRange(noise.r, 0.2, 0.8, 0.f, 1.f), 0.f, 2.f);

			  const float scaleAmount = 0.2f;
			  scale = noise.r * scaleAmount;

			  if(scale < 0.35 * scaleAmount)
			  {
				gl_Position = vec4(-10, -10, -10, 1.0);
				return;
			  }
			#endif
			  
			  pos.xy *= scale;
			  //offset to origin
			  const float scaleOffsetAmount = 0.9f;
			  pos.y += scale * scaleOffsetAmount;
			  //scale
			  pos.y *= 3.0f;

			  //fade in-out
			#if 1 //SINGLE CURVE
			  ageNorm = ageNorm * (1.0 - ageNorm) * (1.0 - ageNorm) * 6.74;
			  pos.x *= clamp(ageNorm, 0.1, 1.f);
			  pos.y *= ageNorm;
			#else
			  float normAgeFadeInPow = sqrt(1.f - pow(1.f - ageNorm, 8.f));
			  pos.xy *= normAgeFadeInPow;

			  float normAgeFadeOutPow = 1.f - clamp(pow(ageNorm, 4.f), 0.f, 1.f);
			  pos.xy *= normAgeFadeOutPow;
			#endif

			  //translate
			  pos.xy += inPosition;
  
			  gl_Position = vec4(pos.xy, 0.0, 1.0);
			  
		  }
		  
	  }`;

export const ParticleRenderColorPS = /* glsl */ `#version 300 es
	  
	  precision highp float;
  
	  out vec4 OutColor;
  
	  flat in float interpolatorAge;
	  flat in float interpolatorFrameIndex;
	  in vec2 interpolatorTexCoords;
  
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
  
		  uint flipBookIndex1D = uint(floor(interpolatorFrameIndex));
		  uvec2 FlipBookIndex2D;
		  FlipBookIndex2D.x = (flipBookIndex1D % uint(FlipbookSizeRC.x));
		  FlipBookIndex2D.y = (flipBookIndex1D / uint(FlipbookSizeRC.x));
  
		  vec2 frameSize = 1.f / (FlipbookSizeRC);
		  vec2 uv = interpolatorTexCoords * frameSize;
		  uv.x += (frameSize.x * float(FlipBookIndex2D.x));
		  uv.y += (frameSize.y * float(FlipBookIndex2D.y));
		  
		  vec4 colorFinal = texture(ColorTexture, uv).rgba;

		  
		  float lutSamplingU = 1.f - interpolatorTexCoords.y;
		  lutSamplingU *= clamp((1.f - interpolatorAge), 0.25, 0.5f);
		  //lutSamplingU *= 0.2f;
		  vec3 flameColor = texture(FlameColorLUT, vec2(lutSamplingU, 0.5)).rgb;
		  float t = interpolatorAge;
		  t = t + MapToRange(interpolatorTexCoords.y, 0.f, 1.f, -1.f, 0.75f);
		  t = CircularFadeIn(clamp(t, 0.f, 1.f));
		  t *= 0.25f;
		  //t = clamp(t + CircularFadeIn(interpolatorTexCoords.y * 0.5f), 0.f, 1.f);

		  colorFinal.rgb = mix(colorFinal.rgb, colorFinal.a * flameColor * 7.5f, t);
		  
		  //float ageNormalized = interpolatorAge * (1.0 - interpolatorAge) * (1.0 - interpolatorAge) * 6.74;
		  //colorFinal.rgb *= (1.f - interpolatorAge);

		  OutColor = colorFinal;
	  }`;
