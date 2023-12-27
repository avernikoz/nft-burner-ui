async function LoadAudioBufferAsync(context: AudioContext, url: string): Promise<AudioBuffer> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch audio file: ${response.status} - ${response.statusText}`);
        }

        const audioData = await response.arrayBuffer();
        return await context.decodeAudioData(audioData);
    } catch (error) {
        console.error(`Error loading audio file from ${url}:`, error);
        throw error;
    }
}

class SoundSample {
    Buffer: AudioBuffer | null = null;

    SourceNode: AudioBufferSourceNode | null = null;

    Gain: GainNode | null = null;

    bIsPlaying = false;

    async Init(context: AudioContext, url: string, masterGain: GainNode, initialGain = 1.0) {
        this.Buffer = await LoadAudioBufferAsync(context, url);

        this.Gain = context.createGain();
        this.SourceNode = context.createBufferSource();

        this.SourceNode.buffer = this.Buffer;
        this.SourceNode.connect(this.Gain);
        this.Gain.connect(masterGain);
        this.Gain.gain.value = initialGain;
    }

    InitSourceNode(context: AudioContext) {
        this.SourceNode = context.createBufferSource();
        this.SourceNode.buffer = this.Buffer;
        this.SourceNode.connect(this.Gain!);
    }

    Play(context: AudioContext, bLooping = false) {
        if (this.Buffer) {
            if (bLooping) {
                if (!this.bIsPlaying) {
                    this.InitSourceNode(context);
                    const offset = Math.random() * this.Buffer.duration;
                    this.SourceNode!.start(0, offset);
                    this.bIsPlaying = true;
                    this.SourceNode!.onended = () => {
                        this.bIsPlaying = false;
                    };
                }
            } else {
                this.InitSourceNode(context);
                this.SourceNode!.start();
            }
        }
    }

    Stop() {
        if (this.SourceNode && this.bIsPlaying) {
            this.SourceNode.stop();
            this.bIsPlaying = false;
        }
    }
}

export class GAudioEngine {
    private static instance: GAudioEngine;

    public isSoundEnabled: boolean = true;

    public Context: AudioContext | null = null;

    public MasterGain: GainNode | null = null;

    //Sounds

    private SoundClick: AudioBuffer | null = null;

    private SoundIntro: AudioBuffer | null = null;

    private SoundStamp: AudioBuffer | null = null;

    private SoundLighterStart: SoundSample = new SoundSample();

    private SoundLoopLighterGas: SoundSample = new SoundSample();

    private SoundFireBurst: AudioBuffer | null = null;

    private SoundLoopFlame: SoundSample = new SoundSample();

    private SoundLoopBurning: SoundSample = new SoundSample();

    GainBurningSound: GainNode | null = null;

    //Sources

    private SourceCurrent: AudioBufferSourceNode | null = null;

    //Gains

    public static getInstance(): GAudioEngine {
        if (!GAudioEngine.instance) {
            GAudioEngine.instance = new GAudioEngine();
        }
        return GAudioEngine.instance;
    }

    private constructor() {
        if (window.AudioContext) {
            this.Context = new AudioContext();
            this.MasterGain = this.Context.createGain();
            this.MasterGain.connect(this.Context.destination);
        } else {
            //console.error("Web Audio API is not supported in this browser");
        }
    }

    async LoadSoundsAsync() {
        if (this.Context && this.MasterGain) {
            this.SoundClick = await LoadAudioBufferAsync(this.Context, "assets/audio/bassShot.mp3");
            this.SoundIntro = await LoadAudioBufferAsync(this.Context, "assets/audio/intro.mp3");
            this.SoundStamp = await LoadAudioBufferAsync(this.Context, "assets/audio/stamp.mp3");
            this.SoundFireBurst = await LoadAudioBufferAsync(this.Context, "assets/audio/fireBurst2.mp3");

            this.SoundLighterStart.Init(this.Context, "assets/audio/lighterStart.mp3", this.MasterGain);

            this.SoundLoopLighterGas.Init(this.Context, "assets/audio/lighterGasLoop.mp3", this.MasterGain, 0.5);

            this.GainBurningSound = this.Context.createGain();
            this.GainBurningSound.connect(this.MasterGain);
            this.SoundLoopFlame.Init(this.Context, "assets/audio/flameLoop2.mp3", this.GainBurningSound);
            this.SoundLoopBurning.Init(this.Context, "assets/audio/burningLoop2.mp3", this.GainBurningSound, 0.75);
        }
    }

    PlaySoundBuffer(inSoundBuffer: AudioBuffer | null) {
        if (!this.isSoundEnabled) {
            return;
        }

        if (this.Context != null) {
            this.SourceCurrent = this.Context.createBufferSource();
            if (inSoundBuffer) {
                this.SourceCurrent.buffer = inSoundBuffer;
                this.SourceCurrent.connect(this.Context.destination);
                this.SourceCurrent.start();
            }
        }
    }

    PlayClickSound() {
        if (!this.isSoundEnabled) {
            return;
        }

        if (this.Context != null) {
            this.SourceCurrent = this.Context.createBufferSource();
            if (this.SoundClick) {
                this.SourceCurrent.buffer = this.SoundClick;
                this.SourceCurrent.connect(this.Context.destination);
                this.SourceCurrent.start();
            }

            /* const oscillator = this.audioContext.createOscillator();
            oscillator.frequency.value = 140;
            oscillator.connect(this.audioContext.destination);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1); */
        }
    }

    PlayIntroSound() {
        this.PlaySoundBuffer(this.SoundIntro);
    }

    PlayStampSound() {
        this.PlaySoundBuffer(this.SoundStamp);
    }

    PlayLighterStartSound() {
        this.SoundLighterStart.Play(this.Context!);
    }

    PlayLighterGasSound() {
        this.SoundLoopLighterGas.Play(this.Context!, true);
    }

    ForceStopLighterGasSound() {
        if (this.SoundLoopLighterGas.SourceNode) {
            this.SoundLoopLighterGas.Stop();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PlayBurningSound(volume: number) {
        if (this.GainBurningSound) {
            this.GainBurningSound!.gain.value = volume;

            this.SoundLoopBurning.Play(this.Context!, true);
            this.SoundLoopFlame.Play(this.Context!, true);
        }
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        if (this.isSoundEnabled) {
            this.MasterGain!.gain.value = 1.0;
        } else {
            this.MasterGain!.gain.value = 0.0;
        }
    }
}
