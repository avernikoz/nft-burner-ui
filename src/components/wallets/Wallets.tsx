import { Button } from "primereact/button";
import React, { useState } from "react";
import { ReactComponent as SuietLogo } from "./assets/suietLogo.svg";
import { ReactComponent as SolanaLogo } from "./assets/solana.svg";
import { ReactComponent as RainbowLogo } from "./assets/rainbow.svg";
import { TabMenu } from "primereact/tabmenu";
import RainbowWalletList from "./components/rainbowWalletList/RainbowWalletList";
import SuietWalletLIst from "./components/suietWalletList/SuietWalletLIst";
import SolanaWalletList from "./components/solanaWalletList/SolanaWalletList";

// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { PanelMenu } from "primereact/panelmenu";
import { ButtonContainer, ProfileLabel, StyledDialog } from "./Wallets.styled";

// eslint-disable-next-line import/no-extraneous-dependencies
import { disconnect as wagmiDisconnect } from "@wagmi/core";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import SVGTemplate from "../SVGTemplate/SVGTemplate";
import { IAccount } from "./models";

function Wallets() {
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [account, setAccount] = useState<IAccount | null>(null);
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();

    function connect(acc: IAccount) {
        setVisible(false);
        setAccount(acc);
    }

    const items = [
        {
            label: "Suiet",
            icon: <SuietLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(0);
            },
            list: <SuietWalletLIst connect={connect} />,
        },
        {
            label: "Rainbow",
            icon: <RainbowLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(1);
            },
            list: <RainbowWalletList connect={connect} />,
        },
        {
            label: "Solana",
            icon: <SolanaLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(2);
            },
            list: <SolanaWalletList connect={connect} />,
        },
    ];

    const menuItems: MenuItem[] = [
        {
            label: "Choose connection",
            icon: "pi pi-spin pi-compass",
            style: {
                backgroundColor: "primary",
                color: "white",
            },
            items: items,
        },
    ];

    async function disconnect() {
        await wagmiDisconnect();
        if (suietWallet.connected) {
            await suietWallet.disconnect();
        }
        if (solanaWallet.connected) {
            await solanaWallet.disconnect();
        }
        setAccount(null);
    }

    return (
        <div className="wallet">
            <ButtonContainer>
                <div>{items[activeIndex].icon}</div>
                <PanelMenu model={menuItems} className="w-full md:w-25rem" color={"primary"} />
                {!account ? (
                    <Button
                        aria-label="Choose your wallet"
                        rounded
                        icon="pi pi-wallet"
                        onClick={() => setVisible(true)}
                    />
                ) : (
                    <Button icon="pi pi-times" rounded severity="danger" aria-label="Cancel" onClick={disconnect} />
                )}
                {account && (
                    <ProfileLabel className="label">
                        <div className="icon">
                            {typeof account.walletIcon === "string" ? (
                                <SVGTemplate svgString={account.walletIcon} />
                            ) : (
                                account.walletIcon
                            )}
                        </div>
                        <div className="content">
                            <span className="balance">{account.balance}</span>
                            <span className="chain-id">{account.id}</span>
                        </div>
                    </ProfileLabel>
                )}
            </ButtonContainer>
            <StyledDialog
                header="Choose your wallet"
                visible={visible}
                style={{ width: "30vw", height: "500px" }}
                onHide={() => setVisible(false)}
            >
                <TabMenu
                    model={items}
                    activeIndex={activeIndex}
                    style={{ width: "90%", margin: "0 auto" }}
                    onTabChange={(e) => setActiveIndex(e.index)}
                />
                <div>{items[activeIndex].list}</div>
            </StyledDialog>
        </div>
    );
}

export default Wallets;
