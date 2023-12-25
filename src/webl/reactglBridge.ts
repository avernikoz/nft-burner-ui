import { AudioEngineSingleton } from "./audioEngine";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";

export class GReactGLBridgeFunctions {
    static OnStartButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, false);
        // GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady, false);
    }

    static OnAboutButtonPressed() {}

    static GetLoadingProgressParameterNormalised() {
        if (GTexturePool.NumPendingTextures > 0 && GTexturePool.NumTexturesInPool > 0) {
            return 1.0 - GTexturePool.NumPendingTextures / GTexturePool.NumTexturesInPool;
        } else {
            return null;
        }
    }

    static OnConnectWalletSuccess() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Inventory);
    }

    static OnToggleSoundInAudioEngine() {
        AudioEngineSingleton.getInstance().toggleSound();
    }

    static GetIsSoundEnabled() {
        return AudioEngineSingleton.getInstance().isSoundEnabled;
    }

    static OnBurningFinished() {}
}
