import { useContext, useEffect, useState } from "react";
import { INft } from "../../utils/types";
import { BurnButton } from "../BurnButton/BurnButton";
import "../BurnButton/BurnButton.css";
import { NftContext } from "../NftProvider/NftProvider";
import {
    BurnAndInfoContainer,
    BurnScheduleContainer,
    BurnerFuelInfoContainer,
    BurnerFuelInfoText,
    BurnerFuelInfoTextNumbers,
    NetworkFeeInfoContainer,
    NetworkFeeInfoText,
    NetworkFeeInfoTextNumbers,
    NftInfoContainer,
    NftInfoDivider,
} from "./Control.styled";
import { NftDialog } from "./components/NftDialog/NftDialog";
import { ShareButton } from "../ShareButton/ShareButton";

export const Control = () => {
    const [visible, setVisible] = useState<boolean>(false);
    const [nft, setNft] = useState<INft | null>(null);

    const NftController = useContext(NftContext);

    useEffect(() => {
        setNft(NftController.activeNft ?? null);
    }, [NftController.activeNft]);

    return (
        <>
            <BurnAndInfoContainer>
                <BurnScheduleContainer>
                    <BurnButton className="burnButton mainButton" onClick={() => setVisible(true)} disabled={!nft}>
                        BURN
                    </BurnButton>

                    <ShareButton className="shareButton mainButton width65" disabled={!nft}>
                        SCHEDULE BURN EVENT
                    </ShareButton>
                </BurnScheduleContainer>
                <NftInfoContainer>
                    <BurnerFuelInfoContainer>
                        <BurnerFuelInfoText>Burner Fuel</BurnerFuelInfoText>
                        <BurnerFuelInfoTextNumbers>~ 2.97$</BurnerFuelInfoTextNumbers>
                    </BurnerFuelInfoContainer>
                    <NftInfoDivider />
                    <NetworkFeeInfoContainer>
                        <NetworkFeeInfoText>Network Fee</NetworkFeeInfoText>
                        <NetworkFeeInfoTextNumbers>2.8mtc</NetworkFeeInfoTextNumbers>
                    </NetworkFeeInfoContainer>
                </NftInfoContainer>
            </BurnAndInfoContainer>
            {nft && (
                <NftDialog
                    nft={nft}
                    visible={visible}
                    setVisible={() => {
                        setVisible(false);
                    }}
                />
            )}
        </>
    );
};
