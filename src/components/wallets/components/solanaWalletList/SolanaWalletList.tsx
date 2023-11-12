import React, { useEffect, useRef, useState } from "react";
import { ListBox } from "primereact/listbox";
import { useConnection, useWallet, Wallet } from "@solana/wallet-adapter-react";
import { Toast } from "primereact/toast";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { IAccount } from "../../types";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";
import SolanaItemTemplate from "./SolanaItemTemplate";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet, disconnect } = useWallet();
    const toast = useRef<Toast>(null);
    const { connection } = useConnection();


    useEffect(() => {
        if (connected && publicKey) {
            connection.getBalance(new PublicKey(publicKey)).then((balance) => {
                const balanceInSOL = ethers.formatUnits(balance, 9).substring(0, 5);
                props.connect({
                    id: publicKey?.toString(),
                    balance: balanceInSOL + " SOL",
                    walletIcon: wallet?.adapter.icon,
                });
            },
                (err)=>{
                    disconnect();
                    showError("Trouble with balance: " + err.message);
                }
                );
        }
    }, [connected, connection, props, publicKey, wallet?.adapter.icon]);

    const showError = (message: string) => {
        toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: message,
        });
    };

    return (
        <>
            <Toast ref={toast} position="top-left" />
            <ListBox
                value={selectedOption}
                itemTemplate={SolanaItemTemplate}
                onChange={async (e) => {
                    try {
                        if (!e.value) {
                            return;
                        }
                        if (e.value.readyState == WalletReadyState.NotDetected) {
                            showError("Wallet is not not detected: ");
                        }
                        if (e.value.readyState == WalletReadyState.Unsupported) {
                            showError("Wallet is not unsupported: ");
                        }
                        toast.current?.show({
                            severity: "info",
                            summary: "Connecting",
                            detail: "Please waiting",
                            icon: <i className="pi pi-spin pi-cog"></i>,
                        });
                        await select(e.value.adapter.name);
                        setSelectedOption(e.value);
                    } catch (error) {
                        if (error instanceof Error) {
                            showError("Failed to connect: " + error.message);
                        } else {
                            showError("Failed to connect: " + error);
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
