import { Button } from "primereact/button";
import React, { useRef, useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { PanelMenu } from "primereact/panelmenu";
import { TabMenu } from "primereact/tabmenu";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
// eslint-disable-next-line import/no-unresolved
import { ButtonContainer, ProfileLabel, StyledDialog } from "./Wallets.styled";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { Connector } from "wagmi";
import { fetchBalance, disconnect as wagmiDisconnect } from "@wagmi/core";

import { ReactComponent as SuietLogo } from "./assets/suietLogo.svg";
import { ReactComponent as SolanaLogo } from "./assets/solana.svg";
import { ReactComponent as EthereumLogo } from "./assets/ethereum-logo.svg";
import { ReactComponent as OptimismLogo } from "./assets/optimism-logo.svg";
import { ReactComponent as ArbitrumLogo } from "./assets/arbitrum-logo.svg";
import { ReactComponent as PolygonLogo } from "./assets/polygonLogo.svg";
import RainbowWalletList from "./components/rainbowWalletList/RainbowWalletList";
import SuietWalletLIst from "./components/suietWalletList/SuietWalletLIst";
import SolanaWalletList from "./components/solanaWalletList/SolanaWalletList";
import SVGTemplate from "../SVGTemplate/SVGTemplate";
import { IAccount } from "./models";
import { arbitrum, optimism, polygon, mainnet } from "wagmi/chains";

function Wallets() {
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeRainConnector, setActiveRainConnector] = useState<Connector | null>(null);
    const [account, setAccount] = useState<IAccount | null>(null);
    const profileMenu = useRef<Menu>(null);
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const toast = useRef<Toast>(null);

    function connect(acc: IAccount) {
        setVisible(false);
        setAccount(acc);
    }

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

    async function switchChain(index: number, chainId: number) {
        console.log("hello: ", activeRainConnector);
        try {
            if (activeIndex !== index) {
                if (activeIndex < 4 && activeRainConnector !== null) {
                    // if (!activeRainConnector.switchChain) {
                    //     return;
                    // }
                    //await activeRainConnector?.switchChain(chainId);
                    const address = await activeRainConnector?.getAccount();
                    if (!address) {
                        return;
                    }
                    const balance = await fetchBalance({
                        address,
                        chainId,
                    });
                    console.log(balance, address);

                    connect({
                        id: address,
                        balance: balance.formatted + balance.symbol,
                    });
                } else {
                    disconnect();
                }
                setActiveIndex(index);
            }
        } catch (error) {
            console.error("Failed to connect:", error);
            if (error instanceof Error) {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to connect: " + error.message,
                });
            } else {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to connect: " + error });
            }
        }
    }

    const items = [
        {
            label: "Ethereum",
            icon: <EthereumLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                switchChain(0, mainnet.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={mainnet.id}
                />
            ),
        },
        {
            label: "Polygon",
            icon: <PolygonLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                switchChain(1, polygon.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={polygon.id}
                />
            ),
        },
        {
            label: "Arbitrum",
            icon: <ArbitrumLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                switchChain(2, arbitrum.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={arbitrum.id}
                />
            ),
        },
        {
            label: "Optimism",
            icon: <OptimismLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                switchChain(3, optimism.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={optimism.id}
                />
            ),
        },
        {
            label: "Sui",
            icon: <SuietLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                if (activeIndex !== 4) {
                    disconnect();
                    setActiveIndex(4);
                }
            },
            list: <SuietWalletLIst connect={connect} />,
        },
        {
            label: "Solana",
            icon: <SolanaLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                if (activeIndex !== 5) {
                    disconnect();
                    setActiveIndex(5);
                }
            },
            list: <SolanaWalletList connect={connect} />,
        },
    ];

    const menuItems: MenuItem[] = [
        {
            label: items[activeIndex].label,
            icon: items[activeIndex].icon,
            style: {
                backgroundColor: "primary",
                color: "white",
            },
            items: items,
        },
    ];

    const profileItems: MenuItem[] = [
        {
            label: "Copy to clickBoard",
            icon: "pi pi-copy",
            command: () => {
                toast.current?.show({ severity: "success", summary: "Success", detail: "Copy to Clipboard" });
            },
        },
        {
            label: "Disconnect",
            icon: "pi pi-power-off",
            command: () => {
                disconnect();
            },
        },
    ];

    return (
        <div className="wallet">
            <Toast ref={toast} position="top-left" />
            <ButtonContainer>
                <PanelMenu model={menuItems} className="w-full md:w-25rem" color={"primary"} />
                {!account && (
                    <Button
                        aria-label="Choose your wallet"
                        rounded
                        icon="pi pi-wallet"
                        onClick={() => setVisible(true)}
                    />
                )}
                {account && (
                    <>
                        <Menu
                            model={profileItems}
                            popup
                            ref={profileMenu}
                            id="popup_menu_right"
                            popupAlignment="right"
                        />
                        <ProfileLabel
                            className="label"
                            onClick={(event) => profileMenu.current?.toggle(event)}
                            aria-controls="popup_menu_right"
                            aria-haspopup
                        >
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
                    </>
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
