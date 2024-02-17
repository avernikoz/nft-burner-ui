import ReactGA from "react-ga4";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import React, { useContext, useEffect, useState } from "react";
import { useAccount as useWagmiAccount } from "wagmi";

import { Control } from "../../components/Control/Control";
import { NftList } from "../../components/NftList/NftList";
import { NftContext } from "../../components/NftProvider/NftProvider";
import { WalletSelector } from "../../components/WalletSelector/WalletSelector";
import { ENftBurnStatus } from "../../utils/types";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import "./App.css";
import {
    BodyContainer,
    DesktopLogoIcon,
    HeaderAppContainer,
    LogoContainer,
    LogoDivider,
    MobileLogoIcon,
} from "./app.styled";
import { Footer } from "../../components/Footer/Footer";
import { BurningComplete } from "../../components/BurningComplete/BurningComplete";
import { useEthersSigner } from "../../components/NftList/variables";
import { ConnectWalletButton } from "../../components/ConnectWalletButton/ConnectWalletButton";
import BurnerLogoDesktopIcon from "../../assets/svg/burnerLogoDesktop.svg";
import BurnerLogoMobileIcon from "../../assets/svg/burnerLogoMobile.svg";
import { GAudioEngine } from "../../webl/audioEngine";
import { Level } from "../../components/Level/Level";
import { useUserLevel } from "../../context/UserLevelContext";
import { BetaContainer, BetaText } from "../../components/Header/Header";

export const InternalApp: React.FC<{ setAboutPageActive: (isAboutPageActive: boolean) => void }> = ({
    setAboutPageActive,
}: {
    setAboutPageActive: (isAboutPageActive: boolean) => void;
}) => {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const signer = useEthersSigner();

    const [showUI, setShowUI] = useState<boolean>(false);
    const [showBurnedScreen, setShowBurnedScreen] = useState<boolean>(false);
    const [showConnectWalletScreen, setShowConnectWalletScreen] = useState<boolean>(false);
    const [walletSelectPopupVisible, setWalletSelectPopupVisible] = useState<boolean>(false);
    const { level, points } = useUserLevel();

    const NftController = useContext(NftContext);

    // for connect wallet show ui
    useEffect(() => {
        const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
        const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
        const suiChangeOrConnected = suietWallet.connected && suietWallet.address;

        if (wagmiChangeOrConnected || solanaChangeOrConnected || suiChangeOrConnected) {
            setShowUI(true);
            setShowConnectWalletScreen(false);
        } else {
            setShowConnectWalletScreen(true);
            setShowUI(false);
        }
    }, [
        solanaWallet.connected,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.address,
        wagmiAccount.isConnected,
        solanaWallet.publicKey,
        solanaWallet.disconnecting,
        NftController,
        signer,
    ]);

    // for burn more
    useEffect(() => {
        const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
        const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
        const suiChangeOrConnected = suietWallet.connected && suietWallet.address;

        if (wagmiChangeOrConnected || solanaChangeOrConnected || suiChangeOrConnected) {
            if (NftController.nftStatus === ENftBurnStatus.EMPTY) {
                setShowUI(true);
                setShowBurnedScreen(false);
            }
        }
    }, [
        NftController.nftStatus,
        signer,
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.address,
        wagmiAccount.isConnected,
    ]);

    useEffect(() => {
        if (NftController.nftStatus === ENftBurnStatus.BURNED_ONCHAIN) {
            GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady);
            setShowUI(false);
        }
    }, [NftController.nftStatus]);

    useEffect(() => {
        if (NftController.nftStatus === ENftBurnStatus.BURNED_IN_SIMULATION) {
            setShowBurnedScreen(true);
        }
    }, [NftController.nftStatus]);

    useEffect(() => {
        const handleWebGLEvent = (event: Event) => {
            const { nftBurned } = (
                event as CustomEvent<{
                    nftBurned: boolean;
                }>
            ).detail;

            if (nftBurned) {
                NftController.setNftStatus(ENftBurnStatus.BURNED_IN_SIMULATION);
            }
        };

        document.addEventListener("webglEvent", handleWebGLEvent);

        return () => {
            document.removeEventListener("webglEvent", handleWebGLEvent);
        };
    }, [NftController, NftController.setNftStatus]);

    return (
        <div className="App">
            <HeaderAppContainer>
                <LogoContainer>
                    <DesktopLogoIcon src={BurnerLogoDesktopIcon} />
                    <MobileLogoIcon src={BurnerLogoMobileIcon} />
                </LogoContainer>
                <BetaContainer>
                    <BetaText> beta</BetaText>
                </BetaContainer>
                <LogoDivider />
                <WalletSelector
                    walletSelectPopupVisible={walletSelectPopupVisible}
                    setWalletSelectPopupVisible={setWalletSelectPopupVisible}
                    hideUI={() => {
                        setShowUI(false);
                    }}
                />
                <Level level={level} points={points} />
            </HeaderAppContainer>
            {showUI && !showBurnedScreen && !showConnectWalletScreen && (
                <BodyContainer $showBackground={true}>
                    <div className="half">
                        <NftList />
                        <Control />
                    </div>
                </BodyContainer>
            )}
            {showConnectWalletScreen && (
                <BodyContainer>
                    <div className="half" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <ConnectWalletButton
                            onClick={() => {
                                GAudioEngine.getInstance().PlayUIClickSound();
                                ReactGA.event("connect_wallet_open_popup_button_pressed");
                                setWalletSelectPopupVisible(true);
                            }}
                            onMouseEnter={() => {
                                GAudioEngine.getInstance().PlayUIHoverSound();
                            }}
                        >
                            Connect wallet
                        </ConnectWalletButton>
                    </div>
                </BodyContainer>
            )}
            {showBurnedScreen && !showConnectWalletScreen && <BurningComplete />}

            <Footer setAboutPageActive={setAboutPageActive} />
        </div>
    );
};
