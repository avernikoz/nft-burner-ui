import * as Sentry from "@sentry/react";

import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../config/nft.config";

import { PublicKey } from "@solana/web3.js";
import { NftFilters } from "alchemy-sdk";
import { ProgressSpinner } from "primereact/progressspinner";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid } from "react-window";
import EmptySVG from "../../assets/svg/emptyNFT.svg";
import { filterOutCNFTDuplicates } from "../../utils/filterOutCNFTDuplicates";
import { ENftBurnStatus, INft, SolanaCNft } from "../../utils/types";
import { EmptyNFTList } from "../EmptyNFTList/EmptyNFTList";
import { NftItem } from "../NftItem/NftItem";
import { NftContext } from "../NftProvider/NftProvider";
import { ToastContext } from "../ToastProvider/ToastProvider";
import { List, NftListAutosizerContainer, NftListTitle, SpinnerContainer } from "./NftList.styled";
import { evmMapper, solanaCNFTMapper, solanaNFTMapper, suiMapper } from "./mappers";
import { getChainName, getItemSize, getRowCount } from "./utils";
import { useEthersSigner } from "./variables";

export const NftList = () => {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const signer = useEthersSigner();
    const [nftList, setNFTList] = useState<INft[]>([]);
    const wagmiAccount = useAccount();
    const [activeNft, setActiveNft] = useState<number | null>(null);
    const [showSpinner, setShowSpinner] = useState<boolean>(true);
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
                    const wagmiChangeOrConnected =
                        wagmiAccount.isConnected && wagmiAccount.address && !!signer?.address;
                    const solanaChangeOrConnected = solanaWallet.connected && solanaWallet.publicKey !== null;
                    const suiChangeOrConnected = suietWallet.connected && !!suietWallet.address;

                    if (!wagmiChangeOrConnected && !solanaChangeOrConnected && !suiChangeOrConnected) {
                        return;
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
                        const pubkey = solanaWallet.publicKey as PublicKey;

                        const rawNfts = await SOLANA_NFT_CLIENT_INSTANCE.getNFTs(pubkey);
                        const mappedNFts = solanaNFTMapper(rawNfts);
                        const basicNFTs: INft[] = mappedNFts;

                        const rawCNfts = await SOLANA_NFT_CLIENT_INSTANCE.getCNFTs(pubkey);
                        const mappedCNFTs: SolanaCNft[] = solanaCNFTMapper(rawCNfts);
                        const filtredCNFTs = filterOutCNFTDuplicates(mappedNFts, mappedCNFTs);

                        const allSolanaNFTs: INft[] = basicNFTs.concat(filtredCNFTs);
                        setNFTList(allSolanaNFTs);
                    } else if (suiChangeOrConnected) {
                        const rawNfts = await SUI_NFT_CLIENT_INSTANCE.getNFTs({ owner: suietWallet.address as string });
                        const convertedNfts = suiMapper(rawNfts);
                        setNFTList(convertedNfts);
                    } else {
                        setActiveNft(null);
                        setNFTList([]);
                    }
                    setShowSpinner(false);
                }
            } catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    toastController?.showError("Error fetching nft: " + error.message);
                } else {
                    toastController?.showError("Error fetching nft: " + error);
                }

                setShowSpinner(false);
                // TODO: Improve that log
                Sentry.captureException(error, {
                    tags: { scenario: "fetch_nfts" },
                });
            }
        };

        fetchNfts();
    }, [
        NftController.nftStatus,
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

    const isNFTListLoaded = !showSpinner;
    const isNFTListEmpty = nftList.length === 0;

    // console.debug("isNFTListLoaded: ", isNFTListLoaded);
    // console.debug("isNFTListEmpty: ", isNFTListEmpty);
    // console.debug("showSpinner: ", showSpinner);

    return (
        <List $isListEmpty={isNFTListLoaded && isNFTListEmpty}>
            {isNFTListLoaded && isNFTListEmpty && <EmptyNFTList />}
            {isNFTListLoaded && !isNFTListEmpty && (
                <>
                    <NftListTitle>NFT Viewer</NftListTitle>
                    <NftListAutosizerContainer className="nftListAutosizerContainer">
                        <AutoSizer>
                            {({ height, width }) => {
                                const columnCount = 4;
                                const rowCount = getRowCount(nftList);

                                const { itemSize, paddingSize } = getItemSize(width);

                                return (
                                    <Grid
                                        className="nft-list"
                                        columnCount={columnCount} // Number of columns
                                        columnWidth={itemSize} // Width of each item
                                        height={height} // Height of the grid
                                        rowCount={rowCount} // Number of rows
                                        rowHeight={itemSize} // Height of each item
                                        width={width} // Width of the grid
                                    >
                                        {({ columnIndex, rowIndex, style }) => {
                                            {
                                                const CELL_GAP = paddingSize;
                                                const index = rowIndex * 4 + columnIndex;
                                                const defaultEmptyImage = { logoURI: EmptySVG };
                                                const item = nftList[index] ?? defaultEmptyImage;

                                                return (
                                                    <div
                                                        style={{
                                                            ...style,
                                                            left:
                                                                columnIndex === 0
                                                                    ? style.left
                                                                    : Number(style.left) + columnIndex * CELL_GAP,
                                                            right:
                                                                columnIndex === columnCount
                                                                    ? style.right
                                                                    : Number(style.right) + columnIndex * CELL_GAP,
                                                            top:
                                                                rowIndex === 0
                                                                    ? style.top
                                                                    : Number(style.top) + rowIndex * CELL_GAP,
                                                        }}
                                                    >
                                                        <NftItem
                                                            item={item}
                                                            key={index}
                                                            isActive={index == activeNft}
                                                            onClick={() => handleItemClick(item)}
                                                        />
                                                    </div>
                                                );
                                            }
                                        }}
                                    </Grid>
                                );
                            }}
                        </AutoSizer>
                    </NftListAutosizerContainer>
                </>
            )}
            {!isNFTListLoaded && (
                <SpinnerContainer>
                    <ProgressSpinner />
                </SpinnerContainer>
            )}
        </List>
    );
};
