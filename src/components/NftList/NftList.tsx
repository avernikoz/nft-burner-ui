import { useEffect, useState } from "react";
import NftItem, { INft } from "../NftItem/NftItem";
import { List } from "./NftList.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../config/nft.config";

import { useEthersSigner } from "./variables";
import { evm } from "@avernikoz/nft-sdk";
import { arbitrum, optimism, polygon } from "viem/chains";
import { ProgressSpinner } from "primereact/progressspinner";

function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();
    const [NFTList, setNFTList] = useState<INft[]>([]);
    const wagmiAccount = useAccount();
    const [userConnected, setUserConnected] = useState<boolean>(false);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);

    useEffect(() => {
        console.log(wagmiAccount.isConnected, wagmiAccount.address, signer);
        console.log(solanaWallet.connected && solanaWallet.publicKey);
        if (wagmiAccount.isConnected && wagmiAccount.address && signer) {
            setUserConnected(true);
            setShowSpinner(true);
            wagmiAccount.connector?.getChainId().then((id) => {
                setShowSpinner(false);
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
            setUserConnected(true);
            setShowSpinner(true);
            SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey).then((nfts: Required<INft[]>) => {
                setShowSpinner(false);
                setNFTList(nfts);
            });
        } else if (suietWallet.connected && suietWallet.address) {
            setUserConnected(true);
            setShowSpinner(true);
            SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address }).then((nfts) => {
                setShowSpinner(false);
                console.log(nfts);
                const convertedNfts = nfts.map((nft) => {
                    const ipfsHash = nft.url.replace("ipfs://", "");
                    return {
                        name: nft.name,
                        logoURI: "https://ipfs.io/ipfs/" + ipfsHash,
                    };
                });
                setNFTList(convertedNfts);
            });
        } else {
            setNFTList([]);
        }
    }, [
        signer,
        solanaConnection.connection,
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.isConnected,
        wagmiAccount.address,
        wagmiAccount.connector,
    ]);

    return (
        <List>
            {userConnected === false && <h3>Connect your wallet</h3>}
            {userConnected === true && NftList.length === 0 && <h3>Buy NFT and BURN them!</h3>}
            {showSpinner === false ? (
                <div className="nft-list">
                    {NFTList.map((item, i) => (
                        <NftItem item={item} key={i}></NftItem>
                    ))}
                </div>
            ) : (
                <div className="spinner">
                    <ProgressSpinner />
                </div>
            )}
        </List>
    );
}

export default NftList;
