import React, { useContext, useEffect, useState } from "react";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";
import { BurnButton } from "../BurnButton/BurnButton";
import { NftContext } from "../NftProvider/NftProvider";
import { ShareButton } from "../ShareButton/ShareButton";
import { BurningCompleteContainer, BurningCompleteText } from "./BurningComplete.styled";
import { ENftBurnStatus } from "../../utils/types";
import { NftShareDialog } from "../Control/components/NftShareDialog/NftShareDialog";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { GTransitionAnimationsConstants } from "../../webl/transitionAnimations";
import { sleep } from "../../utils/sleep";
import { GAudioEngine } from "../../webl/audioEngine";
import { POINTS_PER_BURN, setPoints } from "../../utils/gamification/level";

// import useSound from "use-sound";

// import fanfareSfx from "../../sounds/fanfare.mp3";

// const FanfareButton = () => {
//     const [play, { stop }] = useSound(fanfareSfx);

//     return (
//         <button onMouseEnter={() => play()} onMouseLeave={() => stop()}>
//             <span role="img" aria-label="trumpet">
//                 🎺
//             </span>
//         </button>
//     );
// };

export const BurningComplete = () => {
    const NftController = useContext(NftContext);
    const [sharePopupVisible, setSharePopupVisible] = useState<boolean>(false);
    const [showText, setShowText] = useState<boolean>(false);
    const nft = NftController.getActiveNft();

    useEffect(() => {
        localStorage.setItem("isBurnedNFTAtLeastOnce", "true");
        setPoints(POINTS_PER_BURN);

        const transitionFunc = async () => {
            setShowText(true);
            await sleep(4_000);
            setShowText(false);
        };

        transitionFunc();
    }, []);

    return (
        <>
            {nft && (
                <NftShareDialog
                    nft={nft}
                    visible={sharePopupVisible}
                    setVisible={() => {
                        setSharePopupVisible(false);
                    }}
                />
            )}
            <BurningCompleteText $show={showText}>HISTORY SEALED</BurningCompleteText>
            <BurningCompleteContainer>
                <BurnButton
                    className="burnButton mainButton mainButtonLarge completeButton"
                    onClick={() => {
                        GAudioEngine.getInstance().PlayUIClickSound();
                        const stateUpdateDelay = GTransitionAnimationsConstants.BurnMoreTransitionDuration * 1000;
                        setTimeout(() => {
                            NftController.setNftStatus(ENftBurnStatus.EMPTY);
                            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(null);
                            IMAGE_STORE_SINGLETON_INSTANCE.setImage(null);
                        }, stateUpdateDelay);
                        GReactGLBridgeFunctions.OnBurnMore();
                    }}
                    onMouseEnter={() => {
                        GAudioEngine.getInstance().PlayUIHoverSound();
                    }}
                >
                    BURN MORE
                </BurnButton>

                <ShareButton
                    className="shareButton mainButton mainButtonLarge completeButton"
                    onClick={() => {
                        setSharePopupVisible(true);
                        GAudioEngine.getInstance().PlayUIClickSound();
                    }}
                    onMouseEnter={() => {
                        GAudioEngine.getInstance().PlayUIHoverSound();
                    }}
                >
                    SHARE
                </ShareButton>
            </BurningCompleteContainer>
        </>
    );
};
