import { useState, useEffect } from "react";
import { AppSkeleton } from "./app/AppSkeleton.jsx";
import { ChessProphyApp } from "./app/ChessProphyApp.jsx";
import { __bootstrapStorage, __storageReady } from "./lib/storage/storageBridge.js";

// ── APP BOOTSTRAP ─────────────────────────────────────────────────────────────
// Every loadXState()/loadAdminData() call above is written as a synchronous
// read (as it originally was against localStorage). window.storage is async,
// so this gate loads all persisted data into the in-memory cache once, before
// ChessProphyApp — and therefore every one of those synchronous reads — ever
// mounts.
export default function App() {
  const [ready, setReady] = useState(__storageReady);

  useEffect(() => {
    if (__storageReady) { setReady(true); return; }
    __bootstrapStorage().then(() => setReady(true));
  }, []);

  if (!ready) return <AppSkeleton />;

  return <ChessProphyApp />;
}
