import React, { useEffect, useState } from "react";

import "./App.css";
import { RenderMain } from "../../webl/renderingMain";
import { SolanaWalletContext } from "../../context/SolanaWalletContext";
import { EVMWalletContext } from "../../context/EVMWalletContext";

import { SuiWalletContext } from "../../context/SuiWalletContext";
import { ToastProvider } from "../../components/ToastProvider/ToastProvider";
import { GlobalStyles } from "../../config/globalStyles";
import { About } from "../About/About";
import { InternalApp } from "./InternalApp";

function App() {
    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    const [isAboutPageActive, setAboutPageActive] = useState(true);
    const AppComponent = isAboutPageActive ? About : InternalApp;

    return (
        <>
            <GlobalStyles />
            <SolanaWalletContext>
                <EVMWalletContext>
                    <SuiWalletContext>
                        <ToastProvider>
                            <AppComponent setAboutPageActive={setAboutPageActive} />
                            <canvas id="demo-canvas">
                                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
                            </canvas>
                        </ToastProvider>
                    </SuiWalletContext>
                </EVMWalletContext>
            </SolanaWalletContext>
        </>
    );
}

export default App;
