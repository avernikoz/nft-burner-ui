import { Button } from "primereact/button";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { PanelMenu } from "primereact/panelmenu";
import { Menu } from "primereact/menu";
import { ButtonContainer, ProfileLabel, StyledDialog } from "./Wallets.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connector, useAccount as useWagmiAccount } from "wagmi";
import { ConnectorData, disconnect as wagmiDisconnect, fetchBalance } from "@wagmi/core";

import IconTemplate from "../IconTemplate/IconTemplate";
import { IAccount, IMenuConnectionItem } from "./types";
import DialogWalletList from "./components/DialogWalletList/DialogWalletList";
import { ethers } from "ethers";
import { createMenuItems } from "./variables";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";

function Wallets() {
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeRainbowConnector, setActiveRainbowConnector] = useState<Connector | null>(null);
    const [account, setAccount] = useState<IAccount | null>(null);
    const profileMenu = useRef<Menu>(null);
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const wagmiAccount = useWagmiAccount();
    const toastController = useContext(ToastContext);
    const lastEvmIndex = 3;

    const connect = useCallback(
        (acc: IAccount) => {
            localStorage.setItem("activeIndex", JSON.stringify(activeIndex));
            GRenderingStateMachine.SetRenderingState(ERenderingState.Inventory);
            setVisible(false);
            setAccount(acc);
        },
        [activeIndex],
    );

    const disconnect = useCallback(async () => {
        if (wagmiAccount.isConnected) {
            await wagmiDisconnect();
        }
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

        setActiveRainbowConnector(null);
        setAccount(null);
    }, [wagmiAccount.isConnected, suietWallet, solanaWallet]);

    useEffect(() => {
        // Handle disconnect wallet in case wallet `A` was connected and then user
        // switched account to wallet `B`, which was not connected ever to the dapp.
        solanaWallet.wallet?.adapter.addListener("disconnect", () => {
            setAccount(null);
            toastController?.showInfo("Wallet disconnected", "Wallet got disconnected");
        });

        return () => {
            solanaWallet.wallet?.adapter.removeListener("disconnect");
        };
    }, [solanaWallet.wallet?.adapter, toastController]);

    // get previous connected network
    useEffect(() => {
        const active = localStorage.getItem("activeIndex");
        if (active !== null) {
            setActiveIndex(+active);
        }
    }, []);

    // method for switch account
    const switchChain = useCallback(
        async (index: number, chainId: number) => {
            try {
                const isNetworkChange = activeIndex !== index;
                if (isNetworkChange) {
                    const isNetworkEvmAndConnected = activeIndex <= lastEvmIndex && activeRainbowConnector !== null;
                    if (isNetworkEvmAndConnected) {
                        if (!activeRainbowConnector.switchChain) {
                            return;
                        }
                        await activeRainbowConnector?.switchChain(chainId);
                        const address = await activeRainbowConnector?.getAccount();
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
            } catch (error) {
                if (error instanceof Error) {
                    toastController?.showError("Failed to connect: " + error.message);
                } else {
                    toastController?.showError("Failed to connect: " + error);
                }
            }
        },
        [activeIndex, activeRainbowConnector, connect, disconnect, toastController],
    );

    const items = useMemo<IMenuConnectionItem[]>(
        () => createMenuItems(switchChain, connect, setActiveRainbowConnector, setActiveIndex, activeIndex, disconnect),
        [activeIndex, connect, disconnect, switchChain],
    );

    //items for dialog tabs
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
            label: "Copy address",
            icon: "pi pi-copy",
            command: () => {
                if (account !== null && account?.id !== null) {
                    navigator.clipboard.writeText(account?.id ?? "");
                    toastController?.showSuccess("Copy address");
                }
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

    // some walletsContext can save session in cache, it's just garantyee that all network will be disconnected when app is running
    useEffect(() => {
        disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // effect for change tab view in dialog
    useEffect(() => {
        const isEvmNetwork = activeIndex <= lastEvmIndex;
        if (isEvmNetwork) {
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
                    toastController?.showError("Failed to fetch balance: " + err.message);
                },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [solanaWallet.publicKey?.toString()]);

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
                    toastController?.showError("Chain is unsuported");
                    return;
                }
                const index = items.findIndex((a) => a.chainId === data.chain?.id);
                localStorage.setItem("activeIndex", JSON.stringify(index));
                switchChain(index, data.chain.id);
            }
        },
        [account?.walletIcon, connect, items, switchChain, toastController],
    );

    useEffect(() => {
        if (activeRainbowConnector) {
            activeRainbowConnector.on("change", accountChainListener);
            return () => {
                activeRainbowConnector?.off("change", accountChainListener);
            };
        }
    }, [
        account?.walletIcon,
        accountChainListener,
        activeRainbowConnector,
        connect,
        items,
        switchChain,
        wagmiAccount.address,
        wagmiAccount.isConnected,
    ]);

    return (
        <div className="wallet">
            <ButtonContainer>
                <PanelMenu
                    model={menuItems}
                    className="w-full md:w-25rem"
                    color={"primary"}
                    style={{ minWidth: "200px" }}
                />
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
                    // TODO: Replace with more descriptive condition
                    activeTab={activeIndex < 4 ? 0 : activeIndex - 3}
                ></DialogWalletList>
            </StyledDialog>
        </div>
    );
}

export default Wallets;
