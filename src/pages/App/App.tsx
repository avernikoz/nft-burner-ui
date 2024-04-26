import { useEffect, useState } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

import { Roadmap } from "../Roadmap/Roadmap";
import { Canvas } from "../../components/Canvas/Canvas";
import { RenderMain } from "../../webl/renderingMain";
import { FPSMeter } from "../../components/FPSMeter/FPSMeter";
import { InternalApp } from "./InternalApp";
import { About } from "../About/About";
import { EAppPages } from "./AppModel";
import { registerZkSendWallet } from "@mysten/zksend";

function App() {
    const [activePage, setActivePage] = useState<EAppPages>(EAppPages.ABOUT);

    registerZkSendWallet("Nft burner", { origin: "https://zksend.com" });
    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    const chosenPage = () => {
        switch (activePage) {
            case EAppPages.ABOUT:
                return <About setAboutPageActive={setActivePage} />;
            case EAppPages.INTERNAL_APP:
                return <InternalApp setAboutPageActive={setActivePage} />;
            case EAppPages.ROADMAP:
                return <Roadmap setActivePage={setActivePage} />;
            default:
                return About;
        }
    };
    // const AppComponent = Roadmap;

    return (
        <>
            <GlobalStyles />
            <FPSMeter />
            <Canvas />
            {chosenPage()}
        </>
    );
}

export default App;
