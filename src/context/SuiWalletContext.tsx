import React, { FC, PropsWithChildren } from "react";
import { WalletProvider, SuiMainnetChain } from "@suiet/wallet-kit";
// eslint-disable-next-line import/no-extraneous-dependencies
import { createNetworkConfig, SuiClientProvider, WalletProvider as SuiWalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
// eslint-disable-next-line import/no-extraneous-dependencies
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// import { registerZkSendWallet } from "@mysten/zksend";
// Default styles that can be overridden by your app
require("@suiet/wallet-kit/style.css");

export const SuiWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;
    const { networkConfig } = createNetworkConfig({
        mainnet: { url: getFullnodeUrl("mainnet") },
    });
    const queryClient = new QueryClient();

    // <WalletProvider chains={[SuiMainnetChain]} autoConnect={false}>
    //     {children}
    // </WalletProvider>
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
                <SuiWalletProvider
                    autoConnect={false}
                    zkSend={{
                        name: "Nft burner",
                    }}
                >
                    <WalletProvider chains={[SuiMainnetChain]} autoConnect={false}>
                        {children}
                    </WalletProvider>
                </SuiWalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
};
