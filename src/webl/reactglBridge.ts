import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";

export class GReactGLBridgeFunctions {
    static OnStartButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, false);
    }

    static OnAboutButtonPressed() {}

    static GetLoadingProgressParameterNormalised() {
        if (GTexturePool.NumPendingTextures > 0) {
            return 1.0 - GTexturePool.NumPendingTextures / GTexturePool.NumTexturesInPool;
        } else {
            return null;
        }
    }

    static OnConnectWalletSuccess() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Inventory);
    }
}
