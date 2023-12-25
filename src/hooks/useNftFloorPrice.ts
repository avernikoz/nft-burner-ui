import * as Sentry from "@sentry/react";
import useSWR, { SWRConfiguration } from "swr";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { INft } from "../utils/types";

export type TokenPricesMap = { [key in ALLOWED_NETWORKS]: number };

export const useNftFloorPrice = (nft: INft | null, options?: SWRConfiguration) => {
    const fetcher = async () => {
        if (!nft) {
            return;
        }

        const floorPrice = null;

        try {
            switch (nft.network) {
                case ALLOWED_NETWORKS.Sui:
                    // const suiNFT = nft as SuiNft;
                    // const floorPriceMap = await SUI_NFT_CLIENT_INSTANCE.getFloorPricesMap({});
                    // const NftfloorPrice = floorPriceMap.get(suiNFT.nftType);

                    // return NftfloorPrice?.floorPrice ?? null

                    break;
                case ALLOWED_NETWORKS.Solana:
                    // const solanaNFT = nft as SolanaNft;
                    break;
                case ALLOWED_NETWORKS.Ethereum:
                case ALLOWED_NETWORKS.Arbitrum:
                case ALLOWED_NETWORKS.Optimism:
                case ALLOWED_NETWORKS.Polygon:
                    // const evmNFT = nft as EvmNft;

                    break;
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error("Failed to get floor price for nft: " + error.message);
            } else {
                console.error("Failed to get floor price for nft: " + error);
            }

            Sentry.captureException(error, {
                tags: { scenario: "fetch_nft_floor_price" },
            });
        }

        return floorPrice;
    };

    const { data, ...rest } = useSWR(`nft-floor-prices-${nft?.id}-${nft?.name}-${nft?.network}`, fetcher, {
        ...options,
    });

    return { data, ...rest };
};
