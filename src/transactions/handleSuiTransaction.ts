import { WalletContextState } from "@suiet/wallet-kit";
import { SUI_NFT_CLIENT_INSTANCE } from "../config/nft.config";
import { SuiNft } from "../utils/types";
import { isTransactionSuccessful } from "./utils";

export async function handleSuiTransaction({
    nft,
    burnerFee,
    signAndExecuteTransactionBlock,
}: {
    nft: SuiNft;
    signAndExecuteTransactionBlock: WalletContextState["signAndExecuteTransactionBlock"];
    burnerFee: number;
}) {
    const payRes = await SUI_NFT_CLIENT_INSTANCE.pay({ amount: burnerFee });
    const burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNFT({
        nft: nft,
        transaction: payRes.transaction,
    });
    const result = await signAndExecuteTransactionBlock({
        transactionBlock: burnRes.transaction,
    });

    const transactionStatus = isTransactionSuccessful(result);

    if (!transactionStatus) {
        const errorMessage =
            result.errors && result.errors.length ? JSON.stringify(result.errors.map((el) => el)) : "Unknown error";
        throw new Error(`Transaction failed: ${errorMessage}`);
    }

    return result;
}
