import React, { useEffect, useState } from "react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount } from "wagmi";

import "./App.css";
import { BodyContainer, Footer } from "./app.styled";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";
import { ToastProvider } from "../../components/ToastProvider/ToastProvider";
import { GlobalStyles } from "../../config/globalStyles";
import NftList from "../../components/NftList/NftList";
import Control from "../../components/Control/Control";
import { NftProvider } from "../../components/NftProvider/NftProvider";
import { RenderMain } from "../../webl/renderingMain";

function App() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    useEffect(() => {
        if (wagmiAccount.isConnected && wagmiAccount.address) {
            setConnected(true);
        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            setConnected(true);
        } else if (suietWallet.connected && suietWallet.address) {
            setConnected(true);
        } else {
            setConnected(false);
        }
    }, [
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.address,
        wagmiAccount.isConnected,
    ]);

    return (
        <>
            <GlobalStyles />

            <ToastProvider>
                <NftProvider>
                    <div className="App">
                        <div className="WalletConnectionHeader">
                            <Wallets />
                        </div>
                        {connected && (
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
                </NftProvider>
            </ToastProvider>
            <canvas id="demo-canvas">
                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
            </canvas>
            {/* <div id="demo-canvas"></div> */}
        </>
    );
}

export default App;
