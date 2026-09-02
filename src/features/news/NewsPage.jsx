import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { mdToHtml } from "../../lib/format/markdown.js";
import { loadAdminData } from "../../services/adminData.js";

function NewsPage({ dark }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#888" : "#666";
  const card = dark ? "rgba(17,24,39,0.5)" : "#fff";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const news = (loadAdminData().news || []).filter(n => n.published);
  return (
    <div>
      <SectionHeader dark={dark} eyebrow="What's New" title="News & Announcements" sub="Updates, features, and stories from the ChessProphy team." />
      {news.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: muted, fontSize: "0.85rem" }}>No articles published yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {news.slice().reverse().map(n => (
            <div key={n.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              {n.cover && <img src={n.cover} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginBottom: 14 }} />}
              <div style={{ fontSize: "0.7rem", color: "#60a5fa", marginBottom: 6 }}>{n.author} · {n.date}</div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: fg, marginBottom: 10, fontFamily: "'Georgia',serif" }}>{n.title}</div>
              <div style={{ fontSize: "0.85rem", color: muted, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: mdToHtml(n.content) }} />
              {n.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {n.tags.map(t => <span key={t} style={{ fontSize: "0.65rem", color: "#60a5fa", background: "#2563EB14", border: "1px solid #2563EB28", borderRadius: 6, padding: "2px 8px" }}>{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export {
  NewsPage,
};
