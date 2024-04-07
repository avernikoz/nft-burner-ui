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
    const checkDeviceComponent = deviceType == "Mobile" ? UnsupportedMobileModal : InternalApp;
    const AppComponent = isAboutPageActive ? About : checkDeviceComponent;

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
