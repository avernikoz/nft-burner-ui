import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import React, { useContext, useEffect, useState } from "react";
import { useAccount as useWagmiAccount } from "wagmi";

import { Control } from "../../components/Control/Control";
import { NftList } from "../../components/NftList/NftList";
import { NftContext } from "../../components/NftProvider/NftProvider";
import Wallets from "../../components/wallets/Wallets";
import { ENftBurnStatus } from "../../utils/types";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import "./App.css";
import { BodyContainer } from "./app.styled";
import { Footer } from "../../components/Footer/Footer";
import { BurningComplete } from "../../components/BurningComplete/BurningComplete";
import { useEthersSigner } from "../../components/NftList/variables";
import { ConnectWalletButton } from "../../components/ConnectWalletButton/ConnectWalletButton";

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
            <div className="WalletConnectionHeader">
                <Wallets
                    hideUI={() => {
                        setShowUI(false);
                    }}
                />
            </div>
            {showUI && !showBurnedScreen && !showConnectWalletScreen && (
                <BodyContainer>
                    <div className="half">
                        <NftList />
                        <Control />
                    </div>
                </BodyContainer>
            )}
            {showConnectWalletScreen && (
                <BodyContainer>
                    <div className="half" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <ConnectWalletButton>Connect wallet</ConnectWalletButton>
                    </div>
                </BodyContainer>
            )}
            {showBurnedScreen && !showConnectWalletScreen && <BurningComplete />}

            <Footer setAboutPageActive={setAboutPageActive} />
        </div>
    );
};
