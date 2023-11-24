import { useRef, useState } from "react";
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

export enum NFTContractStandard {
    ERC1155 = "ERC1155",
    ERC721 = "ERC721",
}

function NftDialog(props: { nft: INft | null; setNft: () => void; visible: boolean; setVisible: () => void }) {
    const [submit, setSubmit] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { nft, visible, setVisible, setNft } = props;
    const { signAndExecuteTransactionBlock } = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const solanaConnection = useConnection();

    const handleHold = async () => {
        setSubmit(true);
        if (
            nft?.contractAddress &&
            nft?.contractType &&
            nft?.nftTokenId &&
            nft?.owner &&
            nft?.evm &&
            (nft.contractType == NFTContractStandard.ERC1155 || nft.contractType == NFTContractStandard.ERC721)
        ) {
            setLoading(true);
            const payTransaction = await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.pay({ network: nft.evm, amount: 0.01 });
            console.log(payTransaction);

            await nft.owner.sendTransaction(payTransaction);
            await ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
                collection: {
                    contractAddress: nft?.contractAddress,
                    contractType: nft?.contractType,
                },
                nftTokenId: nft?.nftTokenId,
                owner: nft?.owner,
            });

            setVisible();
            setLoading(false);
            setNft();
        }
        if (nft?.nftId && nft?.kioskId && nft?.nftType) {
            setLoading(true);
            console.log(nft);
            const payRes = await SUI_NFT_CLIENT_INSTANCE.pay({ amount: 0.01 });
            const burnRes = await SUI_NFT_CLIENT_INSTANCE.burnNFT({
                nft: {
                    nftId: nft.nftId,
                    kioskId: nft.kioskId,
                    nftType: nft.nftType,
                },
                transaction: payRes.transaction,
            });
            await signAndExecuteTransactionBlock({
                transactionBlock: burnRes.transaction,
            });
            setVisible();
            setLoading(false);
            setNft();
        }
        if (nft?.solanaAccount && solanaWallet.publicKey) {
            setLoading(true);
            console.log(nft);
            const payRes = await SOLANA_NFT_CLIENT_INSTANCE.pay({
                amount: 0.01,
                owner: solanaWallet.publicKey,
            });
            const burnRes = await SOLANA_NFT_CLIENT_INSTANCE.burnNFT({
                owner: solanaWallet.publicKey,
                nft: nft.solanaAccount,
                transaction: payRes,
            });

            const transactionResult = await solanaWallet.sendTransaction(burnRes, solanaConnection.connection);
            console.log(transactionResult);
            setVisible();
            setLoading(false);
            setNft();
        }
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
            <img
                crossOrigin="anonymous"
                src={nft?.logoURI}
                alt={nft?.name}
                style={{ width: "300px", height: "300px" }}
            />
            <p>Tetris</p>

            <div className="card">
                <p>NFT price: 2200$</p>
                <p>Burner fee commission: 5$</p>
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
