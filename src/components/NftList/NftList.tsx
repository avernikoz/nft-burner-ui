import React, { useContext, useEffect, useState } from "react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../config/nft.config";

import { useEthersSigner } from "./variables";
import { evm } from "@avernikoz/nft-sdk";
import { arbitrum, mainnet, optimism, polygon } from "viem/chains";
import { ProgressSpinner } from "primereact/progressspinner";
// eslint-disable-next-line import/no-extraneous-dependencies
import { FixedSizeGrid as Grid } from "react-window";
// eslint-disable-next-line import/no-unresolved
import { AutoSizer } from "react-virtualized";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { NftContext } from "../NftProvider/NftProvider";
import NftItem from "../NftItem/NftItem";
import { INft, ALLOWED_EVM_CHAINS, ENftBurnStatus } from "../../utils/types";
import { List } from "./NftList.styled";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../config/proxy.config";

function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const signer = useEthersSigner();
    const [NFTList, setNFTList] = useState<INft[]>([]);
    const wagmiAccount = useAccount();
    const [activeNft, setActiveNft] = useState<number | null>(null);
    const [userConnected, setUserConnected] = useState<boolean>(false);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const toastController = useContext(ToastContext);
    const NftController = useContext(NftContext);

    const handleItemClick = (nft: INft) => {
        setActiveNft(nft.id ?? null);
        NftController?.setActiveNft(nft);
        NftController?.setNftStatus(ENftBurnStatus.SELECTED);
    };

    const checkImageExists = (imageUrl: string) => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onerror = function () {
                reject(false);
            };
            img.src = imageUrl;
        });
    };

    useEffect(() => {
        try {
            if (
                NftController?.nftStatus === ENftBurnStatus.BURNED ||
                NftController?.nftStatus === ENftBurnStatus.EPMTY
            ) {
                const proxy = NFT_IMAGES_CORS_PROXY_URL;
                if (wagmiAccount.isConnected && wagmiAccount.address && signer) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    wagmiAccount.connector?.getChainId().then((id) => {
                        if (id === mainnet.id) {
                            ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                                network: evm.ALLOWED_EVM_CHAINS.Ethereum,
                                owner: signer,
                            }).then((data) => {
                                const convertedNfts = data.ownedNfts.map((nft, index) => {
                                    let ipfsHash = nft.rawMetadata?.image;
                                    if (!ipfsHash) {
                                        ipfsHash = "../../assets/svg/empty.jpg";
                                    }
                                    if (ipfsHash.includes("https://")) {
                                        ipfsHash = "http://localhost:8888/.netlify/functions/cors-proxy/" + ipfsHash;
                                    }
                                    if (ipfsHash.includes("ipfs://")) {
                                        ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                    }
                                    return {
                                        name: nft.title,
                                        logoURI: ipfsHash,
                                        id: index,
                                        contractAddress: nft.contract.address,
                                        contractType: nft.contract.tokenType,
                                        nftTokenId: nft.tokenId,
                                        owner: signer,
                                        evm: ALLOWED_EVM_CHAINS.Ethereum,
                                    };
                                });
                                setShowSpinner(false);
                                setNFTList(convertedNfts);
                            });
                        }
                        if (id === polygon.id) {
                            ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                                network: evm.ALLOWED_EVM_CHAINS.Polygon,
                                owner: signer,
                            }).then((data) => {
                                let convertedNfts = data.ownedNfts.map((nft, index) => {
                                    let ipfsHash = nft.rawMetadata?.image;
                                    if (!ipfsHash) {
                                        ipfsHash = "../../assets/svg/empty.jpg";
                                    }
                                    if (ipfsHash.includes("https://")) {
                                        ipfsHash = proxy + ipfsHash;
                                    }
                                    if (ipfsHash.includes("ipfs://")) {
                                        ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                    }
                                    return {
                                        name: nft.title,
                                        logoURI: ipfsHash,
                                        id: index,
                                        contractAddress: nft.contract.address,
                                        contractType: nft.contract.tokenType,
                                        nftTokenId: nft.tokenId,
                                        owner: signer,
                                        evm: ALLOWED_EVM_CHAINS.Polygon,
                                    };
                                });
                                const promises = convertedNfts.map((nft) => {
                                    return checkImageExists(nft.logoURI)
                                        .then(() => true)
                                        .catch(() => false);
                                });
                                Promise.all(promises).catch((results) => {
                                    convertedNfts = convertedNfts.filter((nft, index) => results[index]);
                                    setNFTList(convertedNfts);
                                    setShowSpinner(false);
                                });
                            });
                        }
                        if (id === optimism.id) {
                            ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                                network: evm.ALLOWED_EVM_CHAINS.Optimism,
                                owner: signer,
                            }).then((data) => {
                                const convertedNfts = data.ownedNfts.map((nft, index) => {
                                    let ipfsHash = nft.rawMetadata?.image;

                                    if (!ipfsHash) {
                                        ipfsHash = "../../assets/svg/empty.jpg";
                                    }
                                    if (ipfsHash.includes("https://")) {
                                        ipfsHash = proxy + ipfsHash;
                                    }
                                    if (ipfsHash.includes("ipfs://")) {
                                        ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                    }
                                    return {
                                        name: nft.title,
                                        logoURI: ipfsHash,
                                        id: index,

                                        contractAddress: nft.contract.address,
                                        contractType: nft.contract.tokenType,
                                        nftTokenId: nft.tokenId,
                                        owner: signer,
                                        evm: ALLOWED_EVM_CHAINS.Optimism,
                                    };
                                });
                                setShowSpinner(false);
                                setNFTList(convertedNfts);
                            });
                        }
                        if (id === arbitrum.id) {
                            ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                                network: evm.ALLOWED_EVM_CHAINS.Arbitrum,
                                owner: signer,
                            }).then((data) => {
                                const convertedNfts = data.ownedNfts.map((nft, index) => {
                                    let ipfsHash = nft.rawMetadata?.image;
                                    if (!ipfsHash) {
                                        ipfsHash = "../../assets/svg/empty.jpg";
                                    }
                                    if (ipfsHash.includes("https://")) {
                                        ipfsHash = proxy + ipfsHash;
                                    }
                                    if (ipfsHash.includes("ipfs://")) {
                                        ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                    }
                                    return {
                                        name: nft.title,
                                        logoURI: ipfsHash,
                                        id: index,

                                        contractAddress: nft.contract.address,
                                        contractType: nft.contract.tokenType,
                                        nftTokenId: nft.tokenId,
                                        owner: signer,
                                        evm: ALLOWED_EVM_CHAINS.Arbitrum,
                                    };
                                });
                                setShowSpinner(false);
                                setNFTList(convertedNfts);
                            });
                        }
                    });
                    return;
                } else if (solanaWallet.connected && solanaWallet.publicKey) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey).then((nfts) => {
                        setShowSpinner(false);
                        const mappedNFts: INft[] = nfts.map((item, i) => ({
                            logoURI: item.logoURI,
                            name: item.name,
                            id: i,
                            solanaAccount: item.accounts,
                        }));
                        setNFTList(mappedNFts);
                    });
                    return;
                } else if (suietWallet.connected && suietWallet.address) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address }).then((nfts) => {
                        setShowSpinner(false);
                        console.log(nfts);
                        const convertedNfts = nfts.map((nft, index) => {
                            let ipfsHash = nft.url;
                            if (ipfsHash.includes("https://")) {
                                ipfsHash = proxy + ipfsHash;
                            }
                            if (ipfsHash.includes("ipfs://")) {
                                ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                            }
                            return {
                                name: nft.name,
                                logoURI: ipfsHash,
                                id: index,
                                nftId: nft.nftId,
                                kioskId: nft.kioskId,
                                nftType: nft.nftType,
                            };
                        });
                        setNFTList(convertedNfts);
                    });
                    return;
                } else {
                    setUserConnected(false);
                    setActiveNft(null);
                    setNFTList([]);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                toastController?.showError("Failed to connect: " + error.message);
            } else {
                toastController?.showError("Failed to connect: " + error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        signer,
        solanaWallet.connected,
        solanaWallet.publicKey,
        suietWallet.address,
        suietWallet.connected,
        toastController,
        wagmiAccount.address,
        wagmiAccount.connector,
        wagmiAccount.isConnected,
    ]);

    // const itemTemplate = (item: INft) => {
    //     const index = item.id ?? Math.random();
    //     return (
    //         <NftItem
    //             item={item}
    //             key={index}
    //             id={index}
    //             isActive={index == activeNft}
    //             onClick={() => handleItemClick(index)}
    //         />
    //     );
    // };

    const Cell = ({
        columnIndex,
        rowIndex,
        style,
    }: {
        columnIndex: number;
        rowIndex: number;
        style: React.CSSProperties;
    }) => {
        const index = rowIndex * 3 + columnIndex; // Assuming 3 columns
        if (index > NFTList.length - 1) {
            return null;
        }
        const item = NFTList[index];

        return (
            <div
                style={{
                    ...style,
                }}
            >
                <NftItem
                    item={item}
                    key={index}
                    id={index}
                    isActive={index == activeNft}
                    onClick={() => handleItemClick(item)}
                />
            </div>
        );
    };

    return (
        <List>
            {!userConnected ? <h3>Connect your wallet</h3> : <h3>Choose NFT to burn</h3>}
            {/* {userConnected && NftList.length == 0 ? <h3>Buy NFT and BURN them!</h3> : null} */}
            {!showSpinner ? (
                <div className="virtual-container">
                    <AutoSizer>
                        {({ height, width }) => (
                            <Grid
                                className="nft-list"
                                columnCount={3} // Number of columns
                                columnWidth={width / 3} // Width of each item
                                height={height} // Height of the grid
                                rowCount={Math.ceil(NFTList.length / 3)} // Number of rows
                                rowHeight={230} // Height of each item
                                width={width} // Width of the grid
                            >
                                {Cell}
                            </Grid>
                        )}
                    </AutoSizer>
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
