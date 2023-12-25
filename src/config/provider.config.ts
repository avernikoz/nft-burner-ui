// eslint-disable-next-line import/no-unresolved
import { DynamicSuiTransport } from "@avernikoz/nft-sdk";
import { SuiClient } from "@mysten/sui.js/client";

import { Connection } from "@solana/web3.js";

const urls = [
    "https://sui-mainnet-rpc.allthatnode.com",
    "https://fullnode.mainnet.sui.io",
    "https://mainnet.sui.rpcpool.com",
];
const dynamicTransport = new DynamicSuiTransport(urls);

export const suiProvider = new SuiClient({ transport: dynamicTransport });
export const solanaProvider = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=4446ea08-ee75-433b-b078-9919068079ef",
);
