import { useState } from "react";
import { GReactGLBridgeFunctions } from "../../../webl/reactglBridge";
import { ReactComponent as SoundEnabledIcon } from "../../../assets/svg/soundEnabled.svg";
import { ReactComponent as SoundDisabledIcon } from "../../../assets/svg/soundDisabled.svg";
import { IconContainer } from "../Footer";

export const SoundIconElement = () => {
    const [isSoundEnabled, setSoundEnabled] = useState(GReactGLBridgeFunctions.GetIsSoundEnabled());

    return (
        <IconContainer
            onClick={() => {
                GReactGLBridgeFunctions.OnToggleSoundInAudioEngine();
                setSoundEnabled(!isSoundEnabled);
            }}
        >
            {isSoundEnabled && <SoundEnabledIcon />}
            {!isSoundEnabled && <SoundDisabledIcon />}
        </IconContainer>
    );
};
