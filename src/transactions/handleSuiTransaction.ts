import { WalletContextState } from "@suiet/wallet-kit";
import { SUI_NFT_CLIENT_INSTANCE } from "../config/nft.config";
import { SuiNft } from "../utils/types";

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
    await signAndExecuteTransactionBlock({
        transactionBlock: burnRes.transaction,
    });
}
