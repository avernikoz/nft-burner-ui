import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useContext, useEffect, useRef, useState } from "react";
// import { SUI_NFT_CLIENT_INSTANCE } from "../../../../config/nft.config";
import { useBurnerFee } from "../../../../hooks/useBurnerFee";
import { handleEvmPayTransaction, handleEvmBurnTransaction } from "../../../../transactions/handleEvmTransaction";
import { handleSolanaTransaction } from "../../../../transactions/handleSolanaTransaction";
import { handleSuiTransaction } from "../../../../transactions/handleSuiTransaction";
import { getNetworkTokenSymbol } from "../../../../utils/getNetworkTokenSymbol";
import { ENftBurnStatus, EvmNft, INft, SolanaNft, SuiNft } from "../../../../utils/types";
import { useEthersSigner } from "../../../NftList/variables";
import { NftContext } from "../../../NftProvider/NftProvider";
import { ReactComponent as SuccessCheckmark } from "../../../../assets/svg/successCheckmark.svg";

import { ToastContext } from "../../../ToastProvider/ToastProvider";
import {
    BurningCeremonyHighlight,
    BurningCeremonyText,
    DialogImageContainer,
    NftDialogContainer,
    NftDialogImg,
    NftDialogImgTitle,
    NftDialogInfoContainer,
    NftDialogInfoTitle,
    NftDialogInfoValue,
    StatusTransactionContainer,
    StatusTransactionText,
    StyledDialog,
    WarningContainer,
    WarningText,
} from "./NftDialog.styled";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmBurningButton } from "../../../ConfirmBurningButton/ConfirmBurningButton";

export const NftDialog = ({ nft, visible, setVisible }: { nft: INft; visible: boolean; setVisible: () => void }) => {
    const NftController = useContext(NftContext);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [submit, setSubmit] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [floorPrice, setFloorPrice] = useState<number | null>(null);

    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        } else {
            document.body.classList.remove("blur-background");
        }
    }, [visible]);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();

    const toastController = useContext(ToastContext);

    const { feeInNetworkToken: burnerFee } = useBurnerFee({ floorPrice, network: nft?.network });
    const burnerFeeToken = getNetworkTokenSymbol(nft?.network);

    useEffect(() => {
        // TODO: Rewrite it with hook + swr
        const fetchNftFloorPrice = async () => {
            try {
                if (!nft) {
                    return;
                }

                switch (nft.network) {
                    case ALLOWED_NETWORKS.Sui:
                        // const suiNFT = nft as SuiNft;
                        // const floorPriceMap = await SUI_NFT_CLIENT_INSTANCE.getFloorPricesMap({});
                        // const NftfloorPrice = floorPriceMap.get(suiNFT.nftType);

                        // setFloorPrice(NftfloorPrice?.floorPrice ?? null);
                        break;
                    case ALLOWED_NETWORKS.Solana:
                        // const solanaNFT = nft as SolanaNft;
                        break;
                    case ALLOWED_NETWORKS.Ethereum:
                    case ALLOWED_NETWORKS.Arbitrum:
                    case ALLOWED_NETWORKS.Optimism:
                    case ALLOWED_NETWORKS.Polygon:
                        // const evmNFT = nft as EvmNft;

                        break;
                }
            } catch (error) {
                if (error instanceof Error) {
                    toastController?.showError("Failed to get floor price for nft: " + error.message);
                } else {
                    toastController?.showError("Failed to get floor price for nft: " + error);
                }
            }
        };

        fetchNftFloorPrice();
    }, [nft, toastController, visible]);

    const handleBurningButtonHoldAction = async () => {
        try {
            if (!burnerFee) {
                return;
            }
            setSubmit(true);
            setLoading(true);

            const isEvm = [
                ALLOWED_NETWORKS.Arbitrum,
                ALLOWED_NETWORKS.Ethereum,
                ALLOWED_NETWORKS.Optimism,
                ALLOWED_NETWORKS.Polygon,
            ].includes(nft.network);
            const isSui = nft.network === ALLOWED_NETWORKS.Sui;
            const isSolana = nft.network === ALLOWED_NETWORKS.Solana;

            if (isEvm) {
                await handleEvmPayTransaction({ nft: nft as EvmNft, signer, burnerFee });
                await handleEvmBurnTransaction({ nft: nft as EvmNft, signer });
            } else if (isSui) {
                await handleSuiTransaction({ nft: nft as SuiNft, signAndExecuteTransactionBlock, burnerFee });
            } else if (isSolana) {
                await handleSolanaTransaction({
                    nft: nft as SolanaNft,
                    solanaConnection: solanaConnection.connection,
                    solanaWallet,
                    burnerFee,
                });
            }

            NftController.setNftStatus(ENftBurnStatus.BURNED_ONCHAIN);
        } catch (error) {
            if (error instanceof Error) {
                toastController?.showError("Failed to process transactions: " + error.message);
            } else {
                toastController?.showError("Failed to process transactions: " + error);
            }
        }

        setVisible();
        setLoading(false);
        setSubmit(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMouseDown = () => {
        timeoutRef.current = setTimeout(() => handleBurningButtonHoldAction(), 2000);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMouseUp = (event: React.MouseEvent) => {
        event.preventDefault();
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    return (
        <StyledDialog
            header="Confirm burning"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
            draggable={false}
            resizable={false}
        >
            <NftDialogContainer>
                <DialogImageContainer>
                    <NftDialogImg crossOrigin="anonymous" src={nft.logoURI} alt={nft.name} />

                    <NftDialogImgTitle>
                        {nft.name.length > 12 ? nft.name.substring(0, 12) + "..." : nft.name}
                    </NftDialogImgTitle>
                </DialogImageContainer>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div>
                        <NftDialogInfoContainer>
                            <NftDialogInfoTitle>Floor price:</NftDialogInfoTitle>
                            <NftDialogInfoValue>{nft.name}</NftDialogInfoValue>
                        </NftDialogInfoContainer>
                        <NftDialogInfoContainer>
                            <NftDialogInfoTitle>Burning fee:</NftDialogInfoTitle>
                            <NftDialogInfoValue>
                                {burnerFee} {burnerFeeToken}
                            </NftDialogInfoValue>
                        </NftDialogInfoContainer>
                    </div>
                    <div>
                        <BurningCeremonyText>
                            Once the transaction is confirmed, you will be allowed to held the{" "}
                            <BurningCeremonyHighlight>burning ceremony.</BurningCeremonyHighlight>
                        </BurningCeremonyText>
                    </div>

                    <WarningContainer>
                        <WarningText>
                            Warning: your NFT will be burned forever; this action cannot be undone.
                        </WarningText>
                    </WarningContainer>
                    <StatusTransactionContainer>
                        <SuccessCheckmark />
                        <StatusTransactionText>Confirming your burn fee transaction</StatusTransactionText>
                    </StatusTransactionContainer>
                    <StatusTransactionContainer>
                        <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        <StatusTransactionText $isActive={true}>
                            Confirming your burn nft transaction
                        </StatusTransactionText>
                    </StatusTransactionContainer>
                </div>
            </NftDialogContainer>
            <div>
                <ConfirmBurningButton style={{ width: "100%" }}>Commence burning ritual</ConfirmBurningButton>
            </div>
        </StyledDialog>
    );
};
