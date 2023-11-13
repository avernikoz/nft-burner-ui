import React, { useEffect } from "react";

import "./App.css";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
import { EVMWalletContext } from "../../context/EVMWalletContext";
import { Footer } from "./app.styled";
import FullScreenButton from "../../components/fullscreen-button/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";
import { SuiWalletContext } from "../../context/SuiWalletContext";
import { RenderMain } from "../../webl/script";

function App() {
    useEffect(() => {
        RenderMain();
    }, []);

    return (
        <SolanaWalletContext>
            <EVMWalletContext>
                <SuiWalletContext>
                    <div className="App">
                        <div className="WalletConnectionHeader">
                            <Wallets />
                        </div>
                        <div>
                            <canvas id="demo-canvas">
                                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                            </canvas>
                        </div>
                        <Footer>
                            <FullScreenButton />
                        </Footer>
                    </div>
                </SuiWalletContext>
            </EVMWalletContext>
        </SolanaWalletContext>
    );
}

export default App;
