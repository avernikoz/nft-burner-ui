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

export class SoundSample {
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
                if (this.bIsPlaying && this.SourceNode) {
                    this.SourceNode.stop();
                }
                this.InitSourceNode(context);
                this.SourceNode!.start();
                this.bIsPlaying = true;
                this.SourceNode!.onended = () => {
                    this.bIsPlaying = false;
                };
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

    private SoundIntro: AudioBuffer | null = null;

    private SoundStamp: SoundSample = new SoundSample();

    private SoundUIHover: SoundSample = new SoundSample();

    private SoundFireExting: SoundSample = new SoundSample();

    private SoundTransition: SoundSample = new SoundSample();

    private SoundUIClick: SoundSample = new SoundSample();

    private SoundUISelect: SoundSample = new SoundSample();

    private SoundUIClickStart: SoundSample = new SoundSample();

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

    public static GetContext(): AudioContext {
        return GAudioEngine.getInstance().Context!;
    }

    public static GetMasterGain(): GainNode {
        return GAudioEngine.getInstance().MasterGain!;
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
            this.SoundUIHover.Init(this.Context, "assets/audio/bassShotFade.mp3", this.MasterGain, 0.75);
            this.SoundUIClick.Init(this.Context, "assets/audio/mhFesel.mp3", this.MasterGain, 0.5);
            this.SoundUISelect.Init(this.Context, "assets/audio/selectSound.mp3", this.MasterGain, 0.25);
            this.SoundUIClickStart.Init(this.Context, "assets/audio/mhIntro3.mp3", this.MasterGain, 0.25);

            this.SoundTransition.Init(this.Context, "assets/audio/fadeFast.mp3", this.MasterGain, 0.1);

            this.SoundFireExting.Init(this.Context, "assets/audio/afterBurnExting.mp3", this.MasterGain, 0.5);

            this.SoundStamp.Init(this.Context, "assets/audio/magStamp.mp3", this.MasterGain, 2.0);

            this.SoundIntro = await LoadAudioBufferAsync(this.Context, "assets/audio/introLow4.mp3");

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

    PlayUIHoverSound() {
        if (!!localStorage.getItem("isBurnedNFTAtLeastOnce")) {
            this.SoundUIHover.Play(this.Context!);
        }
    }

    PlayUIClickSound() {
        if (!!localStorage.getItem("isBurnedNFTAtLeastOnce")) {
            this.SoundUIClick.Play(this.Context!);
        }
    }

    PlayUISelectSound() {
        //if (!!localStorage.getItem("isBurnedNFTAtLeastOnce"))
        {
            //this.SoundUISelect.Play(this.Context!);
        }
    }

    PlayUIClickStartSound() {
        if (!!localStorage.getItem("isBurnedNFTAtLeastOnce")) {
            this.SoundUIClickStart.Play(this.Context!);
        }
    }

    PlayFireExtingSound() {
        //if (!!localStorage.getItem("isBurnedNFTAtLeastOnce"))
        {
            this.SoundFireExting.Play(this.Context!);
        }
    }

    PlayTransitionSound() {
        //if (!!localStorage.getItem("isBurnedNFTAtLeastOnce"))
        {
            this.SoundTransition.Play(this.Context!);
        }
    }

    PlayIntroSound() {
        this.PlaySoundBuffer(this.SoundIntro);
    }

    PlayStampSound() {
        this.SoundStamp.Play(this.Context!);
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
