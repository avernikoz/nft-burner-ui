import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tooltip } from "primereact/tooltip";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCurrentAccount, useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { useCallback, useContext, useEffect, useState } from "react";
// import { SUI_NFT_CLIENT_INSTANCE } from "../../../../config/nft.config";
import { useBurnerFee } from "../../../../hooks/useBurnerFee";
import { handleEvmPayTransaction, handleEvmBurnTransaction } from "../../../../transactions/handleEvmTransaction";
import { handleSolanaTransaction } from "../../../../transactions/handleSolanaTransaction";
// import { handleSuiTransaction } from "../../../../transactions/handleSuiTransaction";
import { getNetworkTokenSymbol } from "../../../../utils/getNetworkTokenSymbol";
import { ENftBurnStatus, EvmNft, INft, SolanaCNft, SolanaNft, SuiNft } from "../../../../utils/types";
import { useEthersSigner } from "../../../NftList/variables";
import { NftContext } from "../../../NftProvider/NftProvider";
import { ReactComponent as SuccessCheckmark } from "../../../../assets/svg/successCheckmark.svg";
import { ReactComponent as FailedIcon } from "../../../../assets/svg/failedIcon.svg";
import { ReactComponent as BurnIcon } from "../../../../assets/svg/burnIcon.svg";
import { ReactComponent as InfoIcon } from "../../../../assets/svg/infoIcon.svg";

// instruments
import { ReactComponent as LaserIcon } from "../../../../assets/svg/instruments/updated/Laser.svg";
import { ReactComponent as LighterIcon } from "../../../../assets/svg/instruments/updated/Lighter.svg";
import { ReactComponent as ThunderIcon } from "../../../../assets/svg/instruments/updated/Tunder.svg";

