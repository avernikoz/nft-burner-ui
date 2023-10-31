import {ConnectModal} from "@suiet/wallet-kit";
import {Button} from "primereact/button";
import React, {useRef, useState} from "react";
import {useConnectModal} from "@rainbow-me/rainbowkit";
import {EVMWalletContext} from "../../context/EVMWalletContext";
import {SuiWalletContext} from "../../context/SuiWalletContext";
import {SolanaWalletContext} from "../../context/SolanaWalletContext";
import {Menu} from "primereact/menu";
// eslint-disable-next-line import/no-unresolved
import {MenuItem} from "primereact/menuitem";
import {ReactComponent as SuietLogo} from './suietLogo.svg';
import {ReactComponent as SolanaLogo} from './solana.svg';
import {ReactComponent as RainbowLogo} from './rainbow.svg';
import {PanelMenu} from "primereact/panelmenu";

function Wallets() {
    const menuRight = useRef<Menu>(null);
    const [showModal, setShowModal] = useState(false)

    const {openConnectModal} = useConnectModal();

    const items: MenuItem[] = [
        {
            label: "Choose wallet",
            icon: "pi pi-wallet",
            style:{
                backgroundColor:"primary",
                color:"white"
            },
            items: [
                {
                    label: "Suiet",
                    icon: <SuietLogo width={30} height={30} style={{marginRight: '5px'}}/>,
                    command: () => {
                        setShowModal(true);
                    },

                },
                {
                    label: "Rainbow",
                    icon: <RainbowLogo width={30} height={30} style={{marginRight: '5px'}}/>,
                    command: () => {
                        if (openConnectModal) {
                            openConnectModal()
                        }
                    },

                },
                {
                    label: "Solana",
                    icon: <SolanaLogo width={30} height={30} style={{marginRight: '5px'}}/>,
                    command: () => {
                    },
                },
            ],
        },
    ];

    return (
        <div className="wallet">
            <p>
                <SolanaWalletContext>
                    <SuiWalletContext>
                        <EVMWalletContext>
                            {/*<div className="button-control">*/}
                            {/*    <label>Solana</label>*/}
                            {/*    <WalletMultiButton/>*/}
                            {/*    <WalletDisconnectButton/>*/}
                            {/*    <label>Rainbow</label>*/}
                            {/*    <RainbowConnectButton/>*/}
                            {/*</div>*/}
                            <div className="card flex justify-content-center">
                                <Menu
                                    model={items}
                                    popup
                                    ref={menuRight}
                                    id="popup_menu_right"
                                    popupAlignment="right"
                                />
                                <Button
                                    label="Choose your wallet"
                                    icon="pi pi-wallet"
                                    className="mr-2"
                                    onClick={(event) => menuRight.current?.toggle(event)}
                                    aria-controls="popup_menu_right"
                                    aria-haspopup
                                />
                            </div>
                            <PanelMenu model={items} className="w-full md:w-25rem" color={"primary"}/>
                            <ConnectModal
                                open={showModal}
                                onOpenChange={(open) => setShowModal(open)}
                            >
                            </ConnectModal>
                        </EVMWalletContext>
                    </SuiWalletContext>
                </SolanaWalletContext>
                `
            </p>
        </div>
    );
}

export default Wallets;
