import React, { useEffect, useState } from "react";
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
// eslint-disable-next-line import/no-extraneous-dependencies
import { FixedSizeGrid as Grid } from "react-window";
// eslint-disable-next-line import/no-unresolved
import { AutoSizer } from "react-virtualized";

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

    const handleItemClick = (id: number) => {
        setActiveNft(id);
    };

    useEffect(() => {
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
                            return {
                                name: nft.title,
                                logoURI: nft.rawMetadata?.image ?? "../../assets/svg/empty.jpg",
                                id: index,
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
                            return {
                                name: nft.title,
                                logoURI: nft.rawMetadata?.image ?? "../../assets/svg/empty.jpg",
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
                            return {
                                name: nft.title,
                                logoURI: nft.rawMetadata?.image ?? "../../assets/svg/empty.jpg",
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
                    onClick={() => handleItemClick(index)}
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
