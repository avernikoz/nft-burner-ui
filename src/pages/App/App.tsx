import React, { useEffect } from "react";
import "./App.css";
import { RenderMain } from "../../webl/script";
import { SolanaWalletContext } from "../../wallet/solana/SolanaWalletContext";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function App() {
    useEffect(() => {
        RenderMain();
    }, []);
    return (
        <SolanaWalletContext>
            <div className="App">
                <div className="WalletConnectionHeader">
                    <WalletMultiButton />
                    <WalletDisconnectButton />
                </div>
                <div>
                    <canvas id="demo-canvas">
                        Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                    </canvas>
                </div>
            </div>
        </SolanaWalletContext>
    );
}

export default App;
