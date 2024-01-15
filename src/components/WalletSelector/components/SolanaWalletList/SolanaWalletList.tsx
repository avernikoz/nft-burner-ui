import * as Sentry from "@sentry/react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Wallet, WalletNotSelectedError, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ListBoxChangeEvent } from "primereact/listbox";
import { useCallback, useContext, useEffect, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SolanaItemTemplate from "./SolanaItemTemplate";
import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet, disconnect, connect } = useWallet();
    const { connection } = useConnection();
    const toastController = useContext(ToastContext);
    const [errorWalletNotSelected, setErrorWalletNotSelected] = useState(false);

    useEffect(() => {
        // Logic to handle connection after error state is set
        const handleConnectAfterError = async () => {
            try {
                await connect();
                setErrorWalletNotSelected(false);
            } catch (error) {
                Sentry.captureException(error, {
                    tags: { scenario: "connect_wallet_second_trial" },
                    extra: { chain: { id: "solana" } },
                });

                console.error(error);

                if (error instanceof Error) {
                    toastController?.showError("Failed to connect: " + error.message);
                } else {
                    toastController?.showError("Failed to connect: " + error);
                }
            }
        };

        // Check conditions for connecting after setting the error state
        if (errorWalletNotSelected && connected === false) {
            handleConnectAfterError();
        }
    }, [connected, wallet, connect, errorWalletNotSelected, toastController]);

    useEffect(() => {
        if (connected && publicKey) {
            props.connect({
                id: publicKey?.toString(),
                network: ALLOWED_NETWORKS.Solana,
                walletIcon: wallet?.adapter.icon,
            });
        }
    }, [connected, connection, disconnect, props, publicKey, toastController, wallet?.adapter.icon]);

    const handleWalletChange = useCallback(
        async (e: ListBoxChangeEvent) => {
            try {
                if (!e.value) {
                    return;
                }
                if (e.value.readyState === WalletReadyState.NotDetected) {
                    toastController?.showError("Wallet is not detected: ");
                    return;
                }
                if (e.value.readyState === WalletReadyState.Unsupported) {
                    toastController?.showError("Wallet is unsupported: ");
                    return;
                }
                toastController?.showInfo("Connecting", "Please accept connection in wallet");

                select(e.value.adapter.name);
                setSelectedOption(e.value);
                await connect();
            } catch (error) {
                if (error instanceof WalletNotSelectedError && error.name === WalletNotSelectedError.name) {
                    setErrorWalletNotSelected(true);
                    return;
                }

                Sentry.captureException(error, {
                    tags: { scenario: "connect_wallet" },
                    extra: { chain: { id: "solana" } },
                });

                console.error(error);

                if (error instanceof Error) {
                    toastController?.showError("Failed to connect: " + error.message);
                } else {
                    toastController?.showError("Failed to connect: " + error);
                }
            }
        },
        [toastController, select, connect],
    );

    return (
        <>
            <StyledListBox
                value={selectedOption}
                itemTemplate={SolanaItemTemplate}
                onChange={handleWalletChange}
                options={wallets}
                optionLabel="label"
            />
        </>
    );
}

export default SolanaWalletList;
