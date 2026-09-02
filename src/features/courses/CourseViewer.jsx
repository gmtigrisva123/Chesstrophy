import { useState, useMemo } from "react";
import { CourseCheatSheetTab } from "./CourseCheatSheetTab.jsx";
import { CourseLearnTab } from "./CourseLearnTab.jsx";
import { CoursePracticeTab } from "./CoursePracticeTab.jsx";
import { CourseTabBar } from "./CourseTabBar.jsx";
import { LabeledProgressBar } from "../../components/ui/LabeledProgressBar.jsx";
import { LevelBadge } from "../../components/ui/LevelBadge.jsx";
import { RewardToast } from "../../components/ui/RewardToast.jsx";
import { getCourseContent, getCourseState, patchCourseState } from "../../services/courseProgress.js";

function CourseViewer({ course, dark, onBack, setActive }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const color  = course.color || "#C9A84C";
  const content = useMemo(() => getCourseContent(course), [course]);

  const [state, setStateRaw] = useState(() => getCourseState(course.id));
  const setState = (patch) => setStateRaw(s => patchCourseState(course.id, { ...s, ...patch }));
  const [reward, setReward] = useState(null);

  const [tab, setTab] = useState(state.lastTab || "learn");
  const changeTab = (t) => { setTab(t); setState({ lastTab: t }); };

  const chapterCount = content.chapters?.length || 0;
  const headerPct = chapterCount ? Math.round((Math.min((state.furthest||0)+1, chapterCount) / chapterCount) * 100) : 0;

  const tabs = [
    { key: "learn",   icon: "📖", label: "Learn" },
    { key: "cheat",   icon: "📄", label: "Cheat Sheet" },
    { key: "practice",icon: "🎯", label: "Practice" },
  ];

  return (
    <div className="cf-fade-in">
      <button onClick={onBack} style={{
        background: "transparent", border: `1px solid ${border}`, borderRadius: 9, padding: "7px 14px",
        color: muted, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 6,
      }}>← Back to Study Library</button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <LevelBadge level={course.difficulty} />
            {course.category && <span style={{ fontSize: "0.72rem", color: muted }}>{course.category}</span>}
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "1.6rem", fontWeight: 800, color: fg, lineHeight: 1.25, marginBottom: 6 }}>{course.title}</h1>
          {course.desc && <div style={{ fontSize: "0.85rem", color: muted, lineHeight: 1.6, maxWidth: 520, marginBottom: 8 }}>{course.desc}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: "0.76rem", color: muted }}>
            <span>By <strong style={{ color: fg }}>{course.author || "ChessProphy"}</strong></span>
            <span>{chapterCount} Chapter{chapterCount === 1 ? "" : "s"}</span>
            {!!course.members && <span>{course.members.toLocaleString()} Member{course.members === 1 ? "" : "s"}</span>}
          </div>
        </div>
        {chapterCount > 0 && (
          <div style={{ minWidth: 140, width: 140 }}>
            <LabeledProgressBar label="Progress" percent={headerPct} color={color} dark={dark} />
          </div>
        )}
      </div>


      <div style={{ marginBottom: 26, maxWidth: 620 }}>
        <CourseTabBar tabs={tabs} active={tab} onChange={changeTab} dark={dark} color={color} />
      </div>

      {tab === "learn"    && <CourseLearnTab      course={course} content={content} dark={dark} fg={fg} muted={muted} card={card} border={border} color={color} state={state} setState={setState} />}
      {tab === "cheat"    && <CourseCheatSheetTab  course={course} content={content} dark={dark} fg={fg} muted={muted} card={card} border={border} color={color} />}
      {tab === "practice" && <CoursePracticeTab    course={course} content={content} dark={dark} fg={fg} muted={muted} card={card} border={border} color={color} state={state} setState={setState} setActive={setActive} onReward={setReward} />}

      <RewardToast reward={reward} dark={dark} onClose={() => setReward(null)} />
    </div>
  );
}

export {
  CourseViewer,
};
