// ── Move list ─────────────────────────────────────────────────────────────────
// A single shared, reusable move-chip renderer; both LearnBoard and
// LearningModeView previously each hand-rolled their own near-identical
// version. Colours are passed in per call site so neither one's look changes.
//
// `moves` is the line in ply order, `currentIdx` the ply the board is on, and
// passing `onClickMove` turns the chips into buttons.
function MoveList({ moves, currentIdx, doneColor, currentColor, mutedColor, onClickMove, size = "0.78rem", idleBorder = "transparent" }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {moves.map((m, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const color = isDone ? doneColor : isCurrent ? currentColor : mutedColor;
        const background = isDone ? `${doneColor}18` : isCurrent ? `${currentColor}18` : "transparent";
        const style = {
          fontSize: size, fontFamily: "monospace", padding: "3px 7px", borderRadius: onClickMove ? 7 : 5,
          background, color, fontWeight: isCurrent ? 700 : 500,
          border: onClickMove ? `1px solid ${isCurrent ? currentColor + "66" : idleBorder}` : "none",
          cursor: onClickMove ? "pointer" : "default",
        };
        // Ply number prefix on White's moves only, matching standard notation.
        const label = `${i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}${m.san}`;
        // `key` is passed explicitly rather than spread: React 18 warns when a
        // key arrives via a spread object, and React 19 drops it silently.
        return onClickMove
          ? <button key={i} type="button" onClick={() => onClickMove(i)} aria-current={isCurrent ? "step" : undefined} style={style}>{label}</button>
          : <span key={i} style={style}>{label}</span>;
      })}
    </div>
  );
}

export {
  MoveList,
};
