import { ALLOWED_EVM_CHAINS, ALLOWED_NETWORKS, NFTContractStandard } from "@avernikoz/nft-sdk";
import { PublicKey } from "@solana/web3.js";

export enum ENftBurnStatus {
    BURNED_ONCHAIN = "burned",
    SELECTED = "selected",
    EMPTY = "empty",
}

// Base interface with properties common to all networks
export interface BaseNft {
    id: number;
    name: string;
    logoURI: string;
    network: ALLOWED_NETWORKS;
}

// Interface for Solana network
export interface SolanaNft extends BaseNft {
    solanaAccount: {
        metadataAccount: PublicKey;
        mint: PublicKey;
        tokenAccount: PublicKey;
        masterEditionPDA: PublicKey;
        collectionMetadata: PublicKey | undefined;
        isMasterEdition: boolean;
    };
}

// Interface for Sui network
export interface SuiNft extends BaseNft {
    nftId: string;
    kioskId: string;
    nftType: string;
}

// Interface for EVM networks
export interface EvmNft extends BaseNft {
    contractAddress: string;
    contractType: NFTContractStandard;
    nftTokenId: string;
    evmNetworkType: ALLOWED_EVM_CHAINS;
}

// Combined interface for NFT, including properties from all networks
export type INft = SolanaNft | SuiNft | EvmNft;
