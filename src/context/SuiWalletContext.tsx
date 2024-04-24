import React, { FC, PropsWithChildren } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import { createNetworkConfig, SuiClientProvider, WalletProvider as SuiWalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
// eslint-disable-next-line import/no-extraneous-dependencies
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Default styles that can be overridden by your app
require("@mysten/dapp-kit/dist/index.css");

export const SuiWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;
    const { networkConfig } = createNetworkConfig({
        mainnet: { url: getFullnodeUrl("mainnet") },
    });
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
                <SuiWalletProvider
                    autoConnect={false}
                    zkSend={{
                        name: "Nft burner",
                    }}
                    preferredWallets={["zkSend"]}
                >
                    {children}
                </SuiWalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
};
