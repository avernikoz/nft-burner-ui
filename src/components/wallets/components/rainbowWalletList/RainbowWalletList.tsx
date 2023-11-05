import { ReactComponent as Metamask } from "../../assets/metamask.svg";
import { ReactComponent as CoinBase } from "../../assets/coinbase.svg";
import { ReactComponent as Phantom } from "../../assets/phantom.svg";
import React, { JSX, useEffect, useRef, useState } from "react";
import { ListBox } from "primereact/listbox";
import { Item } from "./RainbowWalletList.styled";
import { coinbaseWallet, metaMaskWallet, phantomWallet } from "@rainbow-me/rainbowkit/wallets";
import { Connector, useBalance } from "wagmi";
import { mainnet } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { Toast } from "primereact/toast";
import { IAccount } from "../../models";

interface IWallet {
    logo: JSX.Element;
    label: string;
    wallet: Connector;
}

function RainbowWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet>();
    const toast = useRef<Toast>(null);
    let address: `0x${string}` | undefined;
    const { data, isError, isLoading } = useBalance({
        address,
    });
    const chains = [mainnet];
    const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;

    useEffect(() => {
        if (data && !isLoading && !isError) {
            props.connect({ id: address, balance: data?.formatted + data?.symbol, walletIcon: selectedOption?.logo });
        }
    }, [data, isLoading]);

    const show = () => {
        toast.current?.show({
            severity: "info",
            summary: "Connecting",
            detail: "Please accept connection in wallet",
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
                metaMaskWallet({ projectId, chains }),
                coinbaseWallet({ appName: "My RainbowKit App", chains }),
                phantomWallet({ chains }),
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
    ];

    async function connect(wallet: IWallet) {
        try {
            show();
            await wallet.wallet.connect();
            address = await wallet.wallet.getAccount();
            setSelectedOption(wallet);
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
