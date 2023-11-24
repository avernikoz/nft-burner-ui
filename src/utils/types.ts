import { PublicKey } from "@solana/web3.js";
import { Signer } from "ethers";

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum ALLOWED_EVM_CHAINS {
    Ethereum = "Ethereum",
    Polygon = "Polygon",
    Optimism = "Optimism",
    Arbitrum = "Arbitrum",
}

export enum ENftBurnStatus {
    BURNED = "burned",
    SELECTED = "selected",
    EPMTY = "empty",
}

export interface INft {
    id?: number;
    name: string;
    logoURI: string;

    contractAddress?: string;
    contractType?: string;
    nftTokenId?: string;
    owner?: Signer;
    evm?: ALLOWED_EVM_CHAINS;

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
