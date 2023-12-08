import { createContext, useState } from "react";
import { ENftBurnStatus, INft } from "../../utils/types";

export const NftContext = createContext<INftController | null>(null);

interface NftProviderProps {
    children: React.ReactNode;
}

interface INftController {
    getActiveNft: () => INft | null;
    setActiveNft: (nft: INft) => void;
    setNftStatus: (nft: ENftBurnStatus) => void;
    activeNft: INft | null;
    nftStatus: ENftBurnStatus;
}

export const NftProvider: React.FC<NftProviderProps> = ({ children }) => {
    const [nftStatus, setNftStatus] = useState<ENftBurnStatus>(ENftBurnStatus.EPMTY);
    const [activeNft, setActiveNft] = useState<INft | null>(null);

    const nftController = {
        getActiveNft: () => {
            return activeNft;
        },
        setActiveNft: (nft: INft) => {
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
