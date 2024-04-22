// import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { Item } from "../RainbowWalletList/RainbowWalletList.styled";
import React from "react";
import { IWallet } from "@suiet/wallet-kit";

function SuiItemTemplate(item: IWallet) {
    return (
        <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
            <img src={item.iconUrl} width={24} height={24} alt={item.name} />
            <div>{item.label}</div>
        </Item>
    );
}

export default SuiItemTemplate;
