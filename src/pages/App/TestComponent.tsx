import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { mainnet } from "wagmi/chains";
import "./App.css";
import { Connector } from "wagmi";

const chains = [mainnet]; // replace with your chains
const projectId = "FJslefKyAiqvKQJkOotUkPDkQNjA1zEK"; // replace with your project id

export const TestComponent = () => {
    const connectors = connectorsForWallets([
        {
            groupName: "My Wallets",
            wallets: [metaMaskWallet({ projectId, chains })],
        },
    ]);

    const connectorsList = connectors();
    console.debug("connectorsList[0].connect", connectorsList[0].connect);

    return (
        <button
            onClick={async () => {
                console.debug("run connect");
                const connectorOfWallet: Connector = connectorsList[0];
                const res = await connectorOfWallet.connect();
                console.debug("res: ", res);
            }}
        >
            connect button
        </button>
    );
};
