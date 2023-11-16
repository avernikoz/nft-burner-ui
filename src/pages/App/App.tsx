import React, { useEffect } from "react";

import "./App.css";
import { RenderMain } from "../../webl/renderingMain";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
import { EVMWalletContext } from "../../context/EVMWalletContext";
import { BodyContainer, Footer } from "./app.styled";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";
import { SuiWalletContext } from "../../context/SuiWalletContext";
import { ToastProvider } from "../../components/ToastProvider/ToastProvider";
import NftList from "../../components/NftList/NftList";
import { Button } from "primereact/button";

function App() {
    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            RenderMain();
        }
    }, []);

    return (
        <SolanaWalletContext>
            <EVMWalletContext>
                <SuiWalletContext>
                    <div className="App">
                        <div className="WalletConnectionHeader">
                            <ToastProvider>
                                <Wallets />
                            </ToastProvider>
                        </div>

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
                                                raised
                                                severity="info"
                                                aria-label="Notification"
                                            />
                                            <Button rounded text raised severity="help" aria-label="Favorite">
                                                <img
                                                    alt="logo"
                                                    src="public/assets/svg/twitch.png"
                                                    className="h-2rem"
                                                ></img>
                                            </Button>
                                            <Button
                                                icon="pi pi-youtube"
                                                rounded
                                                text
                                                raised
                                                severity="danger"
                                                aria-label="Cancel"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BodyContainer>
                        <Footer>
                            <FullScreenButton />
                        </Footer>
                    </div>
                    <canvas id="demo-canvas">
                        Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                    </canvas>
                    <div id="demo-canvas"></div>
                </SuiWalletContext>
            </EVMWalletContext>
        </SolanaWalletContext>
    );
}

export default App;
