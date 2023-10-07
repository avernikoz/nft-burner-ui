import { EParticleShadingMode } from "./particles";

export const FlameParticlesDesc = {
    inName: "Flame Particles",
    inNumSpawners2D: 64,
    inNumParticlesPerSpawner: 1,
    inSpawnRange: { x: 0.99, y: 1000.0 },
    inParticleLife: 2.4,
    inNumLoops: 3.0,
    inTextureFileName: "assets/sprites/Flame03_16x4.png",
    inFlipbookSizeRC: { x: 16.0, y: 4.0 },
    inDefaultSize: { x: 1.0, y: 3.0 },
    inInitialVelocityScale: 0.0,
    inVelocityFieldForceScale: 0.0,
    inBuoyancyForceScale: 0.0,
    inbOriginAtCenter: false,
    inESpecificShadingMode: EParticleShadingMode.Flame,
};

export const EmberParticlesDesc = {
    inName: "Ember Particles",
    inNumSpawners2D: 32,
    inNumParticlesPerSpawner: 1,
    inSpawnRange: { x: 0.1, y: 1000.0 },
    inParticleLife: 4.1,
    inNumLoops: 1.0,
    inTextureFileName: "",
    inFlipbookSizeRC: { x: 16.0, y: 4.0 },
    inDefaultSize: { x: 0.05, y: 0.05 },
    inInitialVelocityScale: 10.0,
    inVelocityFieldForceScale: 40.0,
    inBuoyancyForceScale: 3,
    inbOriginAtCenter: false,
    inESpecificShadingMode: EParticleShadingMode.Embers,
};
