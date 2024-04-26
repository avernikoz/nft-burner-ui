import { isTransactionSuccessful } from "./utils";
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";

export async function executeSuccessBurnSuiNft(result: SuiSignAndExecuteTransactionBlockOutput) {
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
