import ReactGA from "react-ga4";
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
import { NftBurnDialog } from "./components/NftBurnDialog/NftBurnDialog";
import { ShareButton } from "../ShareButton/ShareButton";
import { useNftFloorPrice } from "../../hooks/useNftFloorPrice";
import { useBurnerFee } from "../../hooks/useBurnerFee";
import { getNetworkTokenSymbol } from "../../utils/getNetworkTokenSymbol";
import { NftScheduleDialog } from "./components/NftScheduleDialog/NftScheduleDialog";
import { Tooltip } from "primereact/tooltip";
import { ReactComponent as InfoIcon } from "../../assets/svg/infoIcon.svg";
import { useNetworkFee } from "../../hooks/useNetworkFee";
import { GAudioEngine } from "../../webl/audioEngine";

export const Control = () => {
    const [burnPopupVisible, setBurnPopupVisible] = useState<boolean>(false);
    const [schedulePopupVisible, setSchedulePopupVisible] = useState<boolean>(false);

    const [nft, setNft] = useState<INft | null>(null);
    const { data: floorPrice } = useNftFloorPrice(nft);
    const { feeInNetworkToken: burnerFee } = useBurnerFee({ floorPrice, network: nft?.network });
    // const burnerFee = 0;
    const { networkFee } = useNetworkFee({ network: nft?.network });
    const burnerFeeToken = getNetworkTokenSymbol(nft?.network);
    const networkFeeToken = getNetworkTokenSymbol(nft?.network);

    const NftController = useContext(NftContext);

    useEffect(() => {
        setNft(NftController.activeNft ?? null);
    }, [NftController.activeNft]);

    return (
        <>
            <BurnAndInfoContainer>
                <BurnScheduleContainer>
                    <BurnButton
                        className="burnButton mainButton width35"
                        onClick={() => {
                            ReactGA.event("burn_button_open_popup_button_pressed");
                            GAudioEngine.getInstance().PlayUIClickSound();
                            setBurnPopupVisible(true);
                        }}
                        onMouseEnter={() => {
                            GAudioEngine.getInstance().PlayUIHoverSound();
                        }}
                        disabled={!nft}
                    >
                        BURN
                    </BurnButton>

                    <ShareButton
                        className="shareButton mainButton width65"
                        onClick={() => {
                            ReactGA.event("schedule_button_open_popup_button_pressed");
                            GAudioEngine.getInstance().PlayUIClickSound();
                            setSchedulePopupVisible(true);
                        }}
                        onMouseEnter={() => {
                            GAudioEngine.getInstance().PlayUIHoverSound();
                        }}
                        disabled={!nft}
                    >
                        SCHEDULE BURN EVENT
                    </ShareButton>
                </BurnScheduleContainer>
                <NftInfoContainer>
                    <BurnerFuelInfoContainer>
                        <Tooltip
                            className="tooltip-burner-fee"
                            content="💸 Why the fee? It keeps NFT Burner running smoothly. Your support fuels the fire. Thank you!"
                            target={".burn-fuel-fee"}
                            position="top"
                        />
                        <BurnerFuelInfoText className="burn-fuel-fee">
                            Burner Fuel Fee <InfoIcon />
                        </BurnerFuelInfoText>
                        <BurnerFuelInfoTextNumbers>
                            {burnerFee !== null && burnerFee !== undefined
                                ? burnerFee === 0
                                    ? `Free`
                                    : `${burnerFee} ${burnerFeeToken}`
                                : `-`}
                        </BurnerFuelInfoTextNumbers>
                    </BurnerFuelInfoContainer>
                    <NftInfoDivider />
                    <NetworkFeeInfoContainer>
                        <NetworkFeeInfoText>Network Fee</NetworkFeeInfoText>
                        <NetworkFeeInfoTextNumbers>
                            {networkFee !== null && networkFee !== undefined ? `${networkFee} ${networkFeeToken}` : `-`}
                        </NetworkFeeInfoTextNumbers>
                    </NetworkFeeInfoContainer>
                </NftInfoContainer>
            </BurnAndInfoContainer>
            {nft && (
                <NftBurnDialog
                    nft={nft}
                    visible={burnPopupVisible}
                    setVisible={() => {
                        setBurnPopupVisible(false);
                    }}
                />
            )}
            {nft && (
                <NftScheduleDialog
                    nft={nft}
                    visible={schedulePopupVisible}
                    setVisible={() => {
                        setSchedulePopupVisible(false);
                    }}
                />
            )}
        </>
    );
};
