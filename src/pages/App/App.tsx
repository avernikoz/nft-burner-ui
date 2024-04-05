import { useEffect } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

import { Roadmap } from "../Roadmap/Roadmap";
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

    const AppComponent = Roadmap;

    return (
        <>
            <GlobalStyles />
            <FPSMeter />
            <Canvas />
            <AppComponent />
        </>
    );
}

export default App;
