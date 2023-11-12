import {IWallet} from "@suiet/wallet-kit/dist/types/wallet";
import {Item} from "../rainbowWalletList/RainbowWalletList.styled";
import React from "react";

function SuiItemTemplate (item: IWallet) {
    return (
        <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
            <img src={item.iconUrl} width={30} height={30} alt={item.name} />
            <div>{item.label}</div>
        </Item>
    );
};

export default  SuiItemTemplate;
