import { EParticleShadingMode, ParticleEmitterDesc } from "./particles";
import { MathLerp } from "./utils";

export function GetFlameParticlesDesc(): ParticleEmitterDesc {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 64;
    desc.NumParticlesPerSpawner = 1;
    desc.SpawnRange = { x: 10.0 + Math.random() * 100.0, y: 1000.0 };
    desc.ParticleLife = 2.4;
    desc.NumLoops = 3.0;
    desc.TextureFileName = "Flame02_16x4";
    desc.FlipbookSizeRC = { x: 16.0, y: 4.0 };
    desc.DefaultSize = { x: 0.2 * 1.0, y: 0.5 * 1.0 };
    desc.SizeRangeMinMax = { x: 0.45, y: 1.2 };
    desc.SizeClampMax = { x: 0.35, y: 0.0 };
    desc.InitialVelocityScale = 0.0;
    desc.VelocityFieldForceScale = 0.0;
    desc.BuoyancyForceScale = 0.0;
    desc.EAlphaFade = 1;
    desc.RandomSpawnThres = 0.1;
    desc.Brightness = 1.0;
    desc.ESpecificShadingMode = EParticleShadingMode.Flame;
    desc.EFadeInOutMode = 3;
    desc.InitialTranslate = { x: 0.0, y: 0.9 };
    return desc;
}

export function GetEmberParticlesDesc(): ParticleEmitterDesc {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 24;
    desc.NumParticlesPerSpawner = 1;
    desc.SpawnRange = { x: 0.1, y: 100000.0 };
    desc.ParticleLife = 1.4;
    desc.NumLoops = 1.0;
    desc.TextureFileName = "";
    desc.FlipbookSizeRC = { x: 16.0, y: 4.0 };
    desc.DefaultSize = { x: 0.125 * 0.1, y: 0.125 * 0.1 };
    desc.SizeRangeMinMax = { x: 0.3, y: 1.0 };
    desc.RandomSizeChangeSpeed = 0.1;
    desc.SizeClampMax = { x: 0.0, y: 0.0 };
    desc.InitialVelocityScale = MathLerp(50.0, 100.0, Math.random());
    desc.VelocityFieldForceScale = MathLerp(100.0, 500.0, Math.random());
    desc.BuoyancyForceScale = 5.0;
    desc.DownwardForceScale = 1.0;
    desc.bMotionBasedTransform = true;
    desc.EFadeInOutMode = 0;
    desc.bOneShotParticle = false;
    desc.bFreeFallParticle = false;
    desc.EInitialPositionMode = 0;
    desc.Brightness = 1.0;
    desc.RandomSpawnThres = 0.5;
    desc.ESpecificShadingMode = EParticleShadingMode.Embers;
    return desc;
}

export function GetSmokeParticlesDesc() {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 32;
    desc.NumParticlesPerSpawner = 2;
    desc.SpawnRange = { x: MathLerp(20.0, 200.0, Math.random()), y: 1000.0 };
    desc.ParticleLife = 3.5;
    desc.NumLoops = 1.0;
    desc.TextureFileName = "Explosion01-nofire_5x5";
    desc.FlipbookSizeRC = { x: 5.0, y: 5.0 };
    desc.DefaultSize = { x: 2.0 * 0.275, y: 2.125 * 0.275 };
    desc.SizeRangeMinMax = { x: 0.7, y: 1.0 };
    desc.SizeClampMax = { x: 0.7, y: 0.7 };
    desc.InitialVelocityScale = 5.0;
    desc.VelocityFieldForceScale = 20.0;
    desc.BuoyancyForceScale = 10; //TODO =Increase dynamically when overall temperature is high
    desc.DownwardForceScale = 0.25;
    desc.RandomSizeChangeSpeed = 0.01;
    desc.AlphaScale = 0.25;
    desc.EAlphaFade = 1;
    desc.Brightness = 1.0;
    desc.EFadeInOutMode = 1;
    desc.ESpecificShadingMode = EParticleShadingMode.Smoke;
    return desc;
}

export function GetAfterBurnSmokeParticlesDesc() {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 4;
    desc.NumParticlesPerSpawner = 1;
    desc.SpawnRange = { x: 0.001, y: 1.0 };
    desc.ParticleLife = 12.7;
    desc.NumLoops = 4.0;
    desc.TextureFileName = "DiscSmoke01_16x4";
    desc.FlipbookSizeRC = { x: 16.0, y: 4.0 };
    desc.DefaultSize = { x: 2.0 * 0.35, y: 3.525 * 0.35 };
    desc.SizeRangeMinMax = { x: 0.99, y: 1.01 };
    desc.SizeClampMax = { x: 1.0, y: 1.0 };
    desc.InitialVelocityScale = 1.1;
    desc.VelocityFieldForceScale = 1.0;
    desc.BuoyancyForceScale = 0;
    desc.DownwardForceScale = 0.0;
    desc.bMotionBasedTransform = false;
    desc.EAlphaFade = 1;
    desc.AlphaScale = 0.5;
    desc.Brightness = 0.0;
    desc.RandomSpawnThres = 0.05;
    desc.EFadeInOutMode = 0;
    desc.ESpecificShadingMode = EParticleShadingMode.AfterBurnSmoke;
    desc.InitSpawnPosOffset = { x: 0.2, y: 0.0 };
    desc.InitialTranslate = { x: 0.0, y: 0.95 };
    return desc;
}

export function GetAfterBurnAshesParticlesDesc() {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 16;
    desc.NumParticlesPerSpawner = 1;
    desc.SpawnRange = { x: 0.001, y: 10.0 };
    desc.ParticleLife = 6.8;
    desc.NumLoops = 1.0;
    desc.TextureFileName = "perlinNoise512";
    desc.FlipbookSizeRC = { x: 5.0, y: 5.0 };
    desc.DefaultSize = { x: 0.075, y: 0.075 };
    desc.SizeRangeMinMax = { x: 0.45, y: 1.0 };
    desc.SizeClampMax = { x: 0.0, y: 0.0 };
    desc.InitialVelocityScale = 10.0;
    desc.VelocityFieldForceScale = 50.0;
    desc.BuoyancyForceScale = MathLerp(5.0, 20, Math.random());
    desc.DownwardForceScale = 0.1;
    desc.ESpecificShadingMode = EParticleShadingMode.Ashes;
    return desc;
}

export function GetDustParticlesDesc() {
    const desc = new ParticleEmitterDesc();
    desc.NumSpawners2D = 48;
    desc.NumParticlesPerSpawner = 1;
    desc.SpawnRange = { x: 0.0, y: 1.0 };
    desc.ParticleLife = 20.8;
    desc.NumLoops = 1.0;
    desc.TextureFileName = "perlinNoise512";
    desc.FlipbookSizeRC = { x: 5.0, y: 5.0 };
    desc.DefaultSize = { x: 0.01, y: 0.01 };
    desc.SizeRangeMinMax = { x: 0.45, y: 1.35 };
    desc.SizeClampMax = { x: 0.0, y: 0.0 };
    desc.RandomSizeChangeSpeed = 0.2;
    desc.InitialVelocityScale = 2.0;
    desc.VelocityFieldForceScale = 2.0;
    desc.BuoyancyForceScale = 0.0;
    desc.DownwardForceScale = 2.0;
    desc.EInitialPositionMode = 1;
    desc.RandomSpawnThres = 0.5;
    desc.EAlphaFade = 1;
    desc.EFadeInOutMode = 0;
    desc.ESpecificShadingMode = EParticleShadingMode.Dust;
    return desc;
}
