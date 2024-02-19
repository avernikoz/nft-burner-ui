import { useEffect, useMemo } from "react";
import { INft } from "../../../../utils/types";
import {
    DialogImageContainer,
    NftBurnDialogContainer,
    NftBurnDialogImg,
    StyledDialog,
} from "../NftBurnDialog/NftBurnDialog.styled";

// import { ReactComponent as TwichIcon } from "../../../../assets/svg/twitch.svg";
// import { ReactComponent as YoutTubeIcon } from "../../../../assets/svg/youtube.svg";
import { ReactComponent as TwitterIcon } from "../../../../assets/svg/twitter.svg";
import { SocialIconContainer, SocialMainText, SocialTitleText } from "../NftScheduleDialog/NftScheduleDialog.styled";
// import { ConfirmBurningButton } from "../../../ConfirmBurningButton/ConfirmBurningButton";
import { generateTwitterIntentShare } from "../../../../utils/generateTwitterIntentShareText";
import { GReactGLBridgeFunctions } from "../../../../webl/reactglBridge";

export const NftShareDialog = ({
    nft,
    visible,
    setVisible,
}: {
    nft: INft;
    visible: boolean;
    setVisible: () => void;
}) => {
    // Blur on opened popup
    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        } else {
            document.body.classList.remove("blur-background");
        }

        return () => {
            document.body.classList.remove("blur-background");
        };
    }, [visible]);

    const burnedImage = useMemo(() => {
        return GReactGLBridgeFunctions.GetSharePopupBurnImg();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nft.id, nft.name, nft.network]);

    return (
        <StyledDialog
            header="Share on social media"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
            draggable={false}
            resizable={false}
        >
            <NftBurnDialogContainer>
                <DialogImageContainer>
                    <NftBurnDialogImg crossOrigin="anonymous" src={burnedImage} alt={nft.name} />
                </DialogImageContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <SocialTitleText>Share in</SocialTitleText>
                        <SocialMainText>Share your burnt nft it on social media:</SocialMainText>
                    </div>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <SocialIconContainer
                            target="_blank"
                            rel="noopener noreferrer"
                            href={generateTwitterIntentShare()}
                        >
                            <TwitterIcon />
                        </SocialIconContainer>
                        {/* <SocialIconContainer target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv">
                            <TwichIcon />
                        </SocialIconContainer>
                        <SocialIconContainer target="_blank" rel="noopener noreferrer" href="https://youtube.com">
                            <YoutTubeIcon />
                        </SocialIconContainer> */}
                    </div>
                    {/* <div>
                        <ConfirmBurningButton style={{ width: "100%" }}>Save</ConfirmBurningButton>
                    </div> */}
                </div>
            </NftBurnDialogContainer>
        </StyledDialog>
    );
};
