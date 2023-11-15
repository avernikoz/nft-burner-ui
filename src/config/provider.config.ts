import { SuiClient } from "@mysten/sui.js/client";
import { Connection } from "@solana/web3.js";

export const suiProvider = new SuiClient({ url: "https://sui-rpc.publicnode.com" });
export const solanaProvider = new Connection("https://solana-mainnet.rpc.extrnode.com");