import { ToastContext } from "../../../ToastProvider/ToastProvider";
import {
    BurningCeremonyHighlight,
    BurningCeremonyText,
    DialogImageContainer,
    InstrumentHeadingText,
    InstrumentIconContainer,
    InstrumentNameSection,
    InstrumentNameText,
    InstrumentsContainer,
    InstrumentsDivider,
    InstrumentsMainContainer,
    InstrumentsSection,
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
import { sleep } from "../../../../utils/sleep";
import { useInstumentsPrice } from "../../../../hooks/useInstrumentsPrice";
import { GReactGLBridgeFunctions } from "../../../../webl/reactglBridge";
import { INSTRUMENTS_COLOR_MAP } from "../../../../config/styles.config";
import { useWalletBalance } from "../../../../hooks/useWalletBalance";
import { SWR_CONFIG } from "../../../../config/swr.config";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../../../config/proxy.config";
import ErrorSVG from "../../../../assets/svg/errorLoadNFT.svg";
import { handleSuiTransaction } from "../../../../transactions/handleSuiTransaction";
import { executeSuccessBurnSuiNft } from "../../../../transactions/executeSuccessBurnSuiNft";

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

    const [loadingFirstTransaction, setLoadingFirstTransaction] = useState<boolean>(true);
    const [loadingSecondTransaction, setLoadingSecondTransaction] = useState<boolean>(true);
    const [errorTransaction, setErrorTransaction] = useState<boolean>(false);
    const [onChainBurningSuccess, setOnchainBurningSuccess] = useState<boolean>(false);
    const [onChainFeeSuccess, setOnchainFeeSuccess] = useState<boolean>(false);

    const cleanUpState = () => {
        setErrorTransaction(false);
        setOnchainBurningSuccess(false);
        setOnchainFeeSuccess(false);
        setLoadingFirstTransaction(false);
        setLoadingSecondTransaction(false);
    };

    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        }

        return () => {
            cleanUpState();
            document.body.classList.remove("blur-background");
        };
    }, [visible]);

    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();

    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();
    const toastController = useContext(ToastContext);
    const [instrument, setInstrument] = useState<"laser" | "lighter" | "thunder">("laser");
    const { data: floorPrice } = useNftFloorPrice(nft);
    const { feeInNetworkToken: burnerFee } = useBurnerFee({ floorPrice, network: nft?.network });
    const { instrumentPriceInNetworkToken } = useInstumentsPrice({ instrument, network: nft?.network });
    // TODO: Update in regards of other networks (for multichain)
    const { data: walletBalanceData } = useWalletBalance(
        { address: currentAccount?.address, network: ALLOWED_NETWORKS.Sui },
        { refreshInterval: SWR_CONFIG.refetchInterval.fast },
    );

    // TODO: Move to the hook
    const isBalanceEnoughForBurning =
        burnerFee !== undefined &&
        instrumentPriceInNetworkToken !== undefined &&
        walletBalanceData !== null &&
        walletBalanceData !== undefined &&
        walletBalanceData.balanceFormatted !== null &&
        +walletBalanceData.balanceFormatted > burnerFee + instrumentPriceInNetworkToken;

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
            ReactGA.event({ category: "nft_burn_popup", action: "burn_nft", label: nft.network.toString() });
            if (burnerFee === undefined) {
                throw new Error("Empty burner fuel fee");
            }

            if (instrumentPriceInNetworkToken === undefined) {
                throw new Error("Empty instrument price");
            }

            if (isEvm) {
                setLoadingFirstTransaction(true);
            } else {
                setLoadingFirstTransaction(true);
                setLoadingSecondTransaction(true);
            }

            if (isEvm) {
                await handleEvmPayTransaction({
                    nft: nft as EvmNft,
                    signer,
                    burnerFee: burnerFee + instrumentPriceInNetworkToken,
                });
                setLoadingFirstTransaction(false);
                setLoadingSecondTransaction(true);
                setOnchainFeeSuccess(true);
                await handleEvmBurnTransaction({ nft: nft as EvmNft, signer });
            } else if (isSui) {
                const burnRes = await handleSuiTransaction({
                    nft: nft as SuiNft,
                    burnerFee: burnerFee + instrumentPriceInNetworkToken,
                });
                const executeTransaction = new Promise((resolve, reject) => {
                    signAndExecuteTransactionBlock(
                        {
                            transactionBlock: burnRes.transaction,
                            options: { showEffects: true, showObjectChanges: true, showEvents: true },
                        },
                        {
                            onSuccess: (result) => {
                                executeSuccessBurnSuiNft(result);
                                resolve(result);
                            },
                            onError: (result) => {
                                const errorMessage = result.message || result.name || "Unknown error";
                                reject(`Transaction failed: ${errorMessage}`);
                            },
                        },
                    );
                });
                await executeTransaction;
            } else if (isSolana) {
                await handleSolanaTransaction({
                    nft: nft as SolanaNft | SolanaCNft,
                    solanaConnection: solanaConnection.connection,
                    solanaWallet,
                    burnerFee: burnerFee + instrumentPriceInNetworkToken,
                });
            }

            setOnchainFeeSuccess(true);
            setOnchainBurningSuccess(true);

            setLoadingFirstTransaction(false);
            setLoadingSecondTransaction(false);

            await sleep(3500);
            ReactGA.event({ category: "nft_burn_popup", action: "nft_burned_onchain", label: nft.network.toString() });
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
    const onImageError = useCallback(({ currentTarget }: { currentTarget: HTMLImageElement }) => {
        // Try to get nft image without cors proxy
        if (currentTarget.src.includes(NFT_IMAGES_CORS_PROXY_URL)) {
            currentTarget.onerror = null;
            currentTarget.src = currentTarget.src.replace(NFT_IMAGES_CORS_PROXY_URL, "");
        } else {
            // In case image failed to load even without cors proxy
            currentTarget.onerror = null;
            currentTarget.src = ErrorSVG;
        }
    }, []);

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
                    <NftBurnDialogImg crossOrigin="anonymous" src={nft.logoURI} alt={nft.name} onError={onImageError} />

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
                            <NftBurnDialogInfoValue>
                                {burnerFee === 0 ? `Free` : `${burnerFee} ${burnerFeeToken}`}
                            </NftBurnDialogInfoValue>
                        </NftBurnDialogInfoContainer>
                        <NftBurnDialogInfoContainer>
                            <Tooltip
                                className="tooltip-burner-fee"
                                content="🎶 Elevate your burner vibes with personalized instruments – add a touch of harmony to your creativity!"
                                target={".instruments"}
                                position="top"
                            />
                            <NftBurnDialogInfoTitle className="instruments">
                                Burner Tool Fee <InfoIcon />:
                            </NftBurnDialogInfoTitle>
                            <NftBurnDialogInfoValue>
                                {instrumentPriceInNetworkToken} {burnerFeeToken}
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
                        {onChainFeeSuccess ? (
                            <SuccessCheckmark />
                        ) : loadingFirstTransaction ? (
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        ) : errorTransaction && !onChainFeeSuccess ? (
                            <FailedIcon />
                        ) : !loadingFirstTransaction && !onChainFeeSuccess ? (
                            <BurnIcon />
                        ) : null}
                        <StatusTransactionText $isActive={loadingFirstTransaction}>
                            Confirming your burn fee transaction
                        </StatusTransactionText>
                    </StatusTransactionContainer>
                    <StatusTransactionContainer>
                        {onChainBurningSuccess ? (
                            <SuccessCheckmark />
                        ) : loadingSecondTransaction ? (
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        ) : errorTransaction && !onChainBurningSuccess ? (
                            <FailedIcon />
                        ) : !loadingSecondTransaction && !onChainBurningSuccess ? (
                            <BurnIcon />
                        ) : null}
                        <StatusTransactionText $isActive={loadingSecondTransaction}>
                            Confirming your burn nft transaction
                        </StatusTransactionText>
                    </StatusTransactionContainer>
                </div>
            </NftBurnDialogContainer>
            <InstrumentHeadingText>Choose Your Tool</InstrumentHeadingText>
            <>
                <Tooltip
                    className="tooltip-burner-fee"
                    content="🎶 Available on Level 0"
                    target={".laser-container"}
                    position="top"
                />
                <Tooltip
                    className="tooltip-burner-fee"
                    content="🎶 Available on Level 5 for free"
                    target={".thunder-container"}
                    position="top"
                />
                <Tooltip
                    className="tooltip-burner-fee"
                    content="🎶 Available on Level 3 for free"
                    target={".lighter-container"}
                    position="top"
                />
                <InstrumentsMainContainer>
                    <InstrumentsSection>
                        <InstrumentsContainer>
                            <InstrumentIconContainer
                                className="laser-container"
                                $isActive={instrument === "laser"}
                                $activeColor={INSTRUMENTS_COLOR_MAP.laser}
                                onClick={() => {
                                    GReactGLBridgeFunctions.OnInstrumentClick("laser");
                                    setInstrument("laser");
                                }}
                            >
                                <LaserIcon />
                            </InstrumentIconContainer>

                            <InstrumentIconContainer
                                className="lighter-container"
                                $isActive={instrument === "lighter"}
                                $activeColor={INSTRUMENTS_COLOR_MAP.lighter}
                                onClick={() => {
                                    GReactGLBridgeFunctions.OnInstrumentClick("lighter");
                                    setInstrument("lighter");
                                }}
                            >
                                <LighterIcon />
                            </InstrumentIconContainer>
                            <InstrumentIconContainer
                                className="thunder-container"
                                $isActive={instrument === "thunder"}
                                $activeColor={INSTRUMENTS_COLOR_MAP.thunder}
                                onClick={() => {
                                    GReactGLBridgeFunctions.OnInstrumentClick("thunder");
                                    setInstrument("thunder");
                                }}
                            >
                                <ThunderIcon />
                            </InstrumentIconContainer>
                        </InstrumentsContainer>
                    </InstrumentsSection>

                    <InstrumentNameSection>
                        <InstrumentsDivider />
                        <InstrumentNameText $activeColor={INSTRUMENTS_COLOR_MAP[instrument]}>
                            {instrument.toUpperCase()}
                        </InstrumentNameText>
                    </InstrumentNameSection>
                </InstrumentsMainContainer>
            </>
            <div>
                <ConfirmBurningButton
                    style={{ width: "100%", display: "flex" }}
                    disabled={loadingFirstTransaction || loadingSecondTransaction || !isBalanceEnoughForBurning}
                    onClick={handleBurn}
                >
                    {onChainBurningSuccess && onChainFeeSuccess ? (
                        <>
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                            Filling the Burner with Fuel...
                        </>
                    ) : loadingFirstTransaction || loadingSecondTransaction ? (
                        <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                    ) : !isBalanceEnoughForBurning ? (
                        `Your SUI balance is low for burning NFT`
                    ) : (
                        `Commence burning ritual`
                    )}
                </ConfirmBurningButton>
            </div>
        </StyledDialog>
    );
};
