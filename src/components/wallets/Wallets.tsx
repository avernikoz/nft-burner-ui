import { Button } from "primereact/button";
import React, { useState } from "react";
// eslint-disable-next-line import/no-unresolved
import { ReactComponent as SuietLogo } from "./assets/suietLogo.svg";
import { ReactComponent as SolanaLogo } from "./assets/solana.svg";
import { ReactComponent as RainbowLogo } from "./assets/rainbow.svg";
import { TabMenu } from "primereact/tabmenu";
import RainbowWalletList from "./components/rainbowWalletList/RainbowWalletList";
import SuietWalletLIst from "./components/suietWalletList/SuietWalletLIst";
import SolanaWalletList from "./components/solanaWalletList/SolanaWalletList";
import { SuiWalletContext } from "../../context/SuiWalletContext";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { PanelMenu } from "primereact/panelmenu";
import {ButtonContainer, ProfileLabel, StyledDialog} from "./Wallets.styled";

function Wallets() {
    const [visible, setVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const items = [
        {
            label: "Suiet",
            icon: <SuietLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(0);
            },
            list: <SuietWalletLIst />,
        },
        {
            label: "Rainbow",
            icon: <RainbowLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(1);
            },
            list: <RainbowWalletList />,
        },
        {
            label: "Solana",
            icon: <SolanaLogo width={30} height={30} style={{ marginRight: "5px" }} />,
            command: () => {
                setActiveIndex(2);
            },
            list: <SolanaWalletList />,
        },
    ];

    const menuItems: MenuItem[] = [
        {
            label: "Choose connection",
            icon: "pi pi-spin pi-compass",
            style: {
                backgroundColor: "primary",
                color: "white",
            },
            items: items,
        },
    ];

    return (
        <div className="wallet">
            <SolanaWalletContext>
                <SuiWalletContext>
                    <ButtonContainer>
                        <div>{items[activeIndex].icon}</div>
                        <PanelMenu model={menuItems} className="w-full md:w-25rem" color={"primary"} />
                        <Button
                            aria-label="Choose your wallet"
                            rounded
                            icon="pi pi-wallet"
                            onClick={() => setVisible(true)}
                        />
                        <ProfileLabel className="label">
                            <RainbowLogo className='icon'/>
                            <div className="content">
                                <span className="balance">256$</span>
                                <span className="chain-id">488x5sf4a9wd5a6s</span>
                            </div>
                        </ProfileLabel>
                    </ButtonContainer>
                    <StyledDialog
                        header="Choose your wallet"
                        visible={visible}
                        style={{ width: "30vw", height: "500px" }}
                        onHide={() => setVisible(false)}
                    >
                        <TabMenu
                            model={items}
                            activeIndex={activeIndex}
                            style={{ width: "90%", margin: "0 auto" }}
                            onTabChange={(e) => setActiveIndex(e.index)}
                        />
                        <div>{items[activeIndex].list}</div>
                    </StyledDialog>
                </SuiWalletContext>
            </SolanaWalletContext>
        </div>
    );
}

export default Wallets;
