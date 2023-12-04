import * as Sentry from "@sentry/react";
import { ReactComponent as Metamask } from "../../assets/metamask.svg";
import { ReactComponent as CoinBase } from "../../assets/coinbase.svg";
import { ReactComponent as Phantom } from "../../assets/phantom.svg";
import { ReactComponent as WalletConnect } from "../../assets/walletconnect.svg";
import React, { JSX, useContext, useState } from "react";
import { StyledListBox } from "./RainbowWalletList.styled";
import { Connector } from "wagmi";
import { IAccount, IWallet } from "../../types";
import { fetchBalance } from "@wagmi/core";
import RainbowItemTemplate from "./RainbowItemTemplate";
import connectors from "../../../../utils/connectors";
import { ToastContext } from "../../../ToastProvider/ToastProvider";

function RainbowWalletList(props: {
    connect: (account: IAccount) => void;
    setActiveConnector: (conn: Connector) => void;
    chain: number;
}): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet>();
    const toastController = useContext(ToastContext);

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
            toastController?.showInfo("Connecting", "Please accept connection in wallet");
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
            Sentry.captureException(error, {
                tags: { scenario: "connect_wallet" },
                extra: { chain: { id: props.chain } },
            });

            if (error instanceof Error) {
                toastController?.showError("Failed to connect: " + error.message);
            } else {
                toastController?.showError("Failed to connect: " + error);
            }
        }
    }

    return (
        <>
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
