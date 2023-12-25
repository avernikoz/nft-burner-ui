import { APP_ENVIRONMENT } from "./config";

export const BURNER_FEE_CONFIG =
    APP_ENVIRONMENT === "development"
        ? {
              percentageOfFloorPrice: 5,
              lowerLimitUSD: 0.05,
              upperLimitUSD: 1,
          }
        : {
              percentageOfFloorPrice: 5,
              lowerLimitUSD: 5,
              upperLimitUSD: 100,
          };
