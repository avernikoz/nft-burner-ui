import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

/**
 * Gets the chain ID of the EVM network based on the provided network name.
 *
 * @param {ALLOWED_NETWORKS} networkName - The name of the EVM network.
 * @returns {number | undefined} The chain ID of the EVM network or null if the network name is not recognized.
 */
export function getChainIdByEVMNetworkName(networkName: ALLOWED_NETWORKS): number | undefined {
    switch (networkName) {
        case ALLOWED_NETWORKS.Ethereum:
            return 1;
        case ALLOWED_NETWORKS.Polygon:
            return 137;
        case ALLOWED_NETWORKS.Arbitrum:
            return 42161;
        case ALLOWED_NETWORKS.Optimism:
            return 10;
    }
}
