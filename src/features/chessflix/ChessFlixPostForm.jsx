import { useState } from "react";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { compressImageFile } from "../../lib/media/image.js";
import { toEmbedUrl } from "../../lib/media/video.js";
import { loadAdminData } from "../../services/adminData.js";
import { loadChessFlixContent, saveChessFlixContent } from "../../services/chessflix.js";
import { loadProfile } from "../../services/profile.js";

// Permission gate. Kept as its own component so the editor below can own hooks
// unconditionally — an early `return` above `useState` would change the hook
// count between renders and crash React the moment `canPost` flips.
function ChessFlixPostDenied({ dark, onBack }) {
  const muted = dark ? "#888" : "#666";
  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>← Back to ChessFlix</button>
      <EmptyState icon="🔒" title="You don't currently have permission to post on ChessFlix." sub="Reach out to a ChessProphy admin if you'd like posting access." />
    </div>
  );
}

function ChessFlixPostForm({ dark, canPost, onBack, onPosted }) {
  if (!canPost) return <ChessFlixPostDenied dark={dark} onBack={onBack} />;
  return <ChessFlixPostEditor dark={dark} onBack={onBack} onPosted={onPosted} />;
}

function ChessFlixPostEditor({ dark, onBack, onPosted }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const RED = "#ef4444";

  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imgError, setImgError] = useState("");
  const [errors, setErrors] = useState([]);
  const [posted, setPosted] = useState(false);

  const onImageFile = async (file) => {
    setImgError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImgError("Unsupported file type — please choose an image."); return; }
    if (file.size > 8 * 1024 * 1024) { setImgError("Image is too large (max 8MB before compression)."); return; }
    try { setImageData(await compressImageFile(file)); }
    catch { setImgError("Couldn't read that image — try a different file."); }
  };

  const publish = () => {
    const errs = [];
    if (!title.trim()) errs.push("Title is required.");
    if (!desc.trim()) errs.push("Description is required.");
    if (type === "video" && !videoUrl.trim()) errs.push("A video link is required.");
    if (type === "video" && videoUrl.trim() && !/^https?:\/\//i.test(videoUrl.trim())) errs.push("Video link must be a valid URL.");
    if (type === "image" && !imageData) errs.push("An image is required.");
    setErrors(errs);
    if (errs.length) return;

    const profile = loadProfile();
    const cfg = loadAdminData().chessflixConfig || {};
    const rec = {
      id: "cf" + Date.now(), title: title.trim(), desc: desc.trim(), type,
      mediaUrl: type === "video" ? videoUrl.trim() : imageData,
      thumbnail: "", category: category.trim(),
      creatorName: profile.displayName || profile.username, creatorId: profile.username,
      views: 0, status: cfg.moderationEnabled ? "pending" : "published", featured: false,
      createdAt: new Date().toISOString(),
    };
    const list = [rec, ...loadChessFlixContent()];
    saveChessFlixContent(list);
    setPosted(true);
    setTimeout(() => onPosted(rec.id), 900);
  };

  return (
    <div className="cf-fade-in" style={{ maxWidth: 640 }}>
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: muted, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18 }}>← Back to ChessFlix</button>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "1.3rem", fontWeight: 800, color: fg, marginBottom: 4 }}>Post ChessFlix Content</h1>
      <div style={{ fontSize: "0.8rem", color: muted, marginBottom: 24 }}>Share a video or image with the ChessProphy community.</div>

      {posted ? (
        <div style={{ background: "#4ade8012", border: "1px solid #4ade8044", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, color: "#4ade80", fontSize: "0.95rem" }}>Your ChessFlix content has been posted!</div>
        </div>
      ) : (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[{ k: "video", l: "🎥 Video" }, { k: "image", l: "🖼️ Image" }].map(t => (
              <button key={t.k} onClick={() => setType(t.k)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${type === t.k ? RED : border}`,
                background: type === t.k ? `${RED}15` : "transparent", color: type === t.k ? RED : muted,
                fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
              }}>{t.l}</button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, marginBottom: 6 }}>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter content title..." style={{ width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9, padding: "10px 13px", color: fg, fontSize: "0.85rem", fontFamily: "inherit" }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, marginBottom: 6 }}>Description</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your chess content..." rows={3} style={{ width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9, padding: "10px 13px", color: fg, fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, marginBottom: 6 }}>Category (optional)</div>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Openings, Endgames, Tactics" style={{ width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9, padding: "10px 13px", color: fg, fontSize: "0.85rem", fontFamily: "inherit" }} />
          </div>

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, marginBottom: 6 }}>Media</div>
            {type === "video" ? (
              <>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste a YouTube, Vimeo, or direct video link" style={{ width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9, padding: "10px 13px", color: fg, fontSize: "0.85rem", fontFamily: "inherit" }} />
                <div style={{ fontSize: "0.68rem", color: muted, marginTop: 6, lineHeight: 1.5 }}>ChessFlix plays hosted video links rather than raw file uploads — the same approach every content platform ultimately uses once a video is processed on their servers.</div>
                {toEmbedUrl(videoUrl) && (
                  <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", position: "relative", paddingTop: "56.25%" }}>
                    <iframe src={toEmbedUrl(videoUrl)} title="preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <input type="file" accept="image/*" onChange={e => onImageFile(e.target.files?.[0])} style={{ fontSize: "0.8rem", color: muted }} />
                {imgError && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 6 }}>{imgError}</div>}
                {imageData && <img src={imageData} alt="preview" style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 12, marginTop: 12, background: dark ? "#000" : "#f0f0f0" }} />}
              </>
            )}
          </div>

          {errors.length > 0 && (
            <div style={{ background: "#ef444412", border: "1px solid #ef444444", borderRadius: 10, padding: "10px 14px", margin: "14px 0" }}>
              {errors.map(e => <div key={e} style={{ fontSize: "0.76rem", color: "#ef4444" }}>• {e}</div>)}
            </div>
          )}

          <button onClick={publish} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none", marginTop: 10,
            background: `linear-gradient(135deg,${RED},#dc2626)`, color: "#fff", fontWeight: 800, fontSize: "0.86rem", cursor: "pointer",
          }}>Post Content</button>
        </div>
      )}
    </div>
  );
}

export {
  ChessFlixPostForm,
};
