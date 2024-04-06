import React, { useEffect, useState } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

import { About } from "../About/About";
import { InternalApp } from "./InternalApp";
import { Canvas } from "../../components/Canvas/Canvas";
import { RenderMain } from "../../webl/renderingMain";
import { FPSMeter } from "../../components/FPSMeter/FPSMeter";
import { UnsupportedMobileModal } from "../../components/UnsupportedMobileModal/UnsupportedMobileModal";
import { useDeviceType } from "../../hooks/useDeviceType";

function App() {
    const deviceType = useDeviceType();

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
            {deviceType == "Mobile" ? (
                <UnsupportedMobileModal />
            ) : (
                <AppComponent setAboutPageActive={setAboutPageActive} />
            )}
        </>
    );
}

export default App;
