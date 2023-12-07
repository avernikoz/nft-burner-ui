if (!process.env.REACT_APP_CORS_PROXY_URL?.length) {
    throw new Error("Empty REACT_APP_CORS_PROXY_URL");
}

export const NFT_IMAGES_CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL;
