import { useState } from "react";
import { LearnBoard } from "./LearnBoard.jsx";

function MasteryBars({ breakdown, color, muted, fg }) {
  const rows = [
    { key: "theory", label: "Theory" }, { key: "plans", label: "Plans" },
    { key: "tactics", label: "Tactics" }, { key: "recall", label: "Recall" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(r => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 52, fontSize: "0.72rem", color: muted, fontWeight: 600, flexShrink: 0 }}>{r.label}</div>
          <div style={{ flex: 1, height: 7, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${breakdown[r.key]}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ width: 32, fontSize: "0.72rem", color: fg, fontWeight: 700, textAlign: "right", flexShrink: 0 }}>{breakdown[r.key]}%</div>
        </div>
      ))}
    </div>
  );
}

// Chains practice mode across every variation in the opening, one after
// another, and shows a real pass/fail summary at the end — no invented
// scoring, just the same correct/mistakes signal LearnBoard already produces,
// aggregated. Marks the opening's "test-passed" checkpoint when the pass
// rate is solid (each variation completed with at most one slip).
function MasteryTestRunner({ opening, onVariationComplete, onFinished, dark, G, AMBER, border, card, fg, muted }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]); // [{id, mistakes}]
  const variation = opening.variations[idx];

  if (!variation) {
    const passed = results.length > 0 && results.every(r => r.mistakes <= 1);
    const passRate = results.length ? Math.round((results.filter(r => r.mistakes <= 1).length / results.length) * 100) : 0;
    return (
      <div style={{ background: card, border: `1px solid ${passed ? "#4ade8055" : border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>{passed ? "🏆" : "📋"}</div>
        <div style={{ fontFamily: "Georgia,serif", fontWeight: 700, fontSize: "1.15rem", color: fg, marginBottom: 6 }}>
          {passed ? "Mastery Test Passed" : "Test Complete"}
        </div>
        <div style={{ fontSize: "0.85rem", color: muted, marginBottom: 18 }}>
          {results.filter(r => r.mistakes <= 1).length} of {results.length} lines reproduced cleanly ({passRate}%)
        </div>
        <button onClick={onFinished} style={{ background: `${G}18`, border: `1px solid ${G}44`, color: G, fontWeight: 700, fontSize: "0.82rem", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "0.74rem", color: muted, marginBottom: 10, fontWeight: 600 }}>Line {idx + 1} of {opening.variations.length} — {variation.name}</div>
      <LearnBoard
        variation={variation} mode="practice" dark={dark} G={G} AMBER={AMBER} border={border} card={card} fg={fg} muted={muted}
        lineNumber={idx + 1} lineTotal={opening.variations.length} courseName={opening.name}
        onComplete={(correct, mistakes) => {
          onVariationComplete(variation.id, correct, mistakes);
          setResults(r => [...r, { id: variation.id, mistakes }]);
          setTimeout(() => setIdx(i => i + 1), 1600);
        }}
      />
    </div>
  );
}

export {
  MasteryBars,
  MasteryTestRunner,
};
