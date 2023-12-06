import React, { useEffect, useState } from "react";
import { ReactComponent as TwitchLogo } from "../../assets/svg/twitch.svg";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount } from "wagmi";

import "./App.css";
import { RenderMain } from "../../webl/renderingMain";
import { BodyContainer, Footer } from "./app.styled";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";
import { ToastProvider } from "../../components/ToastProvider/ToastProvider";
import { GlobalStyles } from "../../config/globalStyles";
import NftList from "../../components/NftList/NftList";
import { Button } from "primereact/button";

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

            <div className="App">
                <div className="WalletConnectionHeader">
                    <ToastProvider>
                        <Wallets />
                    </ToastProvider>
                </div>
                {connected && (
                    <BodyContainer>
                        <div className="half">
                            <NftList></NftList>
                            <div className="control">
                                <div className="control__burn">
                                    <Button label="Burn NFT" severity="danger" rounded />
                                </div>
                                <div className="control__social">
                                    <Button label="Chedule Burn" severity="warning" rounded />
                                    <div className="control__social--media">
                                        <Button
                                            icon="pi pi-twitter "
                                            rounded
                                            text
                                            severity="info"
                                            aria-label="Notification"
                                        />
                                        <Button rounded text severity="help" aria-label="Favorite">
                                            <TwitchLogo />
                                        </Button>
                                        <Button
                                            icon="pi pi-youtube"
                                            rounded
                                            text
                                            severity="danger"
                                            aria-label="Cancel"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BodyContainer>
                )}

                <Footer>
                    <FullScreenButton />
                </Footer>
            </div>
            <canvas id="demo-canvas">
                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
            </canvas>
            {/* <div id="demo-canvas"></div> */}
        </>
    );
}

export default App;
