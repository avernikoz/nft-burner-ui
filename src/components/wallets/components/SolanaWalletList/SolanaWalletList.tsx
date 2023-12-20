import * as Sentry from "@sentry/react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Wallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SolanaItemTemplate from "./SolanaItemTemplate";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet, disconnect, connect } = useWallet();
    const { connection } = useConnection();
    const toastController = useContext(ToastContext);

    useEffect(() => {
        if (connected && publicKey) {
            connection.getBalance(new PublicKey(publicKey)).then(
                (balance) => {
                    const balanceInSOL = ethers.formatUnits(balance, 9).substring(0, 5);
                    props.connect({
                        id: publicKey?.toString(),
                        balance: balanceInSOL + " SOL",
                        walletIcon: wallet?.adapter.icon,
                    });
                },
                (err) => {
                    disconnect();
                    toastController?.showError("Failed to fetch balances: " + err.message);
                },
            );
        }
    }, [connected, connection, disconnect, props, publicKey, toastController, wallet?.adapter.icon]);

    return (
        <>
            <StyledListBox
                value={selectedOption}
                itemTemplate={SolanaItemTemplate}
                onChange={async (e) => {
                    try {
                        if (!e.value) {
                            return;
                        }
                        if (e.value.readyState == WalletReadyState.NotDetected) {
                            toastController?.showError("Wallet is not not detected: ");
                        }
                        if (e.value.readyState == WalletReadyState.Unsupported) {
                            toastController?.showError("Wallet is not unsupported: ");
                        }
                        toastController?.showInfo("Connecting", "Please accept connection in wallet");
                        await select(e.value.adapter.name);
                        await connect();
                        setSelectedOption(e.value);
                    } catch (error) {
                        Sentry.captureException(error, {
                            tags: { scenario: "connect_wallet" },
                            extra: { chain: { id: "solana" } },
                        });

                        if (error instanceof Error) {
                            toastController?.showError("Failed to connect: " + error.message);
                        } else {
                            toastController?.showError("Failed to connect: " + error);
                        }
                    }
                }}
                options={wallets}
                optionLabel="label"
            />
        </>
    );
}

export default SolanaWalletList;
