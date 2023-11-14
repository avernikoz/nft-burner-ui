import { Item } from "./RainbowWalletList.styled";
import React from "react";

import { IWallet } from "../../types";

function RainbowItemTemplate(item: IWallet) {
    return (
        <Item className="flex align-items-center" style={{ flexDirection: "row" }}>
            {item.logo}
            <div>{item.label}</div>
        </Item>
    );
}

export default RainbowItemTemplate;
