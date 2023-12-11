import { ALLOWED_NETWORKS, evm } from "@avernikoz/nft-sdk";
import { PublicKey } from "@solana/web3.js";
import { Signer } from "ethers";

export enum ENftBurnStatus {
    BURNED = "burned",
    SELECTED = "selected",
    EPMTY = "empty",
}

export interface INft {
    id: number;
    name: string;
    logoURI: string;

    network: ALLOWED_NETWORKS;

    contractAddress?: string;
    contractType?: string;
    nftTokenId?: string;
    owner?: Signer;
    evm?: evm.ALLOWED_EVM_CHAINS;

    nftId?: string;
    kioskId?: string;
    nftType?: string;

    solanaAccount?: {
        metadataAccount: PublicKey;
        mint: PublicKey;
        tokenAccount: PublicKey;
        masterEditionPDA: PublicKey;
        collectionMetadata: PublicKey | undefined;
        isMasterEdition: boolean;
    };
}
