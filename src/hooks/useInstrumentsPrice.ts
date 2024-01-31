import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { INSTRUMENTS_PRICE_CONFIG_USD } from "../config/fee.config";
import { useTokenPrices } from "./useTokenPrices";
import { roundToDecimals } from "../utils/roundToDecimals";

// TODO: use swr for caching
export const useInstumentsPrice = ({
    instrument,
    network,
}: {
    instrument: "laser" | "lighter" | "tunder";
    network: ALLOWED_NETWORKS | null | undefined;
}) => {
    const { data: prices } = useTokenPrices();

    if (!prices || !network || !instrument) {
        return { isLoading: true };
    }

    const feeUSD = INSTRUMENTS_PRICE_CONFIG_USD[instrument];
    const feeInNetworkToken = feeUSD / prices[network];

    return { isLoading: false, instrumentPriceInNetworkToken: roundToDecimals(feeInNetworkToken, 9) };
};
