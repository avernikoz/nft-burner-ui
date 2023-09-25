import React, { useEffect } from "react";
import "./App.css";
import { RenderMain } from "../../webl/script";

function App() {
    useEffect(() => {
        RenderMain();
    }, []);
    return (
        <div className="App">
            <canvas id="demo-canvas">
                Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
            </canvas>
        </div>
    );
}

export default App;
