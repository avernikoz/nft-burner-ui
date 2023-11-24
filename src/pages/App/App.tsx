import React, { useContext, useEffect, useState } from "react";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import { useWallet as solanaUseWallet } from "@solana/wallet-adapter-react";
import { useAccount as useWagmiAccount } from "wagmi";

import "./App.css";
import { BodyContainer, Footer } from "./app.styled";
import FullScreenButton from "../../components/FullscreenButton/FullscreenButton";
import Wallets from "../../components/wallets/Wallets";
import { ToastProvider } from "../../components/ToastProvider/ToastProvider";
import { GlobalStyles } from "../../config/globalStyles";
import NftList from "../../components/NftList/NftList";
import Control from "../../components/Control/Control";
import { RenderMain } from "../../webl/renderingMain";
import { NftContext } from "../../components/NftProvider/NftProvider";
import { ENftBurnStatus } from "../../utils/types";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import { useReactMediaRecorder } from "react-media-recorder";

function App() {
    const suietWallet = suietUseWallet();
    const solanaWallet = solanaUseWallet();
    const wagmiAccount = useWagmiAccount();
    const [showUI, setShowUI] = useState<boolean>(false);
    const NftController = useContext(NftContext);
    const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ screen: true });

    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    useEffect(() => {
        if (wagmiAccount.isConnected && wagmiAccount.address) {
            setShowUI(true);
        } else if (solanaWallet.connected && solanaWallet.publicKey) {
            setShowUI(true);
        } else if (suietWallet.connected && suietWallet.address) {
            setShowUI(true);
        } else {
            setShowUI(false);
        }
    }, [
        solanaWallet.connected,
        suietWallet.address,
        suietWallet.connected,
        wagmiAccount.address,
        wagmiAccount.isConnected,
        solanaWallet.publicKey,
        solanaWallet.disconnecting,
    ]);
    const downloadRecording = () => {
        const link = document.createElement("a");
        if (mediaBlobUrl) {
            link.href = mediaBlobUrl;
            link.download = "screen_recording.webm";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    useEffect(() => {
        if (NftController?.nftStatus === ENftBurnStatus.BURNED) {
            startRecording();
            setTimeout(() => {
                stopRecording();
                downloadRecording();
            }, 15000);
            GRenderingStateMachine.SetRenderingState(ERenderingState.Burning);
            setShowUI(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [NftController?.nftStatus]);

    return (
        <>
            <GlobalStyles />

            <ToastProvider>
                <div className="App">
                    <div className="WalletConnectionHeader">
                        <Wallets
                            hideUI={() => {
                                setShowUI(false);
                            }}
                        />
                    </div>
                    {showUI && (
                        <BodyContainer>
                            <div className="half">
                                <NftList></NftList>
                                <Control></Control>
                                <button onClick={startRecording}>Start Recording</button>
                                <button onClick={stopRecording}>Stop Recording</button>
                                <button onClick={downloadRecording}>Download Recording</button>
                            </div>
                        </BodyContainer>
                    )}

                    <Footer>
                        <FullScreenButton />
                    </Footer>
                </div>
            </ToastProvider>
            <canvas id="demo-canvas">
                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
            </canvas>
            {/* <div id="demo-canvas"></div> */}
        </>
    );
}

export default App;
