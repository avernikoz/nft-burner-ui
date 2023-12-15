import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import React, { useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../config/nft.config";

import { PublicKey } from "@solana/web3.js";
import { NftFilters } from "alchemy-sdk";
import { ProgressSpinner } from "primereact/progressspinner";
import { AutoSizer } from "react-virtualized";
import { FixedSizeGrid as Grid } from "react-window";
import { ENftBurnStatus, INft } from "../../utils/types";
import NftItem from "../NftItem/NftItem";
import { NftContext } from "../NftProvider/NftProvider";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { List, NftListTitle } from "./NftList.styled";
import { evmMapper, solanaMapper, suiMapper } from "./mappers";
import { useEthersSigner } from "./variables";
import { getChainName } from "./utils";

export const NftList = () => {
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
        setActiveNft(nft.id);
        NftController.setActiveNft(nft);
        NftController.setNftStatus(ENftBurnStatus.SELECTED);
    };

    useEffect(() => {
        const fetchNfts = async () => {
            try {
                if (
                    NftController.nftStatus === ENftBurnStatus.BURNED_ONCHAIN ||
                    NftController.nftStatus === ENftBurnStatus.EMPTY
                ) {
                    const wagmiChangeOrConnected = wagmiAccount.isConnected && wagmiAccount.address && signer;
                    const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey;
                    const suiChangeOrConnected = suietWallet.connected && suietWallet.address;

                    if (wagmiChangeOrConnected || solanaChangeOrConnected || suiChangeOrConnected) {
                        setUserConnected(true);
                        setShowSpinner(true);
                    }

                    if (wagmiChangeOrConnected) {
                        const chainId = await wagmiAccount.connector?.getChainId();
                        const chainName = getChainName(chainId);
                        const rawNftsData = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.getNFTs({
                            network: chainName,
                            owner: signer,
                            options: {
                                excludeFilters: [NftFilters.SPAM, NftFilters.AIRDROPS],
                            },
                        });
                        const convertedNfts = evmMapper(rawNftsData.ownedNfts, signer, chainName);
                        const filtredNfts = convertedNfts.filter((a) => !a.name.includes("Airdrop"));
                        setNFTList(filtredNfts);
                    } else if (solanaChangeOrConnected) {
                        const rawNfts = await SOLANA_NFT_CLIENT_INSTANCE.getNFTs(solanaWallet.publicKey as PublicKey);
                        const mappedNFts: INft[] = solanaMapper(rawNfts);
                        setNFTList(mappedNFts);
                    } else if (suiChangeOrConnected) {
                        const rawNfts = await SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address as string });
                        const convertedNfts = suiMapper(rawNfts);
                        setNFTList(convertedNfts);
                    } else {
                        setUserConnected(false);
                        setActiveNft(null);
                        setNFTList([]);
                    }
                    setShowSpinner(false);
                }
            } catch (error) {
                if (error instanceof Error) {
                    toastController?.showError("Error fetching nft: " + error.message);
                } else {
                    toastController?.showError("Error fetching nft: " + error);
                }
            }
        };

        fetchNfts();
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
            {!userConnected ? (
                <NftListTitle>Connect your wallet</NftListTitle>
            ) : (
                <NftListTitle>NFT Viewer</NftListTitle>
            )}
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
};
