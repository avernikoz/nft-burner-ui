import { GTime } from "./utils";

export enum ERenderingState {
    Preloading = 0,
    Intro,
    Inventory,
    BurningReady,
    BurningNow,
    BurningFinished,
    //===
    NUM,
}

export class GRenderingStateMachine {
    public static SetRenderingState(newState: ERenderingState, bImmeadiateTransition = false) {
        this.GetInstance().SetRenderingStateInner(newState, bImmeadiateTransition);
    }

    public static GetInstance(): GRenderingStateMachine {
        if (!GRenderingStateMachine.instance) {
            GRenderingStateMachine.instance = new GRenderingStateMachine();
        }
        return GRenderingStateMachine.instance;
    }

    public AdvanceTransitionParameter() {
        if (this.transitionParameter <= 1.0) {
            //We are in transition mode from old to new
            this.TransitionParameter += GTime.Delta * this.TransitionSpeed;
        }
    }

    MarkNewStateProcessed() {
        this.bNewStateWasProcessed = true;
    }

    public bWasNewStateProcessed(): boolean {
        return this.bNewStateWasProcessed;
    }

    public get currentState(): ERenderingState {
        return this.StateCurrent;
    }

    public get previousState(): ERenderingState {
        return this.StatePrevious;
    }

    public get transitionParameter(): number {
        return this.TransitionParameter;
    }

    public get transitionSpeed(): number {
        return this.TransitionSpeed;
    }

    public get bCanBurn(): boolean {
        return (
            this.currentState == ERenderingState.BurningReady ||
            this.currentState == ERenderingState.BurningNow ||
            this.currentState == ERenderingState.BurningFinished ||
            this.currentState == ERenderingState.Intro
        );
    }

    public get bCurStateHasSceneDesc(): boolean {
        return (
            this.currentState == ERenderingState.Preloading ||
            this.currentState == ERenderingState.Intro ||
            this.currentState == ERenderingState.Inventory ||
            this.currentState == ERenderingState.BurningReady
        );
    }

    ///==================================================================
    private static instance: GRenderingStateMachine;

    private constructor() {
        this.StateCurrent = ERenderingState.Preloading;
        this.StatePrevious = ERenderingState.Preloading;
        this.TransitionParameter = 0.0;
        this.TransitionSpeed = 1.0;
    }

    private SetRenderingStateInner(newState: ERenderingState, bImmeadiateTransition: boolean) {
        if (this.StateCurrent !== newState) {
            this.StatePrevious = this.StateCurrent;
            this.StateCurrent = newState;

            this.TransitionParameter = bImmeadiateTransition ? 1.0 : 0.0;

            this.bNewStateWasProcessed = false;
        }
    }

    private StateCurrent: ERenderingState;

    private StatePrevious: ERenderingState;

    private TransitionParameter: number; //[0,1]

    private TransitionSpeed: number; //[0,1]

    public bNewStateWasProcessed = false; //when state change event should be processed  once
}
