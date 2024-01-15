import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

/**
 * Gets the name of the EVM network based on the provided chain ID.
 *
 * @param {number} chainId - The chain ID of the EVM network.
 * @returns {ALLOWED_NETWORKS | undefined} The name of the EVM network or undefined if not recognized.
 */
export function getEVMNetworkName(chainId: number): ALLOWED_NETWORKS | undefined {
    switch (chainId) {
        case 1:
            return ALLOWED_NETWORKS.Ethereum;
        case 137:
            return ALLOWED_NETWORKS.Polygon;
        case 42161:
            return ALLOWED_NETWORKS.Arbitrum;
        case 10:
            return ALLOWED_NETWORKS.Optimism;
    }
}
