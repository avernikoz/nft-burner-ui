import { Connection } from "@solana/web3.js";
import { SOLANA_NFT_CLIENT_INSTANCE } from "../config/nft.config";
import { SolanaNft } from "../utils/types";
import { WalletContextState } from "@solana/wallet-adapter-react";

export async function handleSolanaTransaction({
    nft,
    solanaWallet,
    burnerFee,
    solanaConnection,
}: {
    nft: SolanaNft;
    solanaWallet: WalletContextState;
    solanaConnection: Connection;
    burnerFee: number;
}) {
    if (!solanaWallet.publicKey) {
        throw new Error("The Solana NFT was chosen, but the wallet is not connected.");
    }

    const payRes = await SOLANA_NFT_CLIENT_INSTANCE.pay({
        amount: burnerFee,
        owner: solanaWallet.publicKey,
    });
    const burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnNFT({
        owner: solanaWallet.publicKey,
        nft: nft.solanaAccount,
        transaction: payRes,
    });

    const result = await solanaWallet.sendTransaction(burnRes, solanaConnection);
    const { value } = await solanaConnection.confirmTransaction(result, "confirmed");

    if (value === null || value === void 0 ? void 0 : value.err) {
        const errorMessage = JSON.stringify(value.err);
        throw new Error(`Transaction failed: ${errorMessage}`);
    }

    return result;
}
