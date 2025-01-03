import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { Menu } from "primereact/menu";
import { ButtonContainer, ProfileLabel, StyledMenu, StyledPanelMenu, WalletButton } from "./WalletSelector.styled";
// import { useWallet as suietUseWallet, WalletAdapter } from "@suiet/wallet-kit";
import { useCurrentWallet as suietUseWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { Connector, useAccount as useWagmiAccount } from "wagmi";
import { ConnectorData, disconnect as wagmiDisconnect } from "@wagmi/core";

import { IAccount, IMenuConnectionItem } from "./types";
import { createMenuItems } from "./variables";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import { NftContext } from "../NftProvider/NftProvider";
import { ENftBurnStatus } from "../../utils/types";
import { NftSelectorDialog } from "./components/NetworkSelectorDialog/NetworkSelectorDialog";
import { Level } from "../Level/Level";
import { useUserLevel } from "../../context/UserLevelContext";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import { getEVMNetworkName } from "../../utils/getEVMNetworkName";
import { SoundIconElement } from "../Footer/components/SoundIconElement";
// eslint-disable-next-line import/no-unresolved,import/no-extraneous-dependencies
// import { ConnectButton, useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";

export const WalletSelector = ({
    hideUI,
    walletSelectPopupVisible,
    setWalletSelectPopupVisible,
}: {
    hideUI: () => void;
    walletSelectPopupVisible: boolean;
    setWalletSelectPopupVisible: (visible: boolean) => void;
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeRainbowConnector, setActiveRainbowConnector] = useState<Connector | null>(null);
    const [account, setAccount] = useState<IAccount | null>(null);
    const profileMenu = useRef<Menu>(null);
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const toastController = useContext(ToastContext);
    const lastEvmIndex = 3;
    const NftController = useContext(NftContext);
    const { level, points } = useUserLevel();
    const { data: walletBalanceData } = useWalletBalance({ address: account?.id, network: account?.network });

    const { mutate: disconnect } = useDisconnectWallet();

    const [open, setOpen] = useState(false);

    const connect = useCallback(
        (acc: IAccount) => {
            localStorage.setItem("activeIndex", JSON.stringify(activeIndex));
            // TODO: On wallet connect method from react bridge
            GRenderingStateMachine.SetRenderingState(ERenderingState.Inventory);
            setWalletSelectPopupVisible(false);
            setAccount(acc);
            ReactGA.event({ category: "wallet_dialog_popup", action: "connect_wallet", label: acc.network.toString() });
        },
        [activeIndex, setWalletSelectPopupVisible],
    );

    const disconnectWallet = useCallback(async () => {
        if (wagmiAccount.isConnected) {
            await wagmiDisconnect();
        }
        if (suietWallet.isConnected) {
            disconnect();
        }
        if (solanaWallet.connected) {
            solanaWallet.wallet?.adapter
                .disconnect()
                .then(() => {
                    solanaWallet.connected = false;
                    solanaWallet.publicKey = null;
                    hideUI();
                })
                .catch((error) => {
                    Sentry.captureException(error, {
                        tags: { scenario: "disconnect_wallet" },
                        extra: { chain: { id: "solana" } },
                    });

                    console.error("Failed to disconnect from Solana Wallet:", error);
                });
        }

        NftController.setNftStatus(ENftBurnStatus.EMPTY);
        NftController.setActiveNft(null);
        setActiveRainbowConnector(null);
        setAccount(null);
    }, [wagmiAccount.isConnected, suietWallet.isConnected, solanaWallet, NftController, disconnect, hideUI]);

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
                    // const isNetworkEvmAndConnected = activeIndex <= lastEvmIndex && activeRainbowConnector !== null;
                    const isNetworkEvmAndConnected = false;
                    if (isNetworkEvmAndConnected) {
                        if (!activeRainbowConnector?.switchChain) {
                            return;
                        }
                        await activeRainbowConnector?.switchChain(chainId);
                        const address = await activeRainbowConnector?.getAccount();
                        if (!address) {
                            return;
                        }

                        const networkName = getEVMNetworkName(chainId);
                        if (!networkName) {
                            throw new Error("Unsupported network type");
                        }

                        connect({
                            id: address,
                            network: networkName,
                        });
                    } else {
                        disconnectWallet();
                    }
                    setActiveIndex(index);
                }
            } catch (error) {
                Sentry.captureException(error, {
                    tags: { scenario: "switch_chain" },
                    extra: { chain: { id: chainId } },
                });

                console.error(error);
                if (error instanceof Error) {
                    toastController?.showError("Failed to switch chain: " + error.message);
                } else {
                    toastController?.showError("Failed to switch chain: " + error);
                }
            }
        },
        [activeIndex, activeRainbowConnector, connect, disconnectWallet, toastController],
    );

    const items = useMemo<IMenuConnectionItem[]>(
        () =>
            createMenuItems(
                switchChain,
                connect,
                setActiveRainbowConnector,
                setActiveIndex,
                activeIndex,
                disconnectWallet,
            ),
        [activeIndex, connect, disconnectWallet, switchChain],
    );

    //items for dialog tabs
    // const tabItems = useRef([items[0], items[4], items[5]]);
    const tabItems = useRef([items[0]]);

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
        // {
        //     label: "Copy address",
        //     icon: "pi pi-copy",
        //     command: () => {
        //         if (account !== null && account?.id !== null) {
        //             navigator.clipboard.writeText(account?.id ?? "");
        //             toastController?.showSuccess("Copy address");
        //         }
        //     },
        // },
        {
            label: "Disconnect",
            icon: "pi pi-power-off",
            command: () => {
                disconnectWallet();
            },
        },
    ];

    // some walletsContext can save session in cache, it's just garantyee that all network will be disconnected when app is running
    useEffect(() => {
        disconnectWallet();
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

    const accountChainListener = useCallback(
        (data: ConnectorData) => {
            if (data.account) {
                if (!account?.network) {
                    throw new Error("Network is not choosen in the wallet");
                }
                connect({
                    id: data.account,
                    network: account?.network,
                    walletIcon: account?.walletIcon,
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
        [account?.network, account?.walletIcon, connect, items, switchChain, toastController],
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
                <div className="soundIcon">
                    <SoundIconElement />
                </div>
                <StyledPanelMenu model={menuItems} color={"primary"} />
                {!account && (
                    <WalletButton
                        aria-label="Choose your wallet"
                        icon="pi pi-wallet"
                        onClick={() => {
                            setOpen(!open);
                            setWalletSelectPopupVisible(true);
                        }}
                    />
                )}
                {account && (
                    <>
                        <StyledMenu model={profileItems} popup ref={profileMenu} popupAlignment="right" />
                        <ProfileLabel
                            className="label"
                            onClick={(event) => profileMenu.current?.toggle(event)}
                            aria-controls="popup_menu_right"
                            aria-haspopup
                        >
                            <i className="pi pi-wallet" />
                            {/* <div className="icon"> */}
                            {/* {typeof account.walletIcon === "string" ? (
                                    <IconTemplate svgString={account.walletIcon} />
                                ) : (
                                    account.walletIcon
                                )} */}
                            {/* </div> */}
                            <div className="content">
                                {walletBalanceData && walletBalanceData.balanceFormatted !== null ? (
                                    <span className="balance">
                                        {walletBalanceData.balanceFormatted} {walletBalanceData.balanceTokenSymbol}
                                    </span>
                                ) : (
                                    <span className="balance">-</span>
                                )}
                                {/* <span className="chain-id">{account.id}</span> */}
                            </div>
                        </ProfileLabel>
                        <Level showTooltip={true} level={level} points={points} showLevelText={false} levelSize={50} />
                    </>
                )}
            </ButtonContainer>
            <NftSelectorDialog
                visible={walletSelectPopupVisible}
                setVisible={() => setWalletSelectPopupVisible(false)}
                activeIndex={activeIndex}
                tabItems={tabItems}
            />
        </div>
    );
};
