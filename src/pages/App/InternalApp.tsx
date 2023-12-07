import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import React, { useContext, useEffect, useState } from "react";
import { useAccount as useWagmiAccount } from "wagmi";

import Control from "../../components/Control/Control";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import NftList from "../../components/NftList/NftList";
import { NftContext } from "../../components/NftProvider/NftProvider";
import Wallets from "../../components/wallets/Wallets";
import { ENftBurnStatus } from "../../utils/types";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import "./App.css";
import { BodyContainer, Footer } from "./app.styled";

export const InternalApp: React.FC = () => {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const [showUI, setShowUI] = useState<boolean>(false);
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
        if (NftController?.nftStatus === ENftBurnStatus.BURNED) {
            GRenderingStateMachine.SetRenderingState(ERenderingState.BurningReady);
            setShowUI(false);
        }
    }, [NftController?.nftStatus]);

    return (
        <div className="App">
            <div className="WalletConnectionHeader">
                <Wallets
                    hideUI={() => {
                        setShowUI(false);
                    }}
                />
            </div>
            {showUI && (
                <BodyContainer>
                    <div className="half">
                        <NftList></NftList>
                        <Control></Control>
                    </div>
                </BodyContainer>
            )}

            <Footer>
                <FullScreenButton />
            </Footer>
        </div>
    );
};
