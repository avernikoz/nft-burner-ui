import React, { useEffect, useRef, useState } from "react";
import { Item } from "../rainbowWalletList/RainbowWalletList.styled";
import { ListBox } from "primereact/listbox";
import { useAccountBalance, useWallet } from "@suiet/wallet-kit";
import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { Toast } from "primereact/toast";
import { IAccount } from "../../models";
function SuietWallet(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet | null>(null);
    const wallet = useWallet();
    const toast = useRef<Toast>(null);
    const { loading, balance } = useAccountBalance();

    const showDangerToast = () => {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Wallet is not installed" });
    };

    const show = () => {
        toast.current?.show({
            severity: "info",
            summary: "Connecting",
            detail: "Please accept connection in wallet",
            icon: <i className="pi pi-spin pi-cog"></i>,
        });
    };

    useEffect(() => {
        if (wallet.connected && !loading) {
            if (balance === undefined) {
                return;
            }
            props.connect({
                id: wallet.account?.address,
                balance: balance.toString(),
                walletIcon: wallet.adapter?.icon,
            });
        }
    }, [wallet.connected, loading, balance]);

    async function connect(chosenWallet: IWallet) {
        try {
            if (!chosenWallet) {
                return;
            }
            if (!chosenWallet.installed) {
                showDangerToast();
                return;
            }
            show();
            await wallet.select(chosenWallet.name);
            setSelectedOption(chosenWallet);
        } catch (err) {
            console.error("Failed to connect:", err);
            if (err instanceof Error) {
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to connect: " + err.message,
                });
            } else {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to connect: " + err });
            }
        }
    }

    const itemTemplate = (item: IWallet) => {
        return (
            <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
                <img src={item.iconUrl} width={30} height={30} alt={item.name} />
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
                    console.log(e);
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
