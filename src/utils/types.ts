import { ALLOWED_EVM_CHAINS } from "@avernikoz/nft-sdk/dist/networks/evm/common";
import { Signer } from "ethers";

export interface INft {
    id?: number;
    name: string;
    logoURI: string;

    contractAddress?: string;
    contractType?: string;
    nftTokenId?: string;
    owner?: Signer;
    evm?: ALLOWED_EVM_CHAINS;
}
