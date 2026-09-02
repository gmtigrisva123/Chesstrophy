import { useEffect } from "react";
import { WikiArticleCard } from "./WikiArticleCard.jsx";
import { WikiBoard } from "../../components/chess/WikiBoard.jsx";
import { mdToHtml } from "../../lib/format/markdown.js";
import { wikiTrackView } from "../../services/wiki.js";

function Pill({ children, accent }) {
  return <span style={{ fontSize: "0.68rem", fontWeight: 700, color: accent, background: `${accent}14`, border: `1px solid ${accent}28`, borderRadius: 6, padding: "3px 9px" }}>{children}</span>;
}

function WikiArticleView({ article, articles, categories, data, dark, onBack, onOpenArticle, setActive }) {
  const fg = dark ? "#f0f0f0" : "#111", muted = dark ? "#8891a8" : "#666";
  const card = dark ? "rgba(17,24,39,0.5)" : "#fff", border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const G = "#2563EB";
  const cat = categories.find(c => c.id === article.categoryId);
  const hasBoard = !!(article.fen || article.moveSequence);

  useEffect(() => { wikiTrackView(article.id); }, [article.id]);

  const related = (article.relatedArticleIds || []).map(id => articles.find(a => a.id === id)).filter(Boolean);
  const relatedChessflix = (article.relatedChessflixIds || []).map(id => (data.chessflixContent || []).find(c => c.id === id)).filter(Boolean);
  const relatedLessons = (article.relatedLessonIds || []).map(id => (data.lessons || []).find(l => l.id === id)).filter(Boolean);
  const hasEcosystem = relatedChessflix.length > 0 || relatedLessons.length > 0 || article.showPuzzlesCTA || article.showOpeningToolCTA;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 10, padding: "8px 16px", color: muted, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", marginBottom: 20 }}>← Back to ChessWiki</button>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Pill accent={G}>{cat?.icon} {cat?.label || "Article"}</Pill>
          {article.featured && <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C9A84C" }}>⭐ Featured</span>}
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "clamp(1.5rem,4vw,2rem)", color: fg, letterSpacing: "-0.02em", marginBottom: 10 }}>{article.title}</div>
        <div style={{ fontSize: "0.92rem", color: muted, lineHeight: 1.7 }}>{article.shortDesc}</div>
      </div>

      {hasBoard && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "24px 20px", marginBottom: 24 }}>
          <WikiBoard fen={article.fen} moveSequence={article.moveSequence} dark={dark} />
        </div>
      )}

      <div style={{ fontSize: "0.88rem", color: dark ? "#dbe2f5" : "#333", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: mdToHtml(article.content) }} />

      {article.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 20, marginBottom: 20 }}>
          {article.tags.map(t => <span key={t} style={{ fontSize: "0.7rem", color: "#60a5fa", background: "#2563EB14", border: "1px solid #2563EB28", borderRadius: 6, padding: "3px 9px" }}>#{t}</span>)}
        </div>
      )}

      {/* Ecosystem connections */}
      {hasEcosystem && (
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1rem", color: fg, marginBottom: 14 }}>Explore Further in ChessProphy</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {relatedChessflix.map(c => (
              <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", cursor: "not-allowed", opacity: 0.5 }} title="Prophy Studio — coming soon">
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>🎬 ChessFlix</span>
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#C9A84C", background: "#C9A84C18", border: "1px solid #C9A84C33", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Soon</span>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>{c.title}</div>
              </div>
            ))}
            {relatedLessons.map(l => (
              <div key={l.id} onClick={() => setActive("Studies")} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, marginBottom: 4 }}>📚 Lessons</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>{l.title}</div>
              </div>
            ))}
            {article.showPuzzlesCTA && (
              <div onClick={() => setActive("Puzzles")} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, marginBottom: 4 }}>🧩 Puzzles</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>Practice{article.puzzleThemeHint ? ` "${article.puzzleThemeHint}"` : ""} puzzles</div>
              </div>
            )}
            {article.showOpeningToolCTA && (
              <div onClick={() => setActive("Openings")} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: G, marginBottom: 4 }}>♟️ Opening Tools</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>{article.openingHint || "Explore in Openings"}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1rem", color: fg, marginBottom: 14 }}>Related Articles</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {related.map(a => <WikiArticleCard key={a.id} article={a} categories={categories} dark={dark} onClick={() => onOpenArticle(a.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export {
  WikiArticleView,
};
