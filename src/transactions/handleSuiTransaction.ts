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
    burnerFee: number;
    signAndExecuteTransactionBlock: WalletContextState["signAndExecuteTransactionBlock"];
}) {
    const payRes = await SUI_NFT_CLIENT_INSTANCE.pay({ amount: burnerFee });

    let burnRes;
    // Assuming it's OB standard & nft is in kiosk
    if ("kioskId" in nft && nft.kioskId !== undefined) {
        const { kioskId } = nft;
        burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNFT({
            nft: { kioskId, nftId: nft.id, nftType: nft.nftType },
            transaction: payRes.transaction,
        });
    } else {
        // Assuming it's Bluemove standard & nft is not in kiosk
        burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNonKioskBluemoveNFT({
            nft: nft,
            transaction: payRes.transaction,
        });
    }

    const result = await signAndExecuteTransactionBlock({
        transactionBlock: burnRes.transaction,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
    });
    console.debug("result: ", result);

    const transactionStatus = isTransactionSuccessful(result);
    console.debug("transactionStatus: ", transactionStatus);

    if (!transactionStatus) {
        const possibleTransactionErrorMessage =
            result.errors && result.errors.length !== 0 && JSON.stringify(result.errors.map((el) => el));
        const possibleEffectedErrorMessage = result.effects?.status.error;

        const errorMessage = possibleTransactionErrorMessage || possibleEffectedErrorMessage || "Unknown error";
        throw new Error(`Transaction failed: ${errorMessage}`);
    }

    return result;
}
