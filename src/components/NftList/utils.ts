import { arbitrum, optimism, polygon } from "viem/chains";
import { evm } from "@avernikoz/nft-sdk";

export const getChainName = (chainId: number | undefined) => {
    let chainName: evm.ALLOWED_EVM_CHAINS = evm.ALLOWED_EVM_CHAINS.Ethereum;
    switch (chainId) {
        case polygon.id:
            chainName = evm.ALLOWED_EVM_CHAINS.Polygon;
            break;
        case optimism.id:
            chainName = evm.ALLOWED_EVM_CHAINS.Optimism;
            break;
        case arbitrum.id:
            chainName = evm.ALLOWED_EVM_CHAINS.Arbitrum;
            break;
    }

    return chainName;
};
