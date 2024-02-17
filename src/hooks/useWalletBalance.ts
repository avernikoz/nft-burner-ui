import * as Sentry from "@sentry/react";
import useSWR, { SWRConfiguration } from "swr";
import { SWR_CONFIG } from "../config/swr.config";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { getNetworkTokenSymbol } from "../utils/getNetworkTokenSymbol";
import { fetchBalance } from "@wagmi/core";
import { getChainIdByEVMNetworkName } from "../utils/getChainIdByEVMNetworkName";
import { solanaProvider, suiProvider } from "../config/provider.config";
import { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";

export type WalletBalanceReturnType =
    | { balanceRaw: number | null; balanceFormatted: string | null; balanceTokenSymbol: string }
    | undefined;

export const useWalletBalance = (
    { address, network }: { network: ALLOWED_NETWORKS | null | undefined; address: string | null | undefined },
    options?: SWRConfiguration,
) => {
    const fetcher = async (): Promise<WalletBalanceReturnType> => {
        if (!network) {
            return;
        }

        if (!address) {
            return;
        }

        try {
            console.time("[useWalletBalance] start");
            let balanceRaw = null;
            let balanceFormatted = null;
            const balanceTokenSymbol = getNetworkTokenSymbol(network);

            switch (network) {
                case ALLOWED_NETWORKS.Sui:
                    const suiWalletBalance = await suiProvider.getBalance({ owner: address });
                    balanceRaw = +suiWalletBalance.totalBalance;
                    balanceFormatted = ethers.formatUnits(suiWalletBalance.totalBalance, 9).substring(0, 5);
                    break;
                case ALLOWED_NETWORKS.Solana:
                    const solanaWalletBalance = await solanaProvider.getBalance(new PublicKey(address));
                    balanceRaw = solanaWalletBalance;
                    balanceFormatted = ethers.formatUnits(solanaWalletBalance, 9).substring(0, 5);
                    break;
                case ALLOWED_NETWORKS.Ethereum:
                case ALLOWED_NETWORKS.Arbitrum:
                case ALLOWED_NETWORKS.Optimism:
                case ALLOWED_NETWORKS.Polygon:
                    const evmBalance = await fetchBalance({
                        address: address as `0x${string}`,
                        chainId: getChainIdByEVMNetworkName(network),
                    });
                    balanceRaw = Number(evmBalance.value);
                    balanceFormatted = evmBalance.formatted.substring(0, 5);

                    break;
            }
            return {
                balanceRaw,
                balanceFormatted,
                balanceTokenSymbol,
            };
        } catch (e) {
            console.debug("[useWalletBalance] error: ", e);
            Sentry.captureException(e, {
                tags: { scenario: "fetch_user_wallet_balance" },
            });
            throw e;
        }
    };

    const { data, ...rest } = useSWR(`user-wallet-balance-${address}`, fetcher, {
        refreshInterval: SWR_CONFIG.refetchInterval.moderate,

        ...options,
    });

    return { data, ...rest };
};
