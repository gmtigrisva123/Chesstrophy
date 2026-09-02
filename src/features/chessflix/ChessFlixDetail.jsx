import { useEffect } from "react";
import { ChessFlixCard } from "./ChessFlixCard.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { toEmbedUrl } from "../../lib/media/video.js";
import { loadChessFlixContent, recordChessFlixView } from "../../services/chessflix.js";

function ChessFlixDetail({ dark, contentId, onBack, onOpenContent }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";

  useEffect(() => { recordChessFlixView(contentId); }, [contentId]);

  const all = loadChessFlixContent();
  const c = all.find(x => x.id === contentId);
  if (!c) return <EmptyState icon="🎬" title="Content not found" sub="It may have been removed." />;

  const related = all.filter(x => x.id !== c.id && x.status === "published" && x.category === c.category).slice(0, 3);
  const embed = c.type === "video" ? toEmbedUrl(c.mediaUrl) : null;

  return (
    <div className="cf-fade-in">
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>← Back to ChessFlix</button>

      <div style={{ borderRadius: 18, overflow: "hidden", background: "#000", marginBottom: 20 }}>
        {c.type === "video" ? (
          embed ? (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe src={embed} title={c.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
            </div>
          ) : (
            /* eslint-disable-next-line jsx-a11y/media-has-caption --
               Creator-uploaded media: ChessFlix has no caption-upload flow yet,
               so there is no track to attach. Tracked in docs/ROADMAP.md. */
            <video src={c.mediaUrl} controls style={{ width: "100%", maxHeight: 520, display: "block" }} />
          )
        ) : (
          <img src={c.mediaUrl} alt={c.title} style={{ width: "100%", maxHeight: 520, objectFit: "contain", display: "block", margin: "0 auto" }} />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
        <div>
          {c.category && <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>{c.category.toUpperCase()}</div>}
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: fg, fontFamily: "Georgia,serif", marginBottom: 8 }}>{c.title}</h1>
          <div style={{ fontSize: "0.78rem", color: muted }}>By {c.creatorName} · {new Date(c.createdAt).toLocaleDateString()} · 👁 {(c.views||0).toLocaleString()} views</div>
        </div>
        {c.featured && <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#fbbf24", background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 7, padding: "5px 12px", flexShrink: 0 }}>⭐ Featured</span>}
      </div>
      <p style={{ fontSize: "0.88rem", color: dark ? "#ccc" : "#333", lineHeight: 1.75, marginBottom: 28, maxWidth: 720 }}>{c.desc}</p>

      {related.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, marginBottom: 14 }}>Related Content</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {related.map(r => <ChessFlixCard key={r.id} c={r} dark={dark} onClick={() => onOpenContent(r.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export {
  ChessFlixDetail,
};
