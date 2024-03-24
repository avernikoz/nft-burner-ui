import { useEffect } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

import { RenderMain } from "../../webl/renderingMain";
import { FPSMeter } from "../../components/FPSMeter/FPSMeter";
import { TermoCatLand } from "../TermoCatLand/TermoCatLand";
import { Canvas } from "../../components/Canvas/Canvas";

function App() {
    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    return (
        <>
            <GlobalStyles />
            <FPSMeter />
            <div style={{ display: "none" }}>
                <Canvas />
            </div>
            {/*<AppComponent setAboutPageActive={setAboutPageActive} />*/}
            <TermoCatLand></TermoCatLand>
        </>
    );
}

export default App;
