import { useEffect, useState } from "react";
import NftItem, { INft } from "../NftItem/NftItem";
import { List } from "./NftList.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount } from "wagmi";
import { sui, solana } from "@avernikoz/nft-sdk";

function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const wagmiAccount = useWagmiAccount();
    const [NFTList, setNFTList] = useState<INft[]>([]);
    // item: INft
    const nft: INft[] = [
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
        {
            name: "i NFT",
            logoURI:
                "https://cdn.prod.www.spiegel.de/images/d2caafb1-70da-47e2-ba48-efd66565cde1_w1024_r0.9975262832405689_fpx44.98_fpy48.86.jpg",
        },
    ];

    useEffect(() => {
        if (wagmiAccount.isConnected) {
        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            solana.getNFTs(solanaWallet.publicKey, solanaConnection.connection).then((nfts: Required<INft[]>) => {
                console.log(nfts);
                if (nfts) {
                    setNFTList(nfts);
                }
            });
        } else if (suietWallet.connected && suietWallet.address) {
            // sui.getNFTs(suietWallet.address?.toString());
        } else {
        }
    }, []);

    return (
        <List>
            {NFTList.map((item) => (
                <NftItem item={item}></NftItem>
            ))}
        </List>
    );
}

export default NftList;
