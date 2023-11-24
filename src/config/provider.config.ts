// eslint-disable-next-line import/no-unresolved
import { SuiClient } from "@mysten/sui.js/client";
import { Connection } from "@solana/web3.js";

export const suiProvider = new SuiClient({
    url: "https://mainnet.helius-rpc.com/?api-key=4446ea08-ee75-433b-b078-9919068079ef",
});
export const solanaProvider = new Connection("https://solana-mainnet.rpc.extrnode.com");
