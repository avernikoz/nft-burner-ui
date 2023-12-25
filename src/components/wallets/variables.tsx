import { IAccount, IMenuConnectionItem } from "./types";
import { Connector } from "wagmi";
import { arbitrum, mainnet, optimism, polygon } from "wagmi/chains";
import RainbowWalletList from "./components/RainbowWalletList/RainbowWalletList";
import SuietWalletList from "./components/SuietWalletList/SuietWalletList";
import SolanaWalletList from "./components/SolanaWalletList/SolanaWalletList";

import { ReactComponent as SuietLogo } from "./assets/suietLogo.svg";
import { ReactComponent as SolanaLogo } from "./assets/solana.svg";
import { ReactComponent as EthereumLogo } from "./assets/ethereum-logo.svg";
import { ReactComponent as OptimismLogo } from "./assets/optimism-logo.svg";
import { ReactComponent as ArbitrumLogo } from "./assets/arbitrum-logo.svg";
import { ReactComponent as PolygonLogo } from "./assets/polygonLogo.svg";

export function createMenuItems(
    switchChain: (index: number, id: number) => void,
    connect: (acc: IAccount) => void,
    setActiveRainConnector: (conn: Connector) => void,
    setActiveIndex: (num: number) => void,
    activeIndex: number,
    disconnect: () => void,
): IMenuConnectionItem[] {
    return [
        {
            label: "Ethereum",
            icon: <EthereumLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                switchChain(0, mainnet.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={mainnet.id}
                />
            ),
            chainId: mainnet.id,
        },
        {
            label: "Polygon",
            icon: <PolygonLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                switchChain(1, polygon.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={polygon.id}
                />
            ),
            chainId: polygon.id,
        },
        {
            label: "Arbitrum",
            icon: <ArbitrumLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                switchChain(2, arbitrum.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={arbitrum.id}
                />
            ),
            chainId: arbitrum.id,
        },
        {
            label: "Optimism",
            icon: <OptimismLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                switchChain(3, optimism.id);
            },
            list: (
                <RainbowWalletList
                    connect={connect}
                    setActiveConnector={(conn: Connector) => {
                        setActiveRainConnector(conn);
                    }}
                    chain={optimism.id}
                />
            ),
            chainId: optimism.id,
        },
        {
            label: "Sui",
            icon: <SuietLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                // TODO: Replace with more descriptive condition
                if (activeIndex !== 4) {
                    disconnect();
                    setActiveIndex(4);
                }
            },
            list: <SuietWalletList connect={connect} />,
        },
        {
            label: "Solana",
            icon: <SolanaLogo width={24} height={24} style={{ marginRight: "10px" }} />,
            command: () => {
                // TODO: Replace with more descriptive condition
                if (activeIndex !== 5) {
                    disconnect();
                    setActiveIndex(5);
                }
            },
            list: <SolanaWalletList connect={connect} />,
        },
    ];
}
