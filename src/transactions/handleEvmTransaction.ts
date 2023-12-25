import { JsonRpcSigner } from "ethers";
import { ALCHEMY_MULTICHAIN_CLIENT_INSTANCE } from "../config/nft.config";
import { EvmNft } from "../utils/types";
import { handleTransactionResult, sendAndCheckTransaction } from "./utils";

export async function handleEvmPayTransaction({
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

    const payResult = await sendAndCheckTransaction({ signer, transaction: payTransaction });

    return payResult;
}

export async function handleEvmBurnTransaction({ nft, signer }: { nft: EvmNft; signer: JsonRpcSigner | undefined }) {
    if (!signer) {
        throw new Error("The EVM NFT was chosen, but the wallet is not connected.");
    }

    const burnResultRaw = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
        collection: {
            contractAddress: nft.contractAddress,
            contractType: nft.contractType,
        },
        nftTokenId: nft?.nftTokenId,
        owner: signer,
    });

    const burnResult = await handleTransactionResult(burnResultRaw);

    return burnResult;
}
