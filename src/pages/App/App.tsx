import React, { useEffect } from "react";
import "./App.css";
import { RenderMain } from "../../webl/script";

function App() {
  useEffect(() => {
    RenderMain();
  }, []);
  return (
    <div className="App" style={{ width: "100%", height: "100%" }}>
      <canvas id="demo-canvas" width="500" height="500">
        Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
      </canvas>
    </div>
  );
}

export default App;
