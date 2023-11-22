import { useRef, useState } from "react";
import { FillButton, StyledDialog } from "./NftDialog.styled";
import { ProgressBar } from "primereact/progressbar";
import { INft } from "../../../../utils/types";
import { ALCHEMY_MULTICHAIN_CLIENT_INSTANCE } from "../../../../config/nft.config";
export enum NFTContractStandard {
    ERC1155 = "ERC1155",
    ERC721 = "ERC721",
}
function NftDialog(props: { nft: INft | null; visible: boolean; setVisible: () => void }) {
    const [isHolding, setIsHolding] = useState<boolean>(false);
    const [submit, setSubmit] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { nft, visible, setVisible } = props;

    const handleHold = () => {
        console.log(isHolding);
        setSubmit(true);
        if (
            nft?.contractAddress &&
            nft?.contractType &&
            nft?.nftTokenId &&
            nft?.owner &&
            (nft.contractType == NFTContractStandard.ERC1155 || nft.contractType == NFTContractStandard.ERC721)
        ) {
            ALCHEMY_MULTICHAIN_CLIENT_INSTANCE.burnNFT({
                collection: {
                    contractAddress: nft?.contractAddress,
                    contractType: nft?.contractType,
                },
                nftTokenId: nft?.nftTokenId,
                owner: nft?.owner,
            });
        }
    };

    const handleMouseDown = () => {
        setIsHolding(true);
        timeoutRef.current = setTimeout(() => handleHold(), 2000);
    };

    const handleMouseUp = (event: React.MouseEvent) => {
        event.preventDefault();
        setIsHolding(false);
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
                {submit && <ProgressBar mode="indeterminate" style={{ height: "6px", width: "100%" }}></ProgressBar>}
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
