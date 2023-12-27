import * as Sentry from "@sentry/react";

import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { roundToDecimals } from "../utils/roundToDecimals";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../config/nft.config";
import { useState, useEffect } from "react";

export const useNetworkFee = ({ network }: { network: ALLOWED_NETWORKS | null | undefined }) => {
    const [networkFee, setNetworkFee] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetcher = async () => {
            if (!network) {
                return;
            }

            let feeInNetworkToken = null;

            try {
                switch (network) {
                    case ALLOWED_NETWORKS.Sui:
                        feeInNetworkToken = await SUI_NFT_CLIENT_INSTANCE.getNetworkFee();
                        break;
                    case ALLOWED_NETWORKS.Solana:
                        feeInNetworkToken = await SOLANA_NFT_CLIENT_INSTANCE.getNetworkFee();
                        break;
                    case ALLOWED_NETWORKS.Ethereum:
                    case ALLOWED_NETWORKS.Arbitrum:
                    case ALLOWED_NETWORKS.Optimism:
                    case ALLOWED_NETWORKS.Polygon:
                        feeInNetworkToken = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNetworkFee();
                        break;
                }
            } catch (error) {
                if (error instanceof Error) {
                    console.error("Failed to get network fee: " + error.message);
                } else {
                    console.error("Failed to get network fee: " + error);
                }

                Sentry.captureException(error, {
                    tags: { scenario: "fetch_network_fee" },
                });
            } finally {
                setNetworkFee(feeInNetworkToken);
                setLoading(false);
            }
        };

        fetcher();
    }, [network]);

    return { isLoading: loading, networkFee: !networkFee ? null : roundToDecimals(networkFee, 9) };
};
