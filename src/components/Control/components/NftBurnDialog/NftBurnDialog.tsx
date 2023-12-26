import * as Sentry from "@sentry/react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tooltip } from "primereact/tooltip";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useContext, useEffect, useState } from "react";
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
import { ReactComponent as FailedIcon } from "../../../../assets/svg/failedIcon.svg";
import { ReactComponent as BurnIcon } from "../../../../assets/svg/burnIcon.svg";
import { ReactComponent as InfoIcon } from "../../../../assets/svg/infoIcon.svg";

import { ToastContext } from "../../../ToastProvider/ToastProvider";
import {
    BurningCeremonyHighlight,
    BurningCeremonyText,
    DialogImageContainer,
    NftBurnDialogContainer,
    NftBurnDialogImg,
    NftBurnDialogImgTitle,
    NftBurnDialogInfoContainer,
    NftBurnDialogInfoTitle,
    NftBurnDialogInfoValue,
    StatusTransactionContainer,
    StatusTransactionText,
    StyledDialog,
    WarningContainer,
    WarningText,
} from "./NftBurnDialog.styled";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmBurningButton } from "../../../ConfirmBurningButton/ConfirmBurningButton";
import { useNftFloorPrice } from "../../../../hooks/useNftFloorPrice";

export const NftBurnDialog = ({
    nft,
    visible,
    setVisible,
}: {
    nft: INft;
    visible: boolean;
    setVisible: () => void;
}) => {
    const NftController = useContext(NftContext);

    const [loadingFirstTransaction, setLoadingFirstTransaction] = useState<boolean>(false);
    const [loadingSecondTransaction, setLoadingSecondTransaction] = useState<boolean>(false);
    const [errorTransaction, setErrorTransaction] = useState<boolean>(false);

    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        } else {
            setErrorTransaction(false);
            document.body.classList.remove("blur-background");
        }

        return () => {
            document.body.classList.remove("blur-background");
        };
    }, [visible]);

    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();
    const toastController = useContext(ToastContext);
    const { data: floorPrice } = useNftFloorPrice(nft);
    const { feeInNetworkToken: burnerFee } = useBurnerFee({ floorPrice, network: nft?.network });

    const burnerFeeToken = getNetworkTokenSymbol(nft?.network);

    const isEvm = [
        ALLOWED_NETWORKS.Arbitrum,
        ALLOWED_NETWORKS.Ethereum,
        ALLOWED_NETWORKS.Optimism,
        ALLOWED_NETWORKS.Polygon,
    ].includes(nft.network);
    const isSui = nft.network === ALLOWED_NETWORKS.Sui;
    const isSolana = nft.network === ALLOWED_NETWORKS.Solana;

    const handleBurn = async () => {
        try {
            if (!burnerFee) {
                throw new Error("Empty burner fuel fee");
            }

            if (isEvm) {
                setLoadingFirstTransaction(true);
            } else {
                setLoadingFirstTransaction(true);
                setLoadingSecondTransaction(true);
            }

            if (isEvm) {
                await handleEvmPayTransaction({ nft: nft as EvmNft, signer, burnerFee });
                setLoadingFirstTransaction(false);
                setLoadingSecondTransaction(true);
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
            setVisible();
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                toastController?.showError("Failed to process transactions: " + error.message);
            } else {
                toastController?.showError("Failed to process transactions: " + error);
            }

            Sentry.captureException(error, {
                tags: { scenario: "burn_transaction_sign_and_send" },
                extra: { chain: { id: nft.network } },
            });

            setErrorTransaction(true);
        }

        setLoadingFirstTransaction(false);
        setLoadingSecondTransaction(false);
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
            <NftBurnDialogContainer>
                <DialogImageContainer>
                    <NftBurnDialogImg crossOrigin="anonymous" src={nft.logoURI} alt={nft.name} />

                    <NftBurnDialogImgTitle>
                        {nft.name.length > 12 ? nft.name.substring(0, 12) + "..." : nft.name}
                    </NftBurnDialogImgTitle>
                </DialogImageContainer>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div>
                        {floorPrice !== null && floorPrice !== undefined && (
                            <NftBurnDialogInfoContainer>
                                <NftBurnDialogInfoTitle>Floor price:</NftBurnDialogInfoTitle>
                                <NftBurnDialogInfoValue>{floorPrice}</NftBurnDialogInfoValue>
                            </NftBurnDialogInfoContainer>
                        )}
                        <NftBurnDialogInfoContainer>
                            <Tooltip
                                className="tooltip-burner-fee"
                                content="💸 Why the fee? It keeps NFT Burner running smoothly. Your support fuels the fire. Thank you!"
                                target={".burn-fuel-fee"}
                                position="top"
                            />
                            <NftBurnDialogInfoTitle className="burn-fuel-fee">
                                Burner Fuel Fee <InfoIcon />:
                            </NftBurnDialogInfoTitle>
                            {/* </Tooltip> */}
                            <NftBurnDialogInfoValue>
                                {burnerFee} {burnerFeeToken}
                            </NftBurnDialogInfoValue>
                        </NftBurnDialogInfoContainer>
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
                        {loadingFirstTransaction ? (
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        ) : errorTransaction ? (
                            <FailedIcon />
                        ) : !loadingFirstTransaction ? (
                            <BurnIcon />
                        ) : (
                            <SuccessCheckmark />
                        )}
                        <StatusTransactionText $isActive={loadingFirstTransaction}>
                            Confirming your burn fee transaction
                        </StatusTransactionText>
                    </StatusTransactionContainer>
                    <StatusTransactionContainer>
                        {loadingSecondTransaction ? (
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        ) : errorTransaction ? (
                            <FailedIcon />
                        ) : !loadingSecondTransaction ? (
                            <BurnIcon />
                        ) : (
                            <SuccessCheckmark />
                        )}
                        <StatusTransactionText $isActive={loadingSecondTransaction}>
                            Confirming your burn nft transaction
                        </StatusTransactionText>
                    </StatusTransactionContainer>
                </div>
            </NftBurnDialogContainer>
            <div>
                <ConfirmBurningButton style={{ width: "100%" }} onClick={handleBurn}>
                    Commence burning ritual
                </ConfirmBurningButton>
            </div>
        </StyledDialog>
    );
};
