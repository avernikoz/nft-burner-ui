import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    Coin98WalletAdapter,
    CoinbaseWalletAdapter,
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TrustWalletAdapter,
    UnsafeBurnerWalletAdapter,
    WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import React, { FC, PropsWithChildren, useMemo } from "react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export const SolanaWalletContext: FC<PropsWithChildren> = (props) => {
    const { children } = props;
    const network = WalletAdapterNetwork.Mainnet;
    // TODO ASAP IMPORTANT: Add custom RPC
    const endpoint = "https://solana-mainnet.rpc.extrnode.com";

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile IWallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana IWallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new LedgerWalletAdapter(),
            new WalletConnectWalletAdapter({ network, options: {} }),
            new CoinbaseWalletAdapter(),
            new TrustWalletAdapter(),
            new Coin98WalletAdapter(),
            new UnsafeBurnerWalletAdapter(),
        ],
        [network],
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
