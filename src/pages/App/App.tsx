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
                            </div>
                        </BodyContainer>
                        <Footer>
                            <FullScreenButton />
                        </Footer>
                    </div>
                    <canvas id="demo-canvas">
                        Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                    </canvas>
                </SuiWalletContext>
            </EVMWalletContext>
        </SolanaWalletContext>
    );
}

export default App;
