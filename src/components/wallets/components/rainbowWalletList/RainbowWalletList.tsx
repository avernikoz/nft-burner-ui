import { ReactComponent as Metamask } from "../../assets/metamask.svg";
import { ReactComponent as CoinBase } from "../../assets/coinbase.svg";
import { ReactComponent as Phantom } from "../../assets/phantom.svg";
import { ReactComponent as WalletConnect } from "../../assets/walletconnect.svg";
import React, { JSX, useRef, useState } from "react";
import { ListBox } from "primereact/listbox";
import { Item } from "./RainbowWalletList.styled";
import { coinbaseWallet, metaMaskWallet, phantomWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { Connector } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { Toast } from "primereact/toast";
import { IAccount } from "../../models";
import { fetchBalance } from "@wagmi/core";
import { arbitrum, optimism, polygon, mainnet } from "wagmi/chains";

interface IWallet {
    logo: JSX.Element;
    label: string;
    wallet: Connector;
}

function RainbowWalletList(props: {
    connect: (account: IAccount) => void;
    setActiveConnector: (conn: Connector) => void;
    chain: number;
}): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet>();
    const toast = useRef<Toast>(null);
    const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;

    const show = () => {
        toast.current?.show({
            severity: "info",
            summary: "Connecting",
            detail: "Please waiting",
            icon: <i className="pi pi-spin pi-cog"></i>,
        });
    };

    if (typeof projectId !== "string" || projectId.length === 0) {
        throw new Error("Empty REACT_APP_WALLET_CONNECT_PROJECT_ID");
    }

    const connectors = connectorsForWallets([
        {
            groupName: "My Wallets",
            wallets: [
                metaMaskWallet({ projectId, chains: [mainnet, polygon, arbitrum, optimism] }),
                coinbaseWallet({ appName: "My RainbowKit App", chains: [mainnet, polygon, arbitrum, optimism] }),
                phantomWallet({ chains: [mainnet, polygon, arbitrum, optimism] }),
                walletConnectWallet({ chains: [mainnet, polygon, arbitrum, optimism], projectId }),
            ],
        },
    ]);

    const connectorsList = connectors();

    const wallets: IWallet[] = [
        {
            logo: <Metamask width={30} height={30} style={{ marginRight: "5px" }} />,
            label: "Metamask",
            wallet: connectorsList[0],
        },
        {
            logo: <CoinBase width={30} height={30} style={{ marginRight: "5px" }} />,
            label: "CoinBase",
            wallet: connectorsList[1],
        },
        {
            logo: <Phantom width={30} height={30} style={{ marginRight: "5px" }} />,
            label: "Phantom wallet",
            wallet: connectorsList[2],
        },
        {
            logo: <WalletConnect width={30} height={30} style={{ marginRight: "5px" }} />,
            label: "Wallet Connect",
            wallet: connectorsList[3],
        },
    ];

    async function connect(wallet: IWallet) {
        try {
            show();
            await wallet.wallet.connect();
            const address = await wallet.wallet.getAccount();
            const balance = await fetchBalance({
                address,
                chainId: props.chain,
            });
            props.connect({
                id: address,
                balance: balance.formatted.substring(0, 5) + balance.symbol,
                walletIcon: selectedOption?.logo,
            });
            props.setActiveConnector(wallet.wallet);
            setSelectedOption(wallet);
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
    }

    const itemTemplate = (item: (typeof wallets)[0]) => {
        return (
            <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
                {item.logo}
                <div>{item.label}</div>
            </Item>
        );
    };
    return (
        <>
            <Toast ref={toast} position="top-left" />
            <ListBox
                value={selectedOption}
                itemTemplate={itemTemplate}
                onChange={async (e) => {
                    await connect(e.value);
                }}
                listStyle={{ maxHeight: "330px" }}
                options={wallets}
                optionLabel="label"
            />
        </>
    );
}

export default RainbowWalletList;
