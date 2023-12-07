import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./pages/App/App";
import reportWebVitals from "./utils/reportWebVitals";
import { PrimeReactProvider } from "primereact/api";
import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { SolanaWalletContext } from "./context/SolanaWalletContext";
import { EVMWalletContext } from "./context/EVMWalletContext";
import { SuiWalletContext } from "./context/SuiWalletContext";
import { NftProvider } from "./components/NftProvider/NftProvider";
import { configureSentry } from "./utils/configureSentry";

// Sentry init
configureSentry();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    // TODO: Return it back, but only in dev mode
    // <React.StrictMode>

    <PrimeReactProvider>
        <SolanaWalletContext>
            <EVMWalletContext>
                <SuiWalletContext>
                    <NftProvider>
                        <App />
                    </NftProvider>
                </SuiWalletContext>
            </EVMWalletContext>
        </SolanaWalletContext>
    </PrimeReactProvider>,
    // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
