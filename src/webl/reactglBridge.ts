import { isHeightAndWidthProps } from "react-virtualized-auto-sizer";
import { GAudioEngine } from "./audioEngine";
import { GBurningSurfaceExport } from "./firePlane";
import { GTool } from "./renderingMain";
import { ERenderingState, GRenderingStateMachine } from "./states";
import { GTexturePool } from "./texturePool";
import { EBurningTool, LaserTool } from "./tools";

export class GReactGLBridgeFunctions {
    static OnStartButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, false);
        //GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady, false);
    }

    static OnAboutButtonPressed() {
        GRenderingStateMachine.SetRenderingState(ERenderingState.Preloading, false);
    }

    static GetLoadingProgressParameterNormalised() {
        if (GTexturePool.NumPendingHighPriorityTextures > 0 && GTexturePool.NumTexturesInPool > 0) {
            return 1.0 - GTexturePool.NumPendingHighPriorityTextures / GTexturePool.NumTexturesInPool;
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

    static GetSharePopupBurnImg(): string {
        return GBurningSurfaceExport.GetExportUrl();
    }

    static OnInstrumentClick(instrument: "laser" | "thunder" | "lighter"): void {
        switch (instrument) {
            case "laser":
                GTool.ENewAssignedToolType = EBurningTool.Laser;
                break;
            case "lighter":
                GTool.ENewAssignedToolType = EBurningTool.Lighter;
                break;
            case "thunder":
                GTool.ENewAssignedToolType = EBurningTool.Thunder;
                break;

            default:
                break;
        }

        GTool.bNewToolAssignedThisFrame = true;
    }
}
