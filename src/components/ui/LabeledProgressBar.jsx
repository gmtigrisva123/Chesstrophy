// ── Shared labeled progress bar — used by Opening Academy AND Courses (course
// cards, CourseViewer's header) so the same label+percentage+bar pattern
// isn't hand-rolled in three different places with three chances to drift
// out of sync. Distinct from the plain value/max ProgressBar used elsewhere
// (dashboard widgets) — this one always shows a label and a percent.
function LabeledProgressBar({ label, percent, color = "#C9A84C", dark, showLabel = true, height = 5 }) {
  const barColor = percent >= 100 ? "#4ade80" : color;
  return (
    <div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: dark ? "#888" : "#666", marginBottom: 5 }}>
          <span>{label}</span><span style={{ color: barColor, fontWeight: 700 }}>{percent}%</span>
        </div>
      )}
      <div style={{ height, background: dark ? "#1a1a1a" : "#ebebeb", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: `linear-gradient(90deg,${barColor},${barColor}bb)`, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export {
  LabeledProgressBar,
};
