// import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { Item } from "../RainbowWalletList/RainbowWalletList.styled";
import React from "react";
import { WalletWithRequiredFeatures } from "@mysten/wallet-standard";

function SuiItemTemplate(item: WalletWithRequiredFeatures) {
    return (
        <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
            <img src={item.icon} width={24} height={24} alt={item.name} />
            <div>{item.name}</div>
        </Item>
    );
}

export default SuiItemTemplate;
