export function generateTwitterIntentShare(): string {
    const baseUrl = "https://twitter.com/intent/tweet";
    const text = encodeURIComponent(
        `Just experienced the power of renewal by burning my NFT on nftburner.io 🔥 Letting go of the past to make room for the future. Ready for a new chapter!`,
    );

    // Tags
    const hashtags = ["NFTCommunity", "BurnerApp", "CryptoLife"];

    // New line encoded symbol
    const newLineCharacter = encodeURIComponent("\n");

    // Construct the final Twitter intent URL
    const twitterIntentURL = `${baseUrl}?text=${text}${newLineCharacter}&hashtags=${hashtags.join(",")}`;

    return twitterIntentURL;
}
