import { ReactComponent as Metamask } from "../../assets/metamask.svg";
import { ReactComponent as CoinBase } from "../../assets/coinbase.svg";
import { ReactComponent as Phantom } from "../../assets/phantom.svg";
import { ReactComponent as WalletConnect } from "../../assets/walletconnect.svg";
import React, { JSX, useRef, useState } from "react";
import { StyledListBox } from "./RainbowWalletList.styled";
import { Connector } from "wagmi";
import { Toast } from "primereact/toast";
import { IAccount, IWallet } from "../../types";
import { fetchBalance } from "@wagmi/core";
import RainbowItemTemplate from "./RainbowItemTemplate";
import connectors from "../../../../utils/connectors";

function RainbowWalletList(props: {
    connect: (account: IAccount) => void;
    setActiveConnector: (conn: Connector) => void;
    chain: number;
}): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet>();
    const toast = useRef<Toast>(null);

    const show = () => {
        toast.current?.show({
            severity: "info",
            summary: "Connecting",
            detail: "Please waiting",
            icon: <i className="pi pi-spin pi-cog"></i>,
        });
    };

    const connectorsList = connectors;

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
            const activeChain = await wallet.wallet.getChainId();
            if (activeChain !== props.chain && wallet.wallet.switchChain) {
                await wallet.wallet.switchChain(props.chain);
            }
            const address = await wallet.wallet.getAccount();
            const balance = await fetchBalance({
                address,
                chainId: props.chain,
            });
            props.connect({
                id: address,
                balance: balance.formatted.substring(0, 5) + " " + balance.symbol,
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

    return (
        <>
            <Toast ref={toast} position="top-left" />
            <StyledListBox
                value={selectedOption}
                itemTemplate={RainbowItemTemplate}
                onChange={async (e) => {
                    await connect(e.value);
                }}
                options={wallets}
                optionLabel="label"
            />
        </>
    );
}

export default RainbowWalletList;
