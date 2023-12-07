import "@rainbow-me/rainbowkit/styles.css";

import React, { FC, PropsWithChildren } from "react";
import { connectorsForWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { coinbaseWallet, metaMaskWallet, phantomWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";

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
    [mainnet, polygon, optimism, arbitrum],
    [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_ID }), publicProvider()],
);

const connectors = connectorsForWallets([
    {
        groupName: "My Wallets",
        wallets: [
            metaMaskWallet({
                projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
                chains: [mainnet, polygon, arbitrum, optimism],
            }),
            coinbaseWallet({ appName: "My RainbowKit App", chains: [mainnet, polygon, arbitrum, optimism] }),
            phantomWallet({ chains: [mainnet, polygon, arbitrum, optimism] }),
            walletConnectWallet({
                chains: [mainnet, polygon, arbitrum, optimism],
                projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
            }),
        ],
    },
])();

const wagmiConfig = createConfig({
    //autoConnect: true,
    connectors,
    publicClient,
});

export const EVMWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;

    return (
        <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains} theme={null}>
                {children}
            </RainbowKitProvider>
        </WagmiConfig>
    );
};
