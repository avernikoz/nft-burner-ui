import React, {useEffect, useRef, useState} from "react";
import { ListBox } from "primereact/listbox";
import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import SVGTemplate from "../../../SVGTemplate/SVGTemplate";
import { Item } from "../rainbowWalletList/RainbowWalletList.styled";
import { Toast } from "primereact/toast";
import {WalletReadyState} from "@solana/wallet-adapter-base";

function SolanaWalletList(): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected } = useWallet();
    const toast = useRef<Toast>(null);
    //
    // const walletss = [
    //     {
    //         wallet: PhantomWalletAdapter,
    //         icon: <Phantom width={30} height={30} style={{ marginRight: "5px" }} />,
    //     },
    //     {
    //         wallet: CoinbaseWalletAdapter,
    //         icon: <Phantom width={30} height={30} style={{ marginRight: "5px" }} />,
    //     },
    // ];

    useEffect(()=>{
        console.log(connected)
    },[connected])

    const itemTemplate = (item: Wallet) => {
        return (
            <Item className="flex align-items-center">
                <SVGTemplate svgString={item.adapter.icon} />
                <div>{item.adapter.name}</div>
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
                    try {
                        console.log(e.value)
                        if (!e.value){
                            return
                        }
                        if (e.value.readyState == WalletReadyState.NotDetected) {
                            toast.current?.show({
                                severity: "error",
                                summary: "Error",
                                detail: "Wallet is not not detected: ",
                            });
                        }
                        if (e.value.readyState == WalletReadyState.Unsupported) {
                            toast.current?.show({
                                severity: "error",
                                summary: "Error",
                                detail: "Wallet is not unsupported: ",
                            });
                        }
                        toast.current?.show({
                            severity: "info",
                            summary: "Connecting",
                            detail: "Please waiting",
                            icon: <i className="pi pi-spin pi-cog"></i>
                        });
                        await e.value.adapter.connect();
                        setSelectedOption(e.value);
                    }catch (error) {
                        console.error('Failed to connect:', error);
                        if (error instanceof Error) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect: ' + error.message });
                        } else {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect: ' + error });
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
