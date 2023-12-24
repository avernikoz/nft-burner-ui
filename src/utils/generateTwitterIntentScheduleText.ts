import { INft } from "./types";

export function generateTwitterIntentScheduleText(nft: INft): string {
    const baseUrl = "https://twitter.com/intent/tweet";
    const text = encodeURIComponent(
        `🔥 Burning my NFT ${nft.name}, on NFTBurner.io today! ✨ Join the transformation! 🚀`,
    );

    // Tags
    const hashtags = ["BurnNFT", "CryptoArt"];

    // New line encoded symbol
    const newLineCharacter = encodeURIComponent("\n");

    // Construct the final Twitter intent URL
    const twitterIntentURL = `${baseUrl}?text=${text}${newLineCharacter}&hashtags=${hashtags.join(",")}`;

    console.debug("twitterIntentURL: ", twitterIntentURL);

    return twitterIntentURL;
}
