import * as Sentry from "@sentry/react";
// import { IWallet, useWallet } from "@suiet/wallet-kit";
import { useConnectWallet, useCurrentAccount, useCurrentWallet, useWallets } from "@mysten/dapp-kit";
// import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { useContext, useEffect, useMemo, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SuiItemTemplate from "./SuiItemTemplate";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
import { WalletWithRequiredFeatures } from "@mysten/wallet-standard";

function SuietWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<WalletWithRequiredFeatures | null>(null);
    const wallet = useCurrentWallet();
    const wallets = useWallets();
    const currentAccount = useCurrentAccount();
    const toastController = useContext(ToastContext);
    const { mutate: connect } = useConnectWallet();

    const walletsList = useMemo(() => {
        return wallets.filter((el) => !el.name.includes("Spacecy Sui Wallet"));
    }, [wallets]);

    useEffect(() => {
        if (wallet.isConnected && currentAccount?.address) {
            props.connect({
                id: currentAccount?.address,
                network: ALLOWED_NETWORKS.Sui,
                walletIcon: wallet.currentWallet?.icon,
            });
        }
    }, [wallet.isConnected, currentAccount?.address, wallet.currentWallet?.icon, props]);

    async function connectWallet(chosenWallet: WalletWithRequiredFeatures) {
        try {
            if (!chosenWallet) {
                return;
            }
            // if (!chosenWallet) {
            //     toastController?.showError("Wallet is not installed");
            //     return;
            // }
            toastController?.showInfo("Connecting", "Please accept connection in wallet");
            connect(
                { wallet: chosenWallet },
                {
                    onSuccess: () => {
                        setSelectedOption(chosenWallet);
                    },
                },
            );
            setSelectedOption(chosenWallet);
        } catch (e) {
            Sentry.captureException(e, {
                tags: { scenario: "connect_wallet" },
                extra: { chain: { id: "sui" } },
            });
            console.error(e);

            if (e instanceof Error) {
                toastController?.showError("Failed to connect: " + e.message);
            } else {
                toastController?.showError("Failed to connect: " + e);
            }
        }
    }

    return (
        <>
            <StyledListBox
                value={selectedOption}
                itemTemplate={SuiItemTemplate}
                onChange={async (e) => {
                    connectWallet(e.value);
                }}
                options={walletsList}
                optionLabel="name"
            />
        </>
    );
}

export default SuietWalletList;
