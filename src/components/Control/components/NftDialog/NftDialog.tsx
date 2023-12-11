import { useContext, useEffect, useRef, useState } from "react";
import { FillButton, StyledDialog } from "./NftDialog.styled";
import { ProgressBar } from "primereact/progressbar";
import { INft } from "../../../../utils/types";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import {
    ALCHEMY_MULTICHAIN_CLIENT_INSTANCE,
    SOLANA_NFT_CLIENT_INSTANCE,
    SUI_NFT_CLIENT_INSTANCE,
} from "../../../../config/nft.config";
import { useWallet as solanaUseWallet, useConnection } from "@solana/wallet-adapter-react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { Signer } from "ethers";
import { PublicKey } from "@solana/web3.js";
import { evm } from "@avernikoz/nft-sdk";

function NftDialog(props: { nft: INft | null; setNft: () => void; visible: boolean; setVisible: () => void }) {
    const [submit, setSubmit] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [price, setPrice] = useState<number | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { nft, visible, setVisible, setNft } = props;
    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();
    const toastController = useContext(ToastContext);

    useEffect(() => {
        const api = process.env.REACT_APP_SUI_NFT_PRICE_API;
        try {
            if (nft?.nftId && nft?.kioskId && nft?.nftType && api) {
                SUI_NFT_CLIENT_INSTANCE.getFloorPrice({
                    nftCollectionContractType: nft?.nftType,
                    priceApiURL: api,
                }).then(
                    (res) => {
                        console.log(res);
                        setPrice(res.floorPrice);
                    },
                    (err) => {
                        console.log(err);
                        toastController?.showError("Failed to get floor price for nft: " + err.message);
                    },
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                toastController?.showError("Failed to get floor price for nft: " + error.message);
            } else {
                toastController?.showError("Failed to get floor price for nft: " + error);
            }
        }
    }, [nft?.kioskId, nft?.nftId, nft?.nftType, toastController, visible]);

    const handleHold = async () => {
        setSubmit(true);
        try {
            const evmCondition =
                nft &&
                nft?.contractAddress &&
                nft?.contractType &&
                nft?.nftTokenId &&
                nft?.owner &&
                nft?.evm &&
                (nft.contractType == evm.NFTContractStandard.ERC1155 ||
                    nft.contractType == evm.NFTContractStandard.ERC721);
            const suiCondition = nft?.nftId && nft?.kioskId && nft?.nftType;
            const solanaCondition = nft?.solanaAccount && solanaWallet.publicKey;
            if (evmCondition) {
                setLoading(true);
                const payTransaction = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.pay({
                    network: nft?.evm as evm.ALLOWED_EVM_CHAINS,
                    amount: 0.000001,
                });
                await nft.owner?.sendTransaction(payTransaction);
                await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
                    collection: {
                        contractAddress: nft?.contractAddress as string,
                        contractType: nft?.contractType as evm.NFTContractStandard,
                    },
                    nftTokenId: nft?.nftTokenId as string,
                    owner: nft?.owner as Signer,
                });
            }
            if (suiCondition) {
                setLoading(true);
                const payRes = await SUI_NFT_CLIENT_INSTANCE.pay({ amount: 0.01 });
                const burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNFT({
                    nft: {
                        nftId: nft.nftId as string,
                        kioskId: nft.kioskId as string,
                        nftType: nft.nftType as string,
                    },
                    transaction: payRes.transaction,
                });
                await signAndExecuteTransactionBlock({
                    transactionBlock: burnRes.transaction,
                });
            }
            if (solanaCondition) {
                setLoading(true);
                const payRes = await SOLANA_NFT_CLIENT_INSTANCE.pay({
                    amount: 0.01,
                    owner: solanaWallet.publicKey as PublicKey,
                });
                const burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnNFT({
                    owner: solanaWallet?.publicKey as PublicKey,
                    nft: nft?.solanaAccount as {
                        tokenAccount: PublicKey;
                        mint: PublicKey;
                        masterEditionPDA: PublicKey;
                        metadataAccount: PublicKey;
                        collectionMetadata: PublicKey | undefined;
                        isMasterEdition: boolean;
                    },
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

        setVisible();
        setLoading(false);
        setNft();
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
            header="Submit BURNING"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
        >
            <img crossOrigin="anonymous" src={nft?.logoURI} alt={nft?.name} />
            <p>{nft?.name}</p>

            <div className="card">
                <p>NFT price: {price}</p>
                <p>Burner fee commission:</p>
                {loading && <ProgressBar mode="indeterminate" style={{ height: "6px", width: "100%" }}></ProgressBar>}
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
}

export default NftDialog;
