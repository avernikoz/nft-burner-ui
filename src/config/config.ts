import { ImageStoreSingleton } from "../common/ImageStoreSingleton";

export const APP_ENVIRONMENT: "production" | "development" = (() => {
    if (process.env.REACT_APP_ENVIRONMENT === "production") {
        return "production";
    } else {
        return "development";
    }
})();

export const IMAGE_STORE_SINGLETON_INSTANCE = ImageStoreSingleton.getInstance();
