import { GAudioEngine } from "./audioEngine";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";

export class GReactGLBridgeFunctions {
    static OnStartButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, false);
        // GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady, false);
    }

    static OnAboutButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Preloading, false);
    }

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
        GAudioEngine.getInstance().toggleSound();
    }

    static GetIsSoundEnabled() {
        return GAudioEngine.getInstance().isSoundEnabled;
    }

    static OnBurningFinished() {
        document.dispatchEvent(new CustomEvent("webglEvent", { detail: { nftBurned: true } }));
    }

    static OnBurnMore() {
        GRenderingStateMachine.OnBurnMoreButtonPress();
    }
}
