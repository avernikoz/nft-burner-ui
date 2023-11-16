import React, { FC, PropsWithChildren } from "react";
import { WalletProvider, SuiMainnetChain } from "@suiet/wallet-kit";

// Default styles that can be overridden by your app
require("@suiet/wallet-kit/style.css");

export const SuiWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;

    return <WalletProvider chains={[SuiMainnetChain]}>{children}</WalletProvider>;
};
