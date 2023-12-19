import { useEffect } from "react";
import { INft } from "../../../../utils/types";
import {
    DialogImageContainer,
    NftBurnDialogContainer,
    NftBurnDialogImg,
    NftBurnDialogImgTitle,
    StyledDialog,
} from "../NftBurnDialog/NftBurnDialog.styled";

import { ReactComponent as TwichIcon } from "../../../../assets/svg/twitch.svg";
import { ReactComponent as YoutTubeIcon } from "../../../../assets/svg/youtube.svg";
import { ReactComponent as TwitterIcon } from "../../../../assets/svg/twitter.svg";
import { SocialIconContainer, SocialMainText, SocialTitleText } from "./NftScheduleDialog.styled";

export const NftScheduleDialog = ({
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

    return (
        <StyledDialog
            header="Schedule burn event"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
            draggable={false}
            resizable={false}
        >
            <NftBurnDialogContainer>
                <DialogImageContainer>
                    <NftBurnDialogImg crossOrigin="anonymous" src={nft.logoURI} alt={nft.name} />

                    <NftBurnDialogImgTitle>
                        {nft.name.length > 12 ? nft.name.substring(0, 12) + "..." : nft.name}
                    </NftBurnDialogImgTitle>
                </DialogImageContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                        <SocialTitleText>Share in</SocialTitleText>
                        <SocialMainText>Schedule a burn event and share it on social media:</SocialMainText>
                    </div>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <SocialIconContainer target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv">
                            <TwichIcon />
                        </SocialIconContainer>
                        <SocialIconContainer target="_blank" rel="noopener noreferrer" href="https://youtube.com">
                            <YoutTubeIcon />
                        </SocialIconContainer>
                        <SocialIconContainer target="_blank" rel="noopener noreferrer" href="https://twitter.com">
                            <TwitterIcon />
                        </SocialIconContainer>
                    </div>
                </div>
            </NftBurnDialogContainer>
        </StyledDialog>
    );
};
