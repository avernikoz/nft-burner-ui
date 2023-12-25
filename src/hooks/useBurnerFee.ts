import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { BURNER_FEE_CONFIG } from "../config/fee.config";
import { useTokenPrices } from "./useTokenPrices";
import { roundToDecimals } from "../utils/roundToDecimals";

// TODO: use swr for caching
export const useBurnerFee = ({
    floorPrice,
    network,
}: {
    floorPrice: number | null | undefined;
    network: ALLOWED_NETWORKS | null | undefined;
}) => {
    const { data: prices } = useTokenPrices();

    if (!prices || !network) {
        return { isLoading: true };
    }

    if (floorPrice === null || floorPrice === undefined) {
        const feeUSD = BURNER_FEE_CONFIG.lowerLimitUSD;
        const feeInNetworkToken = feeUSD / prices[network];

        return { isLoading: false, feeInNetworkToken: roundToDecimals(feeInNetworkToken, 9) };
    }

    const floorPriceInUSD = floorPrice * prices[network];
    const rawFeeUSD = (floorPriceInUSD * BURNER_FEE_CONFIG.percentageOfFloorPrice) / 100;
    const feeUSD =
        rawFeeUSD > BURNER_FEE_CONFIG.upperLimitUSD
            ? BURNER_FEE_CONFIG.upperLimitUSD
            : rawFeeUSD < BURNER_FEE_CONFIG.lowerLimitUSD
            ? BURNER_FEE_CONFIG.lowerLimitUSD
            : rawFeeUSD;

    const feeInNetworkToken = feeUSD / prices[network];

    return { isLoading: false, feeInNetworkToken: roundToDecimals(feeInNetworkToken, 9) };
};
