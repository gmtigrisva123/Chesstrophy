import { useState } from "react";
import { LabeledProgressBar } from "../../components/ui/LabeledProgressBar.jsx";
import { LevelBadge } from "../../components/ui/LevelBadge.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { STUDIES_DATA } from "../../data/studies.js";
import { loadAdminData } from "../../services/adminData.js";
import { getCourseState } from "../../services/courseProgress.js";
import { CourseViewer } from "../courses/CourseViewer.jsx";

function StudiesPage({ dark, setActive }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const adminStudies = (loadAdminData().studies || []).filter(s => s.published && !s.archived);
  const adminCourses = (loadAdminData().courses || []).filter(c => c.published && !c.archived);
  const [openCourse, setOpenCourse] = useState(null);

  if (openCourse) {
    return <CourseViewer course={openCourse} dark={dark} setActive={setActive} onBack={() => setOpenCourse(null)} />;
  }

  return (
    <div>
      <SectionHeader dark={dark} eyebrow="Study Plans" title="Structured Learning Paths" sub="Work through curated study plans at your own pace. Track your progress across every topic." />
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {STUDIES_DATA.map(cat => (
          <div key={cat.category}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>{cat.category}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
              {cat.items.map(item => (
                <div key={item.title} style={{ background: card, border: "1px solid " + border, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, lineHeight: 1.3 }}>{item.title}</span>
                    <LevelBadge level={item.difficulty} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                  <div style={{ marginBottom: 12 }}>
                    <LabeledProgressBar label="Progress" percent={item.progress} color={cat.color} dark={dark} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: muted }}>{item.lessons} lessons</span>
                    <button
                      onClick={() => setOpenCourse({ ...item, category: cat.category, color: cat.color })}
                      style={{
                        background: item.progress === 100 ? "#4ade8022" : cat.color + "22",
                        border: "1px solid " + (item.progress === 100 ? "#4ade8055" : cat.color + "55"),
                        color: item.progress === 100 ? "#4ade80" : cat.color,
                        borderRadius: 8, padding: "7px 16px",
                        fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                      }}>
                      {item.progress === 0 ? "Start" : item.progress === 100 ? "Complete" : "Continue"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {adminCourses.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>Custom Courses</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
              {adminCourses.map(c => {
                const chapterCount = c.content?.chapters?.length || 0;
                const st = getCourseState(c.id);
                const started = (st.furthest || 0) > 0 || st.lastTab === "cheat" || st.lastTab === "practice";
                const pct = chapterCount ? Math.round((Math.min((st.furthest || 0) + 1, chapterCount) / chapterCount) * 100) : 0;
                return (
                  <div key={c.id} style={{ background: card, border: "1px solid " + border, borderRadius: 14, padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, lineHeight: 1.3 }}>{c.title}</span>
                      <LevelBadge level={c.difficulty} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</p>
                    <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 14 }}>By <strong style={{ color: fg }}>{c.author || "ChessProphy"}</strong></div>
                    {started && chapterCount > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <LabeledProgressBar label="Progress" percent={pct} color={c.color || "#C9A84C"} dark={dark} />
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: muted }}>{chapterCount} chapter{chapterCount === 1 ? "" : "s"}{!!c.members && ` · ${c.members.toLocaleString()} members`}</span>
                      <button
                        onClick={() => setOpenCourse(c)}
                        style={{
                          background: (c.color || "#C9A84C") + "22", border: "1px solid " + (c.color || "#C9A84C") + "55",
                          color: c.color || "#C9A84C", borderRadius: 8, padding: "7px 16px",
                          fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                        }}>
                        {started ? "Continue" : "Start"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {adminStudies.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>✍️</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>Community Studies</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
              {adminStudies.map(s => (
                <div key={s.id} style={{ background: card, border: "1px solid " + border, borderRadius: 14, padding: 22 }}>
                  {s.thumbnail && <img src={s.thumbnail} alt="" style={{ width:"100%", height:110, objectFit:"cover", borderRadius:10, marginBottom:12 }} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: fg, lineHeight: 1.3 }}>{s.title}</span>
                    <LevelBadge level={s.difficulty} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: muted, lineHeight: 1.6, marginBottom: 12 }}>{s.desc}</p>
                  {s.tags?.length > 0 && (
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom: 12 }}>
                      {s.tags.map(t => <span key={t} style={{ fontSize:"0.62rem", background: dark?"#1e1e1e":"#f0f0f0", color: muted, borderRadius:4, padding:"2px 7px" }}>{t}</span>)}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: muted }}>{s.category}{s.time ? ` · ${s.time}` : ""}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setOpenCourse({ id: `admin-${s.id}`, title: s.title, difficulty: s.difficulty, desc: s.desc, category: s.category, color: "#2563EB" })}
                        style={{ background: "#2563EB22", border: "1px solid #2563EB55", color: "#60A5FA", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: "0.78rem", cursor:"pointer" }}>
                        Study
                      </button>
                      {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ background: dark?"#1a1a1a":"#f0f0f0", border: "1px solid " + border, color: muted, borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: "0.78rem", textDecoration:"none" }}>Source ↗</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export {
  StudiesPage,
};
