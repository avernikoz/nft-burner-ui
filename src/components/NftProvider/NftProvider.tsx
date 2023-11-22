import { createContext, useState } from "react";
import { INft } from "../../utils/types";

export const NftContext = createContext<INftController | null>(null);

interface NftProviderProps {
    children: React.ReactNode;
}

interface INftController {
    getActiveNft: () => INft | null;
    setActiveNft: (nft: INft) => void;
}

export const NftProvider: React.FC<NftProviderProps> = ({ children }) => {
    const [activeNft, setActiveNft] = useState<INft | null>(null);

    const nftController = {
        getActiveNft: () => {
            return activeNft;
        },
        setActiveNft: (nft: INft) => {
            setActiveNft(nft);
        },
    };

    return <NftContext.Provider value={nftController}>{children}</NftContext.Provider>;
};
export default NftProvider;
