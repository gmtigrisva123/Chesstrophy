// ── BOOT SKELETON ─────────────────────────────────────────────────────────────
// Mirrors the real sidebar + dashboard shape instead of a blank centered
// spinner, so the transition into the loaded app feels continuous rather than
// like a flash-cut.
function AppSkeleton() {
  const shimmer = { background: "linear-gradient(90deg, #131313 25%, #1c1c1c 37%, #131313 63%)", backgroundSize: "400% 100%", animation: "skShimmer 1.4s ease infinite", borderRadius: 10 };
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0a0a0a", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif" }}>
      <style>{`@keyframes skShimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } } @media (max-width: 860px) { .sk-sidebar { display: none !important; } }`}</style>
      {/* Sidebar skeleton */}
      <div className="sk-sidebar" style={{ width: 254, flexShrink: 0, borderRight: "1px solid #1a1a1a", padding: "22px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 22, width: "70%", ...shimmer, marginBottom: 26 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 15, width: `${75 - (i % 3) * 10}%`, ...shimmer, marginBottom: 6 }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ flex: 1, padding: "36px 44px", maxWidth: 1080 }}>
        <div style={{ height: 12, width: 140, ...shimmer, marginBottom: 14 }} />
        <div style={{ height: 30, width: 320, ...shimmer, marginBottom: 34 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 30 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 90, ...shimmer }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 130, ...shimmer }} />)}
        </div>
      </div>
    </div>
  );
}


export {
  AppSkeleton,
};
