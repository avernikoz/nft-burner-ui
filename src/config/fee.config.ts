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

export const INSTRUMENTS_PRICE_CONFIG_USD =
    APP_ENVIRONMENT === "development"
        ? {
              laser: 0,
              lighter: 0.15,
              thunder: 0.25,
          }
        : {
              laser: 0,
              lighter: 15,
              thunder: 25,
          };
