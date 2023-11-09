import React, { useEffect, useRef, useState } from "react";
import { ListBox } from "primereact/listbox";
import { useConnection, useWallet, Wallet } from "@solana/wallet-adapter-react";
import IconTemplate from "../../../IconTemplate/IconTemplate";
import { Item } from "../rainbowWalletList/RainbowWalletList.styled";
import { Toast } from "primereact/toast";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { IAccount } from "../../models";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet } = useWallet();
    const toast = useRef<Toast>(null);
    const { connection } = useConnection();

    const itemTemplate = (item: Wallet) => {
        return (
            <Item className="flex align-items-center">
                <IconTemplate svgString={item.adapter.icon} />
                <div>{item.adapter.name}</div>
            </Item>
        );
    };

    useEffect(() => {
        console.log(connected, publicKey);
        if (connected && publicKey) {
            connection.getBalance(new PublicKey(publicKey)).then((balance) => {
                const balanceInSUI = ethers.formatUnits(balance, 9).substring(0, 5);
                props.connect({
                    id: publicKey?.toString(),
                    balance: balanceInSUI + " SOL",
                    walletIcon: wallet?.adapter.icon,
                });
            });
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
                itemTemplate={itemTemplate}
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
