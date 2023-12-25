import * as Sentry from "@sentry/react";
import useSWR, { SWRConfiguration } from "swr";
import { SWR_CONFIG } from "../config/swr.config";
import { getNetworkPrices, ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

export type TokenPricesMap = { [key in ALLOWED_NETWORKS]: number };

export const useTokenPrices = (options?: SWRConfiguration) => {
    const fetcher = async (): Promise<TokenPricesMap> => {
        try {
            const prices = await getNetworkPrices();
            const pricesMap = {
                [ALLOWED_NETWORKS.Arbitrum]: prices.ethereum.usd,
                [ALLOWED_NETWORKS.Ethereum]: prices.ethereum.usd,
                [ALLOWED_NETWORKS.Optimism]: prices.ethereum.usd,
                [ALLOWED_NETWORKS.Polygon]: prices["matic-network"].usd,
                [ALLOWED_NETWORKS.Solana]: prices.solana.usd,
                [ALLOWED_NETWORKS.Sui]: prices.sui.usd,
            };

            return pricesMap;
        } catch (e) {
            Sentry.captureException(e, {
                tags: { scenario: "fetch_network_prices" },
            });
            throw e;
        }
    };

    const { data, ...rest } = useSWR(`token-prices`, fetcher, {
        refreshInterval: SWR_CONFIG.refetchInterval.moderate,
        ...options,
    });

    return { data, ...rest };
};
