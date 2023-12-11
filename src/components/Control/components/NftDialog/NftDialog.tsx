import { useContext, useEffect, useRef, useState } from "react";
import { FillButton, StyledDialog } from "./NftDialog.styled";
import { ProgressBar } from "primereact/progressbar";
import { ENftBurnStatus, EvmNft, INft, SolanaNft, SuiNft } from "../../../../utils/types";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../../../config/nft.config";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { useEthersSigner } from "../../../NftList/variables";
import { NftContext } from "../../../NftProvider/NftProvider";

export const NftDialog = ({
    nft,
    visible,
    setVisible,
}: {
    nft: INft | null;
    visible: boolean;
    setVisible: () => void;
}) => {
    const NftController = useContext(NftContext);

    const [submit, setSubmit] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [price, setPrice] = useState<number | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const signer = useEthersSigner();

    const toastController = useContext(ToastContext);

    // TODO: Unmock
    const burnerFee = 0.000000001;

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
                        const floorPrice = floorPriceMap.get(suiNFT.nftType);

                        setPrice(floorPrice?.floorPrice ?? null);
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

    const handleHold = async () => {
        try {
            if (!nft) {
                return;
            }
            setSubmit(true);
            setLoading(true);

            const evmCondition =
                nft.network === ALLOWED_NETWORKS.Arbitrum ||
                nft.network === ALLOWED_NETWORKS.Ethereum ||
                nft.network === ALLOWED_NETWORKS.Optimism ||
                nft.network === ALLOWED_NETWORKS.Polygon;
            const suiCondition = nft.network === ALLOWED_NETWORKS.Sui;
            const solanaCondition = nft.network === ALLOWED_NETWORKS.Solana;

            if (evmCondition) {
                if (!signer) {
                    return;
                }

                const evmNFT = nft as EvmNft;
                const payTransaction = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.pay({
                    network: evmNFT.evmNetworkType,
                    amount: burnerFee,
                });
                await signer.sendTransaction(payTransaction);
                await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
                    collection: {
                        contractAddress: evmNFT.contractAddress,
                        contractType: evmNFT.contractType,
                    },
                    nftTokenId: evmNFT?.nftTokenId,
                    owner: signer,
                });
            }
            if (suiCondition) {
                const suiNFT = nft as SuiNft;
                const payRes = await SUI_NFT_CLIENT_INSTANCE.pay({ amount: burnerFee });
                const burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNFT({
                    nft: suiNFT,
                    transaction: payRes.transaction,
                });
                await signAndExecuteTransactionBlock({
                    transactionBlock: burnRes.transaction,
                });
            }
            if (solanaCondition) {
                if (!solanaWallet.publicKey) {
                    return;
                }

                const solanaNFT = nft as SolanaNft;
                const payRes = await SOLANA_NFT_CLIENT_INSTANCE.pay({
                    amount: burnerFee,
                    owner: solanaWallet.publicKey,
                });
                const burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnNFT({
                    owner: solanaWallet.publicKey,
                    nft: solanaNFT.solanaAccount,
                    transaction: payRes,
                });

                await solanaWallet.sendTransaction(burnRes, solanaConnection.connection);
            }
        } catch (error) {
            if (error instanceof Error) {
                toastController?.showError("Failed to process transactions: " + error.message);
            } else {
                toastController?.showError("Failed to process transactions: " + error);
            }
        }

        NftController.setNftStatus(ENftBurnStatus.BURNED_ONCHAIN);
        setVisible();
        setLoading(false);
        setSubmit(false);
    };

    const handleMouseDown = () => {
        timeoutRef.current = setTimeout(() => handleHold(), 2000);
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
                <p>NFT price: {price}</p>
                <p>Burner fee commission: {burnerFee}</p>
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
