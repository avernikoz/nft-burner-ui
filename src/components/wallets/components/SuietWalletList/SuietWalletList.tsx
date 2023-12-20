import * as Sentry from "@sentry/react";
import { useAccountBalance, useWallet } from "@suiet/wallet-kit";
import { IWallet } from "@suiet/wallet-kit/dist/types/wallet";
import { ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SuiItemTemplate from "./SuiItemTemplate";

function SuietWallet(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<IWallet | null>(null);
    const wallet = useWallet();
    const { error, loading, balance } = useAccountBalance();
    const toastController = useContext(ToastContext);

    useEffect(() => {
        if (balance === undefined) {
            return;
        }
        if (wallet.connected && !loading && error == null) {
            const balanceInSUI = ethers.formatUnits(balance, 9).substring(0, 5);
            props.connect({
                id: wallet.account?.address,
                balance: balanceInSUI + " SUI",
                walletIcon: wallet.adapter?.icon,
            });
        }
        if (error) {
            toastController?.showError("Failed to fetch balances: " + error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.connected, balance, wallet.account?.address, wallet.adapter?.icon, loading, error]);

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
                options={wallet.configuredWallets.filter((el) => !el.name.includes("Spacecy Sui Wallet"))}
                optionLabel="name"
            />
        </>
    );
}

export default SuietWallet;
