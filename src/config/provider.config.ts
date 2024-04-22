// eslint-disable-next-line import/no-unresolved
import { DynamicSuiTransport } from "@avernikoz/nft-sdk";
import { SuiClient } from "@mysten/sui.js/client";
import { Connection } from "@solana/web3.js";
import { generateNonce, generateRandomness } from "@mysten/zklogin";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

const urls = [
    "https://sui-mainnet-rpc.allthatnode.com",
    "https://fullnode.mainnet.sui.io",
    "https://mainnet.sui.rpcpool.com",
];
const dynamicTransport = new DynamicSuiTransport(urls);

export const suiProvider = new SuiClient({ transport: dynamicTransport });
// TODO: CHECK IF IT WORKS
const { epoch } = await suiProvider.getLatestSuiSystemState();

const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
const ephemeralKeyPair = new Ed25519Keypair();
const randomness = generateRandomness();
const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
console.log(nonce);

export const solanaProvider = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=4446ea08-ee75-433b-b078-9919068079ef",
);
