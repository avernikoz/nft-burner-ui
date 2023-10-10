import "@rainbow-me/rainbowkit/styles.css";

import React, { FC, PropsWithChildren } from "react";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, zora } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

if (typeof process.env.REACT_APP_ALCHEMY_ID !== "string" || process.env.REACT_APP_ALCHEMY_ID.length === 0) {
    throw new Error("Empty REACT_APP_ALCHEMY_ID");
}

if (
    typeof process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID !== "string" ||
    process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID.length === 0
) {
    throw new Error("Empty REACT_APP_WALLET_CONNECT_PROJECT_ID");
}

const { chains, publicClient } = configureChains(
    [mainnet, polygon, optimism, arbitrum, base, zora],
    [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_ID }), publicProvider()],
);

const { connectors } = getDefaultWallets({
    appName: "Burner",
    projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
    chains,
});

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
});

export const EVMWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;

    return (
        <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
        </WagmiConfig>
    );
};
