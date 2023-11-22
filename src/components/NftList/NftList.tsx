import React, { useContext, useEffect, useState } from "react";
import NftItem from "../NftItem/NftItem";
import { INft } from "../../utils/types";
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
// eslint-disable-next-line import/no-extraneous-dependencies
import { FixedSizeGrid as Grid } from "react-window";
// eslint-disable-next-line import/no-unresolved
import { AutoSizer } from "react-virtualized";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { NftContext } from "../NftProvider/NftProvider";
import { ALLOWED_EVM_CHAINS } from "@avernikoz/nft-sdk/dist/networks/evm/common";

function NftList() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
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
    };

    useEffect(() => {
        try {
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
                            const convertedNfts = data.ownedNfts.map((nft, index) => {
                                let ipfsHash = nft.rawMetadata?.image;
                                if (!ipfsHash) {
                                    ipfsHash = "../../assets/svg/empty.jpg";
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
                            setNFTList(convertedNfts);
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
                                if (ipfsHash.includes("ipfs://")) {
                                    ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                }
                                return {
                                    name: nft.title,
                                    logoURI: ipfsHash,
                                    id: index,
                                };
                            });
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
                                if (ipfsHash.includes("ipfs://")) {
                                    ipfsHash = "https://ipfs.io/ipfs/" + ipfsHash.replace("ipfs://", "");
                                }
                                return {
                                    name: nft.title,
                                    logoURI: ipfsHash,
                                    id: index,
                                };
                            });
                            setNFTList(convertedNfts);
                        });
                    }
                });
            } else if (solanaWallet.connected && solanaWallet.publicKey) {
                setUserConnected(true);
                setShowSpinner(true);
                SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey).then((nfts: Required<INft[]>) => {
                    setShowSpinner(false);
                    setNFTList(nfts.map((item, i) => ({ ...item, id: i })));
                });
            } else if (suietWallet.connected && suietWallet.address) {
                setUserConnected(true);
                setShowSpinner(true);
                SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address }).then((nfts) => {
                    setShowSpinner(false);
                    console.log(nfts);
                    const convertedNfts = nfts.map((nft, index) => {
                        if (nft.url.includes("ipfs://")) {
                            const ipfsHash = nft.url.replace("ipfs://", "");
                            return {
                                name: nft.name,
                                logoURI: "https://ipfs.io/ipfs/" + ipfsHash,
                                id: index,
                            };
                        }
                        return {
                            name: nft.name,
                            logoURI: nft.url,
                            id: index,
                        };
                    });
                    setNFTList(convertedNfts);
                });
            } else {
                setUserConnected(false);
                setActiveNft(null);
                setNFTList([]);
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
        solanaConnection.connection,
        solanaWallet.connected,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.isConnected,
        wagmiAccount.address,
        wagmiAccount.connector,
        solanaWallet.publicKey,
        toastController,
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
