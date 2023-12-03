import React, { useContext, useEffect, useState } from "react";
import { ListBox } from "primereact/listbox";
import { useAccountBalance, useWallet } from "@suiet/wallet-kit";
import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { IAccount } from "../../types";
import { ethers } from "ethers";
import SuiItemTemplate from "./SuiItemTemplate";
import { ToastContext } from "../../../ToastProvider/ToastProvider";

function SuietWallet(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet | null>(null);
    const wallet = useWallet();
    const { error, loading, balance } = useAccountBalance();
    const toastController = useContext(ToastContext);

    useEffect(() => {
        if (balance === undefined) {
            return;
        }
        if (wallet.connected && !loading && error == null) {
            const balanceInSUI = ethers.formatUnits(balance, 9).substring(0, 5);
            console.log(balanceInSUI);
            console.log(balance);
            props.connect({
                id: wallet.account?.address,
                balance: balanceInSUI + " SUI",
                walletIcon: wallet.adapter?.icon,
            });
        }
        if (error) {
            toastController?.showError("Failed to fetch balances: " + error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.connected, balance, wallet.account?.address, wallet.adapter?.icon, loading, error]);

    async function connect(chosenWallet: IWallet) {
        try {
            if (!chosenWallet) {
                return;
            }
            if (!chosenWallet.installed) {
                toastController?.showError("Wallet is not installed");
                return;
            }
            toastController?.showInfo("Connecting", "Please accept connection in wallet");
            await wallet.select(chosenWallet.name);
            setSelectedOption(chosenWallet);
        } catch (err) {
            if (err instanceof Error) {
                toastController?.showError("Failed to connect: " + err.message);
            } else {
                toastController?.showError("Failed to connect: " + err);
            }
        }
    }

    return (
        <>
            <ListBox
                value={selectedOption}
                itemTemplate={SuiItemTemplate}
                onChange={async (e) => {
                    connect(e.value);
                }}
                listStyle={{ maxHeight: "310px" }}
                options={wallet.configuredWallets}
                optionLabel="name"
            />
        </>
    );
}

export default SuietWallet;
