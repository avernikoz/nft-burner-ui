import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

export const getNetworkTokenSymbol = (network: ALLOWED_NETWORKS): string => {
    switch (network) {
        case ALLOWED_NETWORKS.Solana:
            return "SOL";
        case ALLOWED_NETWORKS.Sui:
            return "SUI";
        case ALLOWED_NETWORKS.Ethereum:
        case ALLOWED_NETWORKS.Optimism:
        case ALLOWED_NETWORKS.Arbitrum:
            return "ETH";
        case ALLOWED_NETWORKS.Polygon:
            return "MATIC";
        default:
            return "UNKNOWN";
    }
};
