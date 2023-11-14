import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, metaMaskWallet, phantomWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { arbitrum, mainnet, optimism, polygon } from "wagmi/chains";

const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;

if (typeof projectId !== "string" || projectId.length === 0) {
    throw new Error("Empty REACT_APP_WALLET_CONNECT_PROJECT_ID");
}

const connectors = connectorsForWallets([
    {
        groupName: "My Wallets",
        wallets: [
            metaMaskWallet({ projectId, chains: [mainnet, polygon, arbitrum, optimism] }),
            coinbaseWallet({ appName: "My RainbowKit App", chains: [mainnet, polygon, arbitrum, optimism] }),
            phantomWallet({ chains: [mainnet, polygon, arbitrum, optimism] }),
            walletConnectWallet({ chains: [mainnet, polygon, arbitrum, optimism], projectId }),
        ],
    },
])();

export default connectors;
