import { INft, SolanaCNft, SolanaNft } from "./types";

/**
 * Filters out compact NFTs (CNFTs) that are already present in the base NFT list.
 *
 * @param {INft[]} baseNftList - The list of regular NFTs.
 * @param {INft[]} cnftList - The list of compact NFTs (CNFTs) to be filtered.
 * @returns {INft[]} - The filtered list containing unique NFTs from the base list and CNFTs.
 */
export function filterOutCNFTDuplicates(baseNftList: SolanaNft[], cnftList: SolanaCNft[]): INft[] {
    const baseNftIdSet = new Set(baseNftList.map((nft) => nft.nftId));
    const filteredCNFTs = cnftList.filter((cnft) => !baseNftIdSet.has(cnft.nftId));

    return filteredCNFTs;
}
