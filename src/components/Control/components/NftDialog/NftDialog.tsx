import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { ProgressBar } from "primereact/progressbar";
import { useContext, useEffect, useRef, useState } from "react";
import { SUI_NFT_CLIENT_INSTANCE } from "../../../../config/nft.config";
import { useBurnerFee } from "../../../../hooks/useBurnerFee";
import { handleEvmTransaction } from "../../../../transactions/handleEvmTransaction";
import { handleSolanaTransaction } from "../../../../transactions/handleSolanaTransaction";
import { handleSuiTransaction } from "../../../../transactions/handleSuiTransaction";
import { getNetworkTokenSymbol } from "../../../../utils/getNetworkTokenSymbol";
import { ENftBurnStatus, EvmNft, INft, SolanaNft, SuiNft } from "../../../../utils/types";
import { useEthersSigner } from "../../../NftList/variables";
import { NftContext } from "../../../NftProvider/NftProvider";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { FillButton, StyledDialog } from "./NftDialog.styled";

export const NftDialog = ({ nft, visible, setVisible }: { nft: INft; visible: boolean; setVisible: () => void }) => {
    const NftController = useContext(NftContext);

    const [submit, setSubmit] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [floorPrice, setFloorPrice] = useState<number | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();

    const toastController = useContext(ToastContext);

    const { feeInNetworkToken: burnerFee } = useBurnerFee({ floorPrice, network: nft?.network });
    const burnerFeeToken = getNetworkTokenSymbol(nft?.network);

    useEffect(() => {
        const fetchNftFloorPrice = async () => {
            try {
                if (!nft) {
                    return;
                }

                switch (nft.network) {
                    case ALLOWED_NETWORKS.Sui:
                        const suiNFT = nft as SuiNft;
                        const floorPriceMap = await SUI_NFT_CLIENT_INSTANCE.getFloorPricesMap({});
                        const NftfloorPrice = floorPriceMap.get(suiNFT.nftType);

                        setFloorPrice(NftfloorPrice?.floorPrice ?? null);
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

            // TODO ASAP IMPORTANT: Handle returns from transactions
            if (isEvm) {
                handleEvmTransaction({ nft: nft as EvmNft, signer, burnerFee });
            } else if (isSui) {
                handleSuiTransaction({ nft: nft as SuiNft, signAndExecuteTransactionBlock, burnerFee });
            } else if (isSolana) {
                handleSolanaTransaction({
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

    const handleMouseDown = () => {
        timeoutRef.current = setTimeout(() => handleBurningButtonHoldAction(), 2000);
    };

    const handleMouseUp = (event: React.MouseEvent) => {
        event.preventDefault();
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    return (
        <StyledDialog
            header="Submit burning"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
        >
            <img crossOrigin="anonymous" src={nft?.logoURI} alt={nft?.name} />
            <p>{nft?.name}</p>

            <div className="card">
                <p>NFT price: {floorPrice}</p>
                <p>
                    Burner fee commission: {burnerFee} {burnerFeeToken}
                </p>
                {loading && <ProgressBar mode="indeterminate" style={{ height: "6px", width: "100%" }} />}
            </div>

            <FillButton
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                label="Hold for submit"
                className={submit ? "submit" : ""}
                severity="danger"
                outlined
                disabled={submit}
                size="large"
            ></FillButton>
        </StyledDialog>
    );
};
