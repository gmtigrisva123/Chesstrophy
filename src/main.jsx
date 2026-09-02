import React from "react";
import { createRoot } from "react-dom/client";
// storageAdapter must be imported before App so `window.storage` exists by the
// time the boot gate in App.jsx runs.
import App from "./App.jsx";
import "./platform/storageAdapter.js";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
