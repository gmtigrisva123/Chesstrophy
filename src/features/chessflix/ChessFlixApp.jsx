import { useState } from "react";
import { ChessFlixDetail } from "./ChessFlixDetail.jsx";
import { ChessFlixList } from "./ChessFlixList.jsx";
import { ChessFlixPostForm } from "./ChessFlixPostForm.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { loadAdminData } from "../../services/adminData.js";
import { canPostChessFlix } from "../../services/chessflix.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── CHESSFLIX ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ChessFlixApp({ dark, onExitStudio }) {
  const [view, setView] = useState("list"); // list | detail | post
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey(k => k + 1);

  const cfg = loadAdminData().chessflixConfig || {};
  const canPost = canPostChessFlix();

  const openContent = (id) => { setSelectedId(id); setView("detail"); };
  const back = () => { setView("list"); setSelectedId(null); };

  if (!cfg.enabled) {
    return (
      <div>
        <button onClick={onExitStudio} style={{ background: "transparent", border: "none", color: "#888", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>← Back to Prophy Studio</button>
        <EmptyState icon="🎬" title="ChessFlix is currently disabled" sub="Check back soon." />
      </div>
    );
  }

  if (view === "post") {
    return <ChessFlixPostForm dark={dark} canPost={canPost} onBack={back} onPosted={(id) => { bump(); openContent(id); }} />;
  }
  if (view === "detail" && selectedId) {
    return <ChessFlixDetail dark={dark} contentId={selectedId} onBack={back} onOpenContent={openContent} />;
  }
  return <ChessFlixList dark={dark} canPost={canPost} onOpenContent={openContent} onPost={() => setView("post")} onExitStudio={onExitStudio} refreshKey={refreshKey} />;
}

export {
  ChessFlixApp,
};
