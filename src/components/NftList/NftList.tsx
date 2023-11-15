import { useEffect, useState } from "react";
import NftItem, { INft } from "../NftItem/NftItem";
import { List } from "./NftList.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount, useWalletClient  } from "wagmi";
import { solana } from "@avernikoz/nft-sdk";
import { EVMMultichainSettings } from "@avernikoz/nft-sdk/dist/networks/evm/common/EVMMultichainClient";

const settings: EVMMultichainSettings = {
    [ALLOWED_EVM_CHAINS.Ethereum]: { apiKey:  process.env.ETHEREUM_MAINNET_API_KEY, feeCollector: 'your-fee-collector' },
    [ALLOWED_EVM_CHAINS.Polygon]: { apiKey:  process.env.POLYGON_MAINNET_API_KEY, feeCollector: 'your-fee-collector' },
    [ALLOWED_EVM_CHAINS.Arbitrum]: { apiKey:  process.env.ARBITRUM_MAINNET_API_KEY, feeCollector: 'your-fee-collector' },
    [ALLOWED_EVM_CHAINS.Optimism]: { apiKey:  process.env.OPTIMISM_MAINNET_API_KEY, feeCollector: 'your-fee-collector' },
  };
  
function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const wagmiAccount = useWagmiAccount();
    const { data: walletClient, isError, isLoading } = useWalletClient()
    const [NFTList, setNFTList] = useState<INft[]>([]);
    useEffect(() => {
        if (wagmiAccount.isConnected && wagmiAccount.address) {
            wagmiAccount.connector?.getChainId();
            walletClient
            const test = new AlchemyMultichainClient({"Ethereum":walletClient});


        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            solana.getNFTs(solanaWallet.publicKey, solanaConnection.connection).then((nfts: Required<INft[]>) => {
                setNFTList(nfts);
            });
        } else if (suietWallet.connected && suietWallet.address) {
            // sui.getNFTs(suietWallet.address?.toString());
        } else {
        }
    }, [solanaConnection.connection, solanaWallet.connected, solanaWallet.publicKey, suietWallet.address, suietWallet.connected, wagmiAccount.address, wagmiAccount.connector, wagmiAccount.isCo nnected]);

    return (
        <List>
            {NFTList.map((item) => (
                <NftItem item={item}></NftItem>
            ))}
        </List>
    );
}

export default NftList;
