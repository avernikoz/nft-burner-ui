import ReactGA from "react-ga4";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useCurrentAccount, useCurrentWallet as suietUseWallet } from "@mysten/dapp-kit";
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
import { MainLevelContainer } from "../../components/Level/Level.styled";
import { BetaContainer, BetaText } from "../../components/Header/Header";

import { EAppPages } from "./AppModel";
import { SoundIconElement } from "../../components/Footer/components/SoundIconElement";

export const InternalApp: React.FC<{ setAboutPageActive: (isAboutPageActive: EAppPages) => void }> = ({
    setAboutPageActive,
}: {
    setAboutPageActive: (isAboutPageActive: EAppPages) => void;
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
    const currentAccount = useCurrentAccount();

    const NftController = useContext(NftContext);

    // for connect wallet show ui
    useEffect(() => {
        const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
        const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
        const suiChangeOrConnected = suietWallet.isConnected && currentAccount?.address;

        if (wagmiChangeOrConnected || solanaChangeOrConnected || suiChangeOrConnected) {
            setShowUI(true);
            setShowConnectWalletScreen(false);
        } else {
            setShowConnectWalletScreen(true);
            setShowUI(false);
        }
    }, [
        solanaWallet.connected,
        wagmiAccount.address,
        wagmiAccount.isConnected,
        solanaWallet.publicKey,
        solanaWallet.disconnecting,
        NftController,
        signer,
        suietWallet.isConnected,
        currentAccount?.address,
    ]);

    // for burn more
    useEffect(() => {
        const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
        const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
        const suiChangeOrConnected = suietWallet.isConnected && currentAccount?.address;

        if (wagmiChangeOrConnected || solanaChangeOrConnected || suiChangeOrConnected) {
            if (NftController.nftStatus === ENftBurnStatus.EMPTY) {
                setShowUI(true);
                setShowBurnedScreen(false);
            }
        }
    }, [
        NftController.nftStatus,
        currentAccount?.address,
        signer,
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.isConnected,
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

    const isBurningNFTComplete = showBurnedScreen && !showConnectWalletScreen;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(isBurningNFTComplete);

        // Hide the container after 5 seconds
        if (isBurningNFTComplete) {
            const timeoutId = setTimeout(() => {
                setIsVisible(false);
            }, 5000);

            return () => clearTimeout(timeoutId);
        }
    }, [isBurningNFTComplete]);

    const shouldShow = showUI && !showBurnedScreen;
    const showingStyle = shouldShow ? {} : { display: "none" };

    return (
        <div className="App">
            <>
                <BodyContainer $showBackground={true} style={showingStyle}>
                    <div className="half">
                        <NftList />
                        <Control />
                    </div>
                </BodyContainer>
                <HeaderAppContainer style={showingStyle}>
                    <LogoContainer>
                        <DesktopLogoIcon src={BurnerLogoDesktopIcon} />
                        <MobileLogoIcon src={BurnerLogoMobileIcon} />
                    </LogoContainer>
                    <BetaContainer>
                        <BetaText> beta</BetaText>
                    </BetaContainer>
                    <LogoDivider />
                    <div className="soundIcon">
                        <SoundIconElement />
                    </div>
                    <WalletSelector
                        walletSelectPopupVisible={walletSelectPopupVisible}
                        setWalletSelectPopupVisible={setWalletSelectPopupVisible}
                        hideUI={() => {
                            setShowUI(false);
                        }}
                    />

                    <MainLevelContainer $isVisible={isVisible}>
                        <Level showTooltip={false} level={level} points={points} showLevelText={true} levelSize={200} />
                    </MainLevelContainer>
                </HeaderAppContainer>
            </>
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
            {isBurningNFTComplete && <BurningComplete />}

            <Footer setAboutPageActive={setAboutPageActive} />
        </div>
    );
};
