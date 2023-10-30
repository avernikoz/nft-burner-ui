import React, { useEffect } from "react";

import "./App.css";
import { RenderMain } from "../../webl/script";
// import { SolanaWalletContext } from "../../context/SolanaWalletContext";
// import { SuiWalletContext } from "../../context/SuiWalletContext";
// import { EVMWalletContext } from "../../context/EVMWalletContext";
import { Footer } from "./app.styled";
import FullScreenButton from "../../components/fullscreen-button/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";

function App() {
    useEffect(() => {
        RenderMain();
    }, []);

    return (
        // <SolanaWalletContext>
        //     <SuiWalletContext>
        //         <EVMWalletContext>
        <div className="App">
            <div className="WalletConnectionHeader">
                <Wallets></Wallets>
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
        //         </EVMWalletContext>
        //     </SuiWalletContext>
        // </SolanaWalletContext>
    );
}

export default App;
