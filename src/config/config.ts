export const APP_ENVIRONMENT: "production" | "development" = (() => {
    if (process.env.REACT_APP_ENVIRONMENT === "production") {
        return "production";
    } else {
        return "development";
    }
})();
