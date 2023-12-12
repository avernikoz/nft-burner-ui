import { JsonRpcSigner } from "ethers";
import { EvmNft } from "../utils/types";
import { ALCHEMY_MULTICHAIN_CLIENT_INSTANCE } from "../config/nft.config";

export async function handleEvmTransaction({
    nft,
    signer,
    burnerFee,
}: {
    nft: EvmNft;
    signer: JsonRpcSigner | undefined;
    burnerFee: number;
}) {
    if (!signer) {
        throw new Error("The EVM NFT was chosen, but the wallet is not connected.");
    }

    const payTransaction = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.pay({
        network: nft.evmNetworkType,
        amount: burnerFee,
    });
    await signer.sendTransaction(payTransaction);
    await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
        collection: {
            contractAddress: nft.contractAddress,
            contractType: nft.contractType,
        },
        nftTokenId: nft?.nftTokenId,
        owner: signer,
    });
}
