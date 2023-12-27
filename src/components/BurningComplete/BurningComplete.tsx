import React, { useContext, useState } from "react";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";
import { BurnButton } from "../BurnButton/BurnButton";
import { NftContext } from "../NftProvider/NftProvider";
import { ShareButton } from "../ShareButton/ShareButton";
import { BurningCompleteContainer } from "./BurningComplete.styled";
import { ENftBurnStatus } from "../../utils/types";
import { NftShareDialog } from "../Control/components/NftShareDialog/NftShareDialog";

export const BurningComplete = () => {
    const NftController = useContext(NftContext);
    const [sharePopupVisible, setSharePopupVisible] = useState<boolean>(false);
    const nft = NftController.getActiveNft();

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

            <BurningCompleteContainer>
                <BurnButton
                    className="burnButton mainButton mainButtonLarge completeButton"
                    onClick={() => {
                        NftController.setNftStatus(ENftBurnStatus.EMPTY);
                        GReactGLBridgeFunctions.OnBurnMore();
                    }}
                >
                    BURN MORE
                </BurnButton>

                <ShareButton
                    className="shareButton mainButton mainButtonLarge completeButton"
                    onClick={() => setSharePopupVisible(true)}
                >
                    SHARE
                </ShareButton>
            </BurningCompleteContainer>
        </>
    );
};
