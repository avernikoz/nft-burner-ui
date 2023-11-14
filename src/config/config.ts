import { SuiClient } from "@mysten/sui.js/client";

export const APP_ENVIRONMENT: "production" | "development" = (() => {
    if (process.env.REACT_APP_ENVIRONMENT === "production") {
        return "production";
    } else {
        return "development";
    }
})();

export const provider = new SuiClient({ url: "https://sui-rpc.publicnode.com" });
