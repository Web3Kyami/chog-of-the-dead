import React from "react";
import ReactDOM from "react-dom/client";
import PrivyWrapper from "./PrivyWrapper.jsx";
import PhaserGame from "./PhaserGame.jsx";
import usePrivyBridge from "./hooks/usePrivyBridge.js";

function PrivyBridgeWrapper() {
  usePrivyBridge();
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <PrivyWrapper>
    <PrivyBridgeWrapper />
    <PhaserGame />
  </PrivyWrapper>
);
