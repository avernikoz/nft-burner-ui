import { useEffect, useState } from "react";
import NftItem, { INft } from "../NftItem/NftItem";
import { List } from "./NftList.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount } from "wagmi";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../config/nft.config";
import { ALLOWED_EVM_CHAINS } from "@avernikoz/nft-sdk/dist/networks/evm/common/const";

import { useEthersSigner } from "./variables";
import { evm } from "@avernikoz/nft-sdk";
import { arbitrum, optimism, polygon } from "viem/chains";

function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const wagmiAccount = useWagmiAccount();
    const signer = useEthersSigner();
    const [NFTList, setNFTList] = useState<INft[]>([]);
    useEffect(() => {
        if (wagmiAccount.isConnected && wagmiAccount.address && signer) {
            wagmiAccount.connector?.getChainId().then((id) => {
                if (id === polygon.id) {
                    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                        network: evm.ALLOWED_EVM_CHAINS.Polygon,
                        owner: signer,
                    }).then((data) => {
                        console.log(data);
                    });
                }
                if (id === optimism.id) {
                    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                        network: evm.ALLOWED_EVM_CHAINS.Optimism,
                        owner: signer,
                    }).then((data) => {
                        console.log(data);
                    });
                }
                if (id === arbitrum.id) {
                    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                        network: evm.ALLOWED_EVM_CHAINS.Arbitrum,
                        owner: signer,
                    }).then((data) => {
                        console.log(data);
                    });
                }
            });
        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey).then((nfts: Required<INft[]>) => {
                setNFTList(nfts);
            });
        } else if (suietWallet.connected && suietWallet.address) {
            // SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address }).then((nfts: Required<INft[]>) => {
            //     setNFTList(nfts);
            // });
        } else {
        }
    }, [
        signer,
        solanaConnection.connection,
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.address,
        wagmiAccount.connector,
        wagmiAccount.isConnected,
    ]);

    return (
        <List>
            {NFTList.map((item, i) => (
                <NftItem item={item} key={i}></NftItem>
            ))}
        </List>
    );
}

export default NftList;
