import React from "react";
import { Footer } from "./app.styled";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";

export const InternalApp: React.FC = () => (
    <div className="App">
        <div className="WalletConnectionHeader">
            <Wallets />
        </div>
        <Footer>
            <FullScreenButton />
        </Footer>
    </div>
);
