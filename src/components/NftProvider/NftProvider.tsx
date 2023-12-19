import { createContext, useState } from "react";
import { ENftBurnStatus, INft } from "../../utils/types";

export const NftContext = createContext<INftController>({
    getActiveNft: () => {
        throw new Error("NftContext not initialized.");
    },
    setActiveNft: () => {
        throw new Error("NftContext not initialized.");
    },
    setNftStatus: () => {
        throw new Error("NftContext not initialized.");
    },
    activeNft: null,
    nftStatus: ENftBurnStatus.EMPTY,
});

interface NftProviderProps {
    children: React.ReactNode;
}

interface INftController {
    getActiveNft: () => INft | null;
    setActiveNft: (nft: INft | null) => void;
    setNftStatus: (nft: ENftBurnStatus) => void;
    activeNft: INft | null;
    nftStatus: ENftBurnStatus;
}

export const NftProvider: React.FC<NftProviderProps> = ({ children }) => {
    const [nftStatus, setNftStatus] = useState<ENftBurnStatus>(ENftBurnStatus.EMPTY);
    const [activeNft, setActiveNft] = useState<INft | null>(null);

    const nftController = {
        getActiveNft: () => {
            return activeNft;
        },
        setActiveNft: (nft: INft | null) => {
            setActiveNft(nft);
        },
        activeNft: activeNft,
        nftStatus,
        setNftStatus: (nft: ENftBurnStatus) => {
            if (nftStatus !== nft) {
                setNftStatus(nft);
            }
        },
    };

    return <NftContext.Provider value={nftController}>{children}</NftContext.Provider>;
};
export default NftProvider;
