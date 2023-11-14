import React, { useContext, useEffect, useState } from "react";
import { ListBox } from "primereact/listbox";
import { useConnection, useWallet, Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { IAccount } from "../../types";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";
import SolanaItemTemplate from "./SolanaItemTemplate";
import { ToastContext } from "../../../ToastProvider/ToastProvider";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet, disconnect } = useWallet();
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
            <ListBox
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
                        setSelectedOption(e.value);
                    } catch (error) {
                        if (error instanceof Error) {
                            toastController?.showError("Failed to connect: " + error.message);
                        } else {
                            toastController?.showError("Failed to connect: " + error);
                        }
                    }
                }}
                options={wallets}
                listStyle={{ maxHeight: "330px" }}
                optionLabel="label"
            />
        </>
    );
}

export default SolanaWalletList;
