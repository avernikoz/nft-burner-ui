import { INft } from "./types";

export function generateTwitterIntentShare(nft: INft): string {
    const baseUrl = "https://twitter.com/intent/tweet";
    const text = encodeURIComponent(`Just experienced the power of renewal by burning ${nft.name} on nftburner.io 🔥`);

    // Tags
    const hashtags = ["nftburner", "sui"];

    // New line encoded symbol
    const newLineCharacter = encodeURIComponent("\n");

    // Construct the final Twitter intent URL
    const twitterIntentURL = `${baseUrl}?text=${text}${newLineCharacter}&hashtags=${hashtags.join(",")}`;

    return twitterIntentURL;
}
