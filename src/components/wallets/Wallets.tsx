import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@suiet/wallet-kit";
import { Button } from "primereact/button";
import { useState } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { EVMWalletContext } from "../../context/EVMWalletContext";
import { SuiWalletContext } from "../../context/SuiWalletContext";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
import { StyledSidebar } from "./Wallets.styled";

function Wallets() {
    const [visibleRight, setVisibleRight] = useState(false);

    return (
        <div>
            <div className="flex gap-2 justify-content-center">
                <Button icon="pi pi-wallet" onClick={() => setVisibleRight(true)} />
            </div>

            <StyledSidebar
                visible={visibleRight}
                header="Choose your wallet"
                position="right"
                baseZIndex={100}
                onHide={() => setVisibleRight(false)}
                className="p-sidebar-md"
            >
                <p>
                    <SolanaWalletContext>
                        <SuiWalletContext>
                            <EVMWalletContext>
                                <div className="button-control">
                                    <label>Solana</label>
                                    <WalletMultiButton />
                                    <WalletDisconnectButton />
                                    <label>Suiet</label>
                                    <ConnectButton />
                                    <label>Rainbow</label>
                                    <RainbowConnectButton />
                                </div>
                            </EVMWalletContext>
                        </SuiWalletContext>
                    </SolanaWalletContext>
                    `
                </p>
            </StyledSidebar>
        </div>
    );
}

export default Wallets;
