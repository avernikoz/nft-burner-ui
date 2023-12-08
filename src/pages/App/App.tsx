import { useEffect, useState } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

import { About } from "../About/About";
import { InternalApp } from "./InternalApp";
import { Canvas } from "../../components/Canvas/Canvas";
import { RenderMain } from "../../webl/renderingMain";
import { FPSMeter } from "../../components/FPSMeter/FPSMeter";

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
            <FPSMeter />
            <Canvas />
            <AppComponent setAboutPageActive={setAboutPageActive} />
        </>
    );
}

export default App;
