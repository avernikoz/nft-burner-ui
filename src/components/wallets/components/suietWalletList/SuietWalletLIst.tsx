import React, {useRef, useState} from "react";
import { Item } from "../rainbowWalletList/RainbowWalletList.styled";
import { ListBox } from "primereact/listbox";
import { useWallet } from "@suiet/wallet-kit";
import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import {Toast} from "primereact/toast";

function SuietWallet(): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet>();
    const wallet = useWallet();
    const toast = useRef<Toast>(null);

    const showDangerToast = () => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Wallet is not installed' });
    };

    const show = () => {
        toast.current?.show({
            severity: "info",
            summary: "Connecting",
            detail: "Please accept connection in wallet",
            icon: <i className="pi pi-spin pi-cog"></i>
        });
    };

    async function connect(chosenWallet: IWallet) {
        try {
            if (!chosenWallet.installed) {
                showDangerToast();
                return;
            }
            show();
            await wallet.select(chosenWallet.name);
            setSelectedOption(chosenWallet);
        } catch (error) {
            console.error('Failed to connect:', error);
            if (error instanceof Error) {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect: ' + error.message });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect: ' + error });
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
            <Toast ref={toast}  position="top-left"/>
            <ListBox
                value={selectedOption}
                itemTemplate={itemTemplate}
                onChange={async (e) => {
                    connect(e.value)
                }}
                listStyle={{ maxHeight: '310px' }}
                options={wallet.configuredWallets}
                optionLabel="name"
            />
        </>
    );
}

export default SuietWallet;
