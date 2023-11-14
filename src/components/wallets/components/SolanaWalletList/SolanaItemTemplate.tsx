import { Wallet } from "@solana/wallet-adapter-react";
import React from "react";
import IconTemplate from "../../../IconTemplate/IconTemplate";
import { Item } from "../RainbowWalletList/RainbowWalletList.styled";

function SolanaItemTemplate(item: Wallet) {
    return (
        <Item className="flex align-items-center">
            <IconTemplate svgString={item.adapter.icon} />
            <div>{item.adapter.name}</div>
        </Item>
    );
}

export default SolanaItemTemplate;
