import { useEffect } from "react";

import { GlobalStyles } from "../../config/globalStyles";
import "./App.css";

// import { About } from "../About/About";
// import { InternalApp } from "./InternalApp";
import { Canvas } from "../../components/Canvas/Canvas";
import { RenderMain } from "../../webl/renderingMain";
import { FPSMeter } from "../../components/FPSMeter/FPSMeter";
import { Airdrop } from "../Airdrop/Airdrop";

function App() {
    useEffect(() => {
        if (!!process.env?.REACT_APP_DEBUG_DISABLED_SIMULATION) {
        } else {
            console.debug("[App] RenderMain call");
            RenderMain();
        }
    }, []);

    // const [isAboutPageActive, setAboutPageActive] = useState(true);
    // const AppComponent = isAboutPageActive ? About : InternalApp;
    const AppComponent = Airdrop;

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
