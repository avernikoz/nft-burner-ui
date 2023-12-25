export class AudioEngineSingleton {
    private static instance: AudioEngineSingleton;

    public isSoundEnabled: boolean = true;

    public audioContext;

    private clickAudioBuffer: AudioBuffer | null = null;

    private introAudioBuffer: AudioBuffer | null = null;

    private stampAudioBuffer: AudioBuffer | null = null;

    private lighterStartAudioBuffer: AudioBuffer | null = null;

    private lighterGasAudioBuffer: AudioBuffer | null = null;

    private burstAudioBuffer: AudioBuffer | null = null;

    private flameLoopAudioBuffer: AudioBuffer | null = null;

    private burningLoopAudioBuffer: AudioBuffer | null = null;

    private currentSource: AudioBufferSourceNode | null = null;

    private gasSoundSource: AudioBufferSourceNode | null = null;

    private burningSoundSource: AudioBufferSourceNode | null = null;

    private burningSoundSource2: AudioBufferSourceNode | null = null;

    private burningSoundSourceGain: GainNode | null = null;

    private gasSoundSourceGain: GainNode | null = null;

    public static getInstance(): AudioEngineSingleton {
        if (!AudioEngineSingleton.instance) {
            AudioEngineSingleton.instance = new AudioEngineSingleton();
        }
        return AudioEngineSingleton.instance;
    }

    private constructor() {
        if (window.AudioContext) {
            this.audioContext = new AudioContext();
            this.initSources();
        } else {
            //console.error("Web Audio API is not supported in this browser");
        }
    }

    initSources() {
        if (this.audioContext) {
            this.burningSoundSourceGain = this.audioContext.createGain();
            this.burningSoundSourceGain.connect(this.audioContext.destination);
            this.gasSoundSourceGain = this.audioContext.createGain();
            this.gasSoundSourceGain.connect(this.audioContext.destination);
            this.gasSoundSourceGain.gain.value = 0.5;
        }
    }

    async loadSounds() {
        this.clickAudioBuffer = await this.loadAudioBuffer("assets/audio/bassShot.mp3");
        this.introAudioBuffer = await this.loadAudioBuffer("assets/audio/intro.mp3");
        this.stampAudioBuffer = await this.loadAudioBuffer("assets/audio/stamp.mp3");
        this.lighterStartAudioBuffer = await this.loadAudioBuffer("assets/audio/lighterStart.mp3");
        this.lighterGasAudioBuffer = await this.loadAudioBuffer("assets/audio/lighterGasLoop.mp3");
        this.burstAudioBuffer = await this.loadAudioBuffer("assets/audio/fireBurst2.mp3");
        this.flameLoopAudioBuffer = await this.loadAudioBuffer("assets/audio/flameLoop2.mp3");
        this.burningLoopAudioBuffer = await this.loadAudioBuffer("assets/audio/burningLoop2.mp3");
    }

    async loadAudioBuffer(url: string): Promise<AudioBuffer> {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${response.status} - ${response.statusText}`);
            }

            const audioData = await response.arrayBuffer();
            return await this.audioContext!.decodeAudioData(audioData);
        } catch (error) {
            console.error(`Error loading audio file from ${url}:`, error);
            throw error; // Propagate the error to the caller
        }
    }

    PlaySoundBuffer(inSoundBuffer: AudioBuffer | null) {
        if (!this.isSoundEnabled) {
            return;
        }

        if (this.audioContext != null) {
            this.currentSource = this.audioContext.createBufferSource();
            if (inSoundBuffer) {
                this.currentSource.buffer = inSoundBuffer;
                this.currentSource.connect(this.audioContext.destination);
                this.currentSource.start();
            }
        }
    }

    PlayClickSound() {
        if (!this.isSoundEnabled) {
            return;
        }

        if (this.audioContext != null) {
            this.currentSource = this.audioContext.createBufferSource();
            if (this.clickAudioBuffer) {
                this.currentSource.buffer = this.clickAudioBuffer;
                this.currentSource.connect(this.audioContext.destination);
                this.currentSource.start();
            }

            /* const oscillator = this.audioContext.createOscillator();
            oscillator.frequency.value = 140;
            oscillator.connect(this.audioContext.destination);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1); */
        }
    }

    PlayIntroSound() {
        this.PlaySoundBuffer(this.introAudioBuffer);
    }

    PlayStampSound() {
        this.PlaySoundBuffer(this.stampAudioBuffer);
    }

    PlayLighterStartSound() {
        this.PlaySoundBuffer(this.lighterStartAudioBuffer);
    }

    bIsGasSoundPlaying = false;

    PlayLighterGasSound() {
        if (!this.isSoundEnabled) {
            return;
        }

        if (!this.bIsGasSoundPlaying) {
            if (this.audioContext != null) {
                this.gasSoundSource = this.audioContext.createBufferSource();
                if (this.lighterGasAudioBuffer) {
                    this.gasSoundSource.buffer = this.lighterGasAudioBuffer;
                    this.gasSoundSource.connect(this.gasSoundSourceGain!);
                    // Set a random start position
                    const offset = Math.random() * this.lighterGasAudioBuffer.duration;
                    this.gasSoundSource.start(0, offset);
                    this.bIsGasSoundPlaying = true;
                    // Listen for the end of the sound and reset the flag
                    this.gasSoundSource.onended = () => {
                        this.bIsGasSoundPlaying = false;
                    };
                }
            }
        }
    }

    ForceStopLighterGasSound() {
        if (this.gasSoundSource) {
            // Stop the currently playing gas sound
            this.gasSoundSource.stop();
            this.bIsGasSoundPlaying = false;
        }
    }

    bIsBurningSoundPlaying = false;

    bIsBurningSoundPlaying2 = false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PlayBurningSound(volume: number) {
        if (!this.isSoundEnabled) {
            return;
        }

        if (!this.bIsBurningSoundPlaying) {
            if (this.audioContext != null) {
                this.burningSoundSource = this.audioContext.createBufferSource();
                if (this.flameLoopAudioBuffer) {
                    this.burningSoundSource.buffer = this.flameLoopAudioBuffer;
                    this.burningSoundSource.connect(this.burningSoundSourceGain!);
                    // Set a random start position
                    const offset = Math.random() * this.flameLoopAudioBuffer.duration;
                    this.burningSoundSource.start(0, offset);
                    this.bIsBurningSoundPlaying = true;
                    // Listen for the end of the sound and reset the flag
                    this.burningSoundSource.onended = () => {
                        this.bIsBurningSoundPlaying = false;
                    };
                }
            }
        }
        if (!this.bIsBurningSoundPlaying2) {
            if (this.audioContext != null) {
                this.burningSoundSource2 = this.audioContext.createBufferSource();
                if (this.burningLoopAudioBuffer) {
                    this.burningSoundSource2.buffer = this.burningLoopAudioBuffer;
                    this.burningSoundSource2.connect(this.burningSoundSourceGain!);
                    // Set a random start position
                    const offset = Math.random() * this.burningLoopAudioBuffer.duration;
                    this.burningSoundSource2.start(0, offset);
                    this.bIsBurningSoundPlaying2 = true;
                    // Listen for the end of the sound and reset the flag
                    this.burningSoundSource2.onended = () => {
                        this.bIsBurningSoundPlaying2 = false;
                    };
                }
            }
        }
        this.burningSoundSourceGain!.gain.value = volume;
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
    }
}
