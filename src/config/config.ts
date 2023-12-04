import { ImageStoreSingleton } from "../common/ImageStoreSingleton";

export const APP_ENVIRONMENT: "production" | "development" = (() => {
    if (process.env.REACT_APP_ENVIRONMENT === "production") {
        return "production";
    } else {
        return "development";
    }
})();

export const sentryDSN = "https://3ca8da718e941b46a893219597159059@o4506315210358784.ingest.sentry.io/4506315213176832";

export const IMAGE_STORE_SINGLETON_INSTANCE = ImageStoreSingleton.getInstance();
