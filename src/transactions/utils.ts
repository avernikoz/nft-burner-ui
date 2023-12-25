import {
    ContractTransactionResponse,
    JsonRpcSigner,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,
} from "ethers";

import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";

export const isTransactionSuccessful = (transactionResponse: SuiSignAndExecuteTransactionBlockOutput): boolean => {
    return !!(transactionResponse.effects && transactionResponse.effects.status.status === "success");
};

interface SendAndCheckTransactionInput {
    signer: JsonRpcSigner;
    transaction: TransactionRequest;
    confirmations?: number;
}

export async function handleTransactionResult(
    transactionResult: TransactionResponse | ContractTransactionResponse,
    confirmations: number = 6,
): Promise<string> {
    // Get the transaction receipt
    const receipt: TransactionReceipt | null = await transactionResult.wait(confirmations);

    // Check if the receipt is null
    if (receipt === null) {
        throw new Error("Transaction not yet mined. Please wait for it to be mined.");
    }

    // Check if the transaction was successful
    if (receipt.status !== 1) {
        throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    // Return the block hash of the successful transaction
    return receipt.blockHash;
}

export async function sendAndCheckTransaction({
    signer,
    transaction,
    confirmations = 6,
}: SendAndCheckTransactionInput): Promise<string> {
    // Send the transaction
    const transactionResult = await signer.sendTransaction(transaction);

    return handleTransactionResult(transactionResult, confirmations);
}
