import { sui, solana, ALLOWED_EVM_CHAINS, EVMMultichainSettings, evm } from "@avernikoz/nft-sdk";
import { suiProvider, solanaProvider } from "./provider.config";
import { PublicKey } from "@solana/web3.js";

// sui
if (!process.env.REACT_APP_SUI_NFT_PRICE_API?.length) {
    throw new Error("Empty SUI_NFT_PRICE_API");
}

if (!process.env.REACT_APP_SUI_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty SUI_FEE_COLLECTOR_WALLET");
}

// solana
if (!process.env.REACT_APP_SOLANA_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty SOLANA_FEE_COLLECTOR_WALLET");
}

// evm
if (!process.env.REACT_APP_ETHEREUM_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty ETHEREUM_FEE_COLLECTOR_WALLET");
}

if (!process.env.REACT_APP_POLYGON_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty POLYGON_FEE_COLLECTOR_WALLET");
}

if (!process.env.REACT_APP_ARBITRUM_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty ARBITRUM_FEE_COLLECTOR_WALLET");
}

if (!process.env.REACT_APP_OPTIMISM_FEE_COLLECTOR_WALLET?.length) {
    throw new Error("Empty OPTIMISM_FEE_COLLECTOR_WALLET");
}

// evm apiKeys
if (!process.env.REACT_APP_ETHEREUM_MAINNET_API_KEY?.length) {
    throw new Error("Empty ETHEREUM_MAINNET_API_KEY");
}

if (!process.env.REACT_APP_POLYGON_MAINNET_API_KEY?.length) {
    throw new Error("Empty POLYGON_MAINNET_API_KEY");
}

if (!process.env.REACT_APP_ARBITRUM_MAINNET_API_KEY?.length) {
    throw new Error("Empty ARBITRUM_MAINNET_API_KEY");
}

if (!process.env.REACT_APP_OPTIMISM_MAINNET_API_KEY?.length) {
    throw new Error("Empty OPTIMISM_MAINNET_API_KEY");
}

export const EVM_CHAINS_ALCHEMY_CONFIG: EVMMultichainSettings = {
    [ALLOWED_EVM_CHAINS.Ethereum]: {
        apiKey: process.env.REACT_APP_ETHEREUM_MAINNET_API_KEY,
        feeCollector: process.env.REACT_APP_ETHEREUM_FEE_COLLECTOR_WALLET,
    },
    [ALLOWED_EVM_CHAINS.Polygon]: {
        apiKey: process.env.REACT_APP_POLYGON_MAINNET_API_KEY,
        feeCollector: process.env.REACT_APP_POLYGON_FEE_COLLECTOR_WALLET,
    },
    [ALLOWED_EVM_CHAINS.Arbitrum]: {
        apiKey: process.env.REACT_APP_ARBITRUM_MAINNET_API_KEY,
        feeCollector: process.env.REACT_APP_ARBITRUM_FEE_COLLECTOR_WALLET,
    },
    [ALLOWED_EVM_CHAINS.Optimism]: {
        apiKey: process.env.REACT_APP_OPTIMISM_MAINNET_API_KEY,
        feeCollector: process.env.REACT_APP_OPTIMISM_FEE_COLLECTOR_WALLET,
    },
};

export const PRICE_API_URL = process.env.REACT_APP_SUI_NFT_PRICE_API;

export const SUI_NFT_CLIENT_INSTANCE = new sui.SuiNFTClient({
    provider: suiProvider,
    feeCollector: process.env.REACT_APP_SUI_FEE_COLLECTOR_WALLET,
    priceApiURL: PRICE_API_URL,
});

export const SOLANA_NFT_CLIENT_INSTANCE = new solana.SolanaNFTClient({
    provider: solanaProvider,
    feeCollector: new PublicKey(process.env.REACT_APP_SOLANA_FEE_COLLECTOR_WALLET),
});

export const ALCHEMY_MULTICHAIN_CLIENT_INSTANCE = new evm.EVMMultichainClient(EVM_CHAINS_ALCHEMY_CONFIG);
