import { arbitrum, optimism, polygon } from "viem/chains";
import { NFTContractStandard, ALLOWED_EVM_CHAINS } from "@avernikoz/nft-sdk";
import { NftTokenType } from "alchemy-sdk";

export const getChainName = (chainId: number | undefined) => {
    let chainName: ALLOWED_EVM_CHAINS = ALLOWED_EVM_CHAINS.Ethereum;
    switch (chainId) {
        case polygon.id:
            chainName = ALLOWED_EVM_CHAINS.Polygon;
            break;
        case optimism.id:
            chainName = ALLOWED_EVM_CHAINS.Optimism;
            break;
        case arbitrum.id:
            chainName = ALLOWED_EVM_CHAINS.Arbitrum;
            break;
    }

    return chainName;
};

// Function to check if a variable is of type NFTContractStandard
export function isNFTContractStandard(value: unknown): value is NFTContractStandard {
    return typeof value === "string" && (value === NFTContractStandard.ERC1155 || value === NFTContractStandard.ERC721);
}

// Function to map NftTokenType to NFTContractStandard
export function mapNftTokenTypeToContractStandard(tokenType: string | NftTokenType): NFTContractStandard | null {
    switch (tokenType) {
        case NftTokenType.ERC1155:
            return NFTContractStandard.ERC1155;
        case NftTokenType.ERC721:
            return NFTContractStandard.ERC721;
        default:
            return null; // Handle other cases or return null if not mappable
    }
}

export const getItemSize = (parentSizeWidth: number) => {
    const paddingRatio = 0.0327868852459016;
    const paddingSizePx = parentSizeWidth * paddingRatio;
    const itemRatio = (1 - paddingRatio * 3) / 4;
    const itemSizePx = parentSizeWidth * itemRatio;

    return { itemSize: itemSizePx, paddingSize: paddingSizePx };
};

export const getRowCount = (itemsList: unknown[]): number => {
    const itemsCount = itemsList.length;

    // If items are less than 16, return 4 rows
    if (itemsCount <= 16) {
        return 4;
    }

    // Otherwise, calculate the number of rows needed to accommodate all items
    // We add 3 to itemsCount before dividing by 4 to handle any remainder
    const rows = Math.floor((itemsCount + 3) / 4);

    return rows;
};
