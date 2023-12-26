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

export const InternalApp: React.FC<{ setAboutPageActive: (isAboutPageActive: boolean) => void }> = ({
    setAboutPageActive,
}: {
    setAboutPageActive: (isAboutPageActive: boolean) => void;
}) => {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const [showUI, setShowUI] = useState<boolean>(false);
    const [showBurnedScreen, setShowBurnedScreen] = useState<boolean>(false);

    const NftController = useContext(NftContext);

    useEffect(() => {
        if (wagmiAccount.isConnected && wagmiAccount.address) {
            setShowUI(true);
        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            setShowUI(true);
        } else if (suietWallet.connected && suietWallet.address) {
            setShowUI(true);
        } else {
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
    ]);

    useEffect(() => {
        if (NftController.nftStatus === ENftBurnStatus.EMPTY) {
            console.debug("set show UI true");
            setShowUI(true);
            setShowBurnedScreen(false);
        }
    }, [NftController.nftStatus]);

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

            console.debug("nftBurned: ", nftBurned);

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
            {showUI && !showBurnedScreen && (
                <BodyContainer>
                    <div className="half">
                        <NftList />
                        <Control />
                    </div>
                </BodyContainer>
            )}
            {showBurnedScreen && <BurningComplete />}

            <Footer setAboutPageActive={setAboutPageActive} />
        </div>
    );
};
