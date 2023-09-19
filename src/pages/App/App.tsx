import React, { useEffect } from "react";
import "./App.css";
import { main } from "../../webl/main";

function App() {
  useEffect(() => {
    main();
  }, []);
  return (
    <div className="App" style={{ width: "100%", height: "100%" }}>
      <canvas id="my-super-id" width="500" height="500">
        Your browser does <strong>not support</strong> the <code>&lt;canvas&gt;</code> element.
      </canvas>
    </div>
  );
}

export default App;
