import { Button } from "primereact/button";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { PanelMenu } from "primereact/panelmenu";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
// eslint-disable-next-line import/no-unresolved
import { ButtonContainer, ProfileLabel, StyledDialog } from "./Wallets.styled";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connector, useAccount as useWagmiAccount } from "wagmi";
import { ConnectorData, disconnect as wagmiDisconnect, fetchBalance } from "@wagmi/core";

import IconTemplate from "../IconTemplate/IconTemplate";
import { IAccount, IMenuConnectionItem } from "./types";
import DialogWalletList from "./components/dialogWalletList/DialogWalletList";
import { ethers } from "ethers";
import { createMenuItems } from "./variables";

function Wallets() {
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeRainConnector, setActiveRainConnector] = useState<Connector | null>(null);
    const [account, setAccount] = useState<IAccount | null>(null);
    const profileMenu = useRef<Menu>(null);
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const wagmiAccount = useWagmiAccount();
    const toast = useRef<Toast>(null);
    const lastEvmIndex = 3;

    const connect = useCallback(
        (acc: IAccount) => {
            localStorage.setItem("activeIndex", JSON.stringify(activeIndex));
            setVisible(false);
            setAccount(acc);
        },
        [activeIndex],
    );

    const disconnect = useCallback(async () => {
        await wagmiDisconnect();
        if (suietWallet.connected) {
            await suietWallet.disconnect();
        }
        if (solanaWallet.connected) {
            solanaWallet.publicKey = null;
            solanaWallet.connected = false;
            solanaWallet.disconnect().catch((error) => {
                console.error("Failed to disconnect from Solana Wallet:", error);
            });
        }

        setActiveRainConnector(null);
        setAccount(null);
    }, [suietWallet, solanaWallet, setAccount]);

    useEffect(() => {
        const active = localStorage.getItem("activeIndex");
        if (active !== null) {
            setActiveIndex(+active);
        }
    }, []);

    const switchChain = useCallback(
        async (index: number, chainId: number) => {
            try {
                if (activeIndex !== index) {
                    if (activeIndex <= lastEvmIndex && activeRainConnector !== null) {
                        if (!activeRainConnector.switchChain) {
                            return;
                        }
                        await activeRainConnector?.switchChain(chainId);
                        const address = await activeRainConnector?.getAccount();
                        if (!address) {
                            return;
                        }
                        const balance = await fetchBalance({
                            address,
                            chainId,
                        });

                        connect({
                            id: address,
                            balance: balance.formatted.substring(0, 5) + " " + balance.symbol,
                        });
                    } else {
                        disconnect();
                    }
                    setActiveIndex(index);
                }
                setActiveIndex(index); // fix
            } catch (error) {
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
        },
        [activeIndex, activeRainConnector, connect, disconnect, setActiveIndex],
    );

    const items = useMemo<IMenuConnectionItem[]>(
        () => createMenuItems(switchChain, connect, setActiveRainConnector, setActiveIndex, activeIndex, disconnect),
        [activeIndex, connect, disconnect, switchChain],
    );

    const tabItems = useRef([items[0], items[4], items[5]]);

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

    useEffect(() => {
        if (activeIndex <= lastEvmIndex) {
            tabItems.current.shift();
            tabItems.current.unshift(items[activeIndex]);
        }
    }, [activeIndex, tabItems, items]);

    useEffect(() => {
        if (solanaWallet.publicKey && account !== null) {
            solanaConnection.connection.getBalance(solanaWallet.publicKey).then(
                (balance) => {
                    const balanceInSOL = ethers.formatUnits(balance, 9).substring(0, 5);
                    connect({
                        id: solanaWallet.publicKey?.toString(),
                        balance: balanceInSOL + " SOL",
                        walletIcon: account?.walletIcon,
                    });
                },

                (err) => {
                    solanaWallet.disconnect();
                    toast.current?.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Trouble with balance: " + err.message,
                    });
                },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [solanaWallet.publicKey]);

    const accountChainListener = useCallback(
        (data: ConnectorData) => {
            if (data.account) {
                fetchBalance({
                    address: data.account,
                }).then((balance) => {
                    connect({
                        id: data.account,
                        balance: balance.formatted.substring(0, 5) + " " + balance.symbol,
                        walletIcon: account?.walletIcon,
                    });
                });
            }
            if (data.chain) {
                if (data.chain.unsupported) {
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Chain is unsuported" });
                    return;
                }
                const index = items.findIndex((a) => a.chainId === data.chain?.id);
                localStorage.setItem("activeIndex", JSON.stringify(index));
                switchChain(index, data.chain.id);
            }
        },
        [account?.walletIcon, connect, items, switchChain],
    );

    useEffect(() => {
        if (activeRainConnector) {
            activeRainConnector.on("change", accountChainListener);
            return () => {
                activeRainConnector?.off("change", accountChainListener);
            };
        }
    }, [
        account?.walletIcon,
        accountChainListener,
        activeRainConnector,
        connect,
        items,
        switchChain,
        wagmiAccount.address,
        wagmiAccount.isConnected,
    ]);

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
                                    <IconTemplate svgString={account.walletIcon} />
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
            <StyledDialog header="Choose your wallet" visible={visible} onHide={() => setVisible(false)}>
                <DialogWalletList
                    tabs={tabItems.current}
                    activeTab={activeIndex < 4 ? 0 : activeIndex - 3}
                ></DialogWalletList>
            </StyledDialog>
        </div>
    );
}

export default Wallets;
