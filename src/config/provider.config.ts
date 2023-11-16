// eslint-disable-next-line import/no-unresolved
import { SuiClient } from "@mysten/sui.js/client";
import { Connection } from "@solana/web3.js";

export const suiProvider = new SuiClient({ url: "https://mainnet.sui.rpcpool.com" });
export const solanaProvider = new Connection("https://solana-mainnet.rpc.extrnode.com");
