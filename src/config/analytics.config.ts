if (!process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID?.length) {
    throw new Error("Empty SUI_NFT_PRICE_API");
}

export const REACT_APP_GOOGLE_TAG_MANAGER_ID = process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID;
