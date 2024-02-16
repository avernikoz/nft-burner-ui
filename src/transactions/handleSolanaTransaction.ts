import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_NFT_CLIENT_INSTANCE } from "../config/nft.config";
import { SolanaCNft, SolanaNft } from "../utils/types";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Type guard function
function isSolanaRegularNFT(nft: SolanaNft | SolanaCNft): nft is SolanaNft {
    return (nft as SolanaNft).solanaAccount !== undefined;
}

export async function handleSolanaTransaction({
    nft,
    solanaWallet,
    burnerFee,
    solanaConnection,
}: {
    nft: SolanaNft | SolanaCNft;
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

    let burnRes;

    if (isSolanaRegularNFT(nft)) {
        // nft is SolanaNft
        burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnNFT({
            owner: solanaWallet.publicKey,
            nft: nft.solanaAccount,
            transaction: payRes,
        });
    } else {
        // nft is SolanaCNft
        burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnCNFT({
            owner: solanaWallet.publicKey,
            nft: { id: new PublicKey(nft.nftId) },
            transaction: payRes,
        });
    }

    const result = await solanaWallet.sendTransaction(burnRes, solanaConnection);
    const { value } = await solanaConnection.confirmTransaction(result, "confirmed");

    if (value === null || value === void 0 ? void 0 : value.err) {
        const errorMessage = JSON.stringify(value.err);
        throw new Error(`Transaction failed: ${errorMessage}`);
    }

    return result;
}
