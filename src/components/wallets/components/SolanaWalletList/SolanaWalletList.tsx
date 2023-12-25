import * as Sentry from "@sentry/react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Wallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { ToastContext } from "../../../ToastProvider/ToastProvider";
import { IAccount } from "../../types";
import { StyledListBox } from "../RainbowWalletList/RainbowWalletList.styled";
import SolanaItemTemplate from "./SolanaItemTemplate";
import { sleep } from "../../../../utils/sleep";

function SolanaWalletList(props: { connect: (account: IAccount) => void }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<Wallet | null>(null);
    const { wallets, connected, select, publicKey, wallet, disconnect, connect } = useWallet();
    const { connection } = useConnection();
    const toastController = useContext(ToastContext);

    useEffect(() => {
        if (connected && publicKey) {
            connection.getBalance(new PublicKey(publicKey)).then(
                (balance) => {
                    const balanceInSOL = ethers.formatUnits(balance, 9).substring(0, 5);
                    props.connect({
                        id: publicKey?.toString(),
                        balance: balanceInSOL + " SOL",
                        walletIcon: wallet?.adapter.icon,
                    });
                },
                (err) => {
                    console.error(err);
                    disconnect();
                    toastController?.showError("Failed to fetch balances: " + err.message);
                },
            );
        }
    }, [connected, connection, disconnect, props, publicKey, toastController, wallet?.adapter.icon]);

    return (
        <>
            <StyledListBox
                value={selectedOption}
                itemTemplate={SolanaItemTemplate}
                onChange={async (e) => {
                    try {
                        if (!e.value) {
                            return;
                        }
                        if (e.value.readyState == WalletReadyState.NotDetected) {
                            toastController?.showError("Wallet is not not detected: ");
                        }
                        if (e.value.readyState == WalletReadyState.Unsupported) {
                            toastController?.showError("Wallet is not unsupported: ");
                        }
                        toastController?.showInfo("Connecting", "Please accept connection in wallet");

                        select(e.value.adapter.name);
                        // Temporary hotfix for a known issue in WalletProviderBase of the @solana/wallet-adapter-react library.
                        // Reference: https://github.com/solana-labs/wallet-adapter/issues/743#issuecomment-1468702784
                        // Issue: When disconnecting the Solana wallet and then reconnecting, the first trial may throw a 'WalletNotSelectedError' despite explicitly selecting the wallet before.
                        // Workaround: Introduce a brief sleep to mitigate the error.
                        // Note: Library owners recommend avoiding the 'connect' method and relying on autoConnect, which conflicts with our app's multi-chain architecture.
                        // TODO: Monitor for library updates or find a more robust solution when the issue is resolved.

                        await sleep(100);
                        await connect();
                        setSelectedOption(e.value);
                    } catch (error) {
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
                }}
                options={wallets}
                optionLabel="label"
            />
        </>
    );
}

export default SolanaWalletList;
