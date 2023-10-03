import React, { useEffect } from "react";
import "./App.css";
import { RenderMain } from "../../webl/script";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
import { SuiWalletContext } from "../../context/SuiWalletContext";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@suiet/wallet-kit";

function App() {
    useEffect(() => {
        RenderMain();
    }, []);
    return (
        <SolanaWalletContext>
            <SuiWalletContext>
                <div className="App">
                    <div className="WalletConnectionHeader">
                        <WalletMultiButton />
                        <WalletDisconnectButton />
                        <ConnectButton />
                    </div>
                    <div>
                        <canvas id="demo-canvas">
                            Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                        </canvas>
                    </div>
                </div>
            </SuiWalletContext>
        </SolanaWalletContext>
    );
}

export default App;
