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
import { arbitrum, optimism, polygon } from "viem/chains";
import { ProgressSpinner } from "primereact/progressspinner";
import { FixedSizeGrid as Grid } from "react-window";
// eslint-disable-next-line import/no-extraneous-dependencies
import { AutoSizer } from "react-virtualized";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { NftContext } from "../NftProvider/NftProvider";
import NftItem from "../NftItem/NftItem";
import { INft, ALLOWED_EVM_CHAINS, ENftBurnStatus } from "../../utils/types";
import { List } from "./NftList.styled";
// eslint-disable-next-line import/no-extraneous-dependencies
import { NftFilters } from "alchemy-sdk";
import { evmMapper, solanaMapper, suiMapper } from "./mappers";
import { PublicKey } from "@solana/web3.js";

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

    // function imageExists(imageUrl: string) {
    //     return fetch(imageUrl, { method: "HEAD" });
    // }

    useEffect(() => {
        try {
            if (
                NftController?.nftStatus === ENftBurnStatus.BURNED ||
                NftController?.nftStatus === ENftBurnStatus.EPMTY
            ) {
                const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
                const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
                const suiChangeOrConnected = suietWallet.connected && suietWallet.address;
                if (wagmiChangeOrConnected) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    wagmiAccount.connector?.getChainId().then((id) => {
                        let chainName: ALLOWED_EVM_CHAINS = ALLOWED_EVM_CHAINS.Ethereum;
                        switch (id) {
                            case polygon.id:
                                chainName = ALLOWED_EVM_CHAINS.Polygon;
                                break;
                            case optimism.id:
                                chainName = ALLOWED_EVM_CHAINS.Optimism;
                                break;
                            case arbitrum.id:
                                chainName = ALLOWED_EVM_CHAINS.Arbitrum;
                                break;
                        }

                        ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                            network: chainName,
                            owner: signer,
                            options: {
                                excludeFilters: [NftFilters.SPAM, NftFilters.AIRDROPS],
                            },
                        }).then((data) => {
                            const convertedNfts = evmMapper(data.ownedNfts, signer);
                            setNFTList(convertedNfts.filter((a) => !a.name.includes("Airdrop")));
                            setShowSpinner(false);
                            // const promises = convertedNfts.map((nft) => {
                            //     return imageExists(nft.logoURI)
                            //         .then(() => true)
                            //         .catch(() => false);
                            // });
                            // Promise.all(promises).catch((results) => {
                            //     convertedNfts = convertedNfts.filter((nft, index) => results[index]);
                            //     setNFTList(convertedNfts);
                            //     setShowSpinner(false);
                            // });
                        });
                    });
                    return;
                } else if (solanaChangeOrConnected) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey as PublicKey).then((nfts) => {
                        setShowSpinner(false);
                        const mappedNFts: INft[] = solanaMapper(nfts);
                        setNFTList(mappedNFts);
                    });
                    return;
                } else if (suiChangeOrConnected) {
                    setUserConnected(true);
                    setShowSpinner(true);
                    SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address as string }).then((nfts) => {
                        setShowSpinner(false);
                        const convertedNfts = suiMapper(nfts);
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
                toastController?.showError("Error when receiving nft: " + error.message);
            } else {
                toastController?.showError("Error when receiving nft: " + error);
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
                    margin: "0.1rem",
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
            {!showSpinner ? (
                <div className="virtual-container">
                    <AutoSizer>
                        {({ height, width }) => {
                            const columns = Math.round(width / 180);
                            return (
                                <Grid
                                    className="nft-list"
                                    columnCount={columns} // Number of columns
                                    columnWidth={width / columns} // Width of each item
                                    height={height} // Height of the grid
                                    rowCount={Math.ceil(NFTList.length / columns)} // Number of rows
                                    rowHeight={170} // Height of each item
                                    width={width} // Width of the grid
                                >
                                    {Cell}
                                </Grid>
                            );
                        }}
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
