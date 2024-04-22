import * as Sentry from "@sentry/react";
import { IWallet, useWallet } from "@suiet/wallet-kit";
// import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { useContext, useEffect, useMemo, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SuiItemTemplate from "./SuiItemTemplate";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

function SuietWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet | null>(null);
    const wallet = useWallet();
    const toastController = useContext(ToastContext);

    const walletsList = useMemo(() => {
        return wallet.configuredWallets.filter((el) => !el.name.includes("Spacecy Sui Wallet"));
    }, [wallet.configuredWallets]);

    useEffect(() => {
        if (wallet.connected && wallet.account?.address) {
            props.connect({
                id: wallet.account?.address,
                network: ALLOWED_NETWORKS.Sui,
                walletIcon: wallet.adapter?.icon,
            });
        }
    }, [wallet.connected, wallet.account?.address, wallet.adapter?.icon, props]);

    async function connect(chosenWallet: IWallet) {
        try {
            if (!chosenWallet) {
                return;
            }
            if (!chosenWallet.installed) {
                toastController?.showError("Wallet is not installed");
                return;
            }
            toastController?.showInfo("Connecting", "Please accept connection in wallet");
            await wallet.select(chosenWallet.name);
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
                    connect(e.value);
                }}
                options={walletsList}
                optionLabel="name"
            />
        </>
    );
}

export default SuietWalletList;
