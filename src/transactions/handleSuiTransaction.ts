import { SUI_NFT_CLIENT_INSTANCE } from "../config/nft.config";
import { SuiNft } from "../utils/types";

export async function handleSuiTransaction({ nft, burnerFee }: { nft: SuiNft; burnerFee: number }) {
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

    return burnRes;
}
