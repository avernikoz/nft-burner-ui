import { Signer } from "ethers";

export interface INft {
    id?: number;
    name: string;
    logoURI: string;

    contractAddress?: string;
    contractType?: string;
    nftTokenId?: string;
    owner?: Signer;
}
