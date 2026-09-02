/**
 * Shown while a lazily-loaded route chunk is in flight.
 *
 * Deliberately shaped like a page rather than a spinner: a heading bar, a row
 * of stat tiles and a couple of cards, so the swap to real content reads as the
 * same page filling in instead of a flash-cut.
 *
 * @param {{dark?: boolean}} props
 */
function PageFallback({ dark = true }) {
  const block = {
    background: dark ? "rgba(148,163,255,0.06)" : "rgba(37,99,235,0.06)",
    borderRadius: 12,
    animation: "shimmerPulse 1.5s ease-in-out infinite",
  };

  return (
    <div role="status" aria-live="polite" aria-busy="true" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <span style={{
        position: "absolute", width: 1, height: 1, overflow: "hidden",
        clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap",
      }}>Loading page…</span>
      <div style={{ ...block, height: 12, width: 130, marginBottom: 14 }} />
      <div style={{ ...block, height: 30, width: 300, marginBottom: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 28 }}>
        {["a", "b", "c"].map(k => <div key={k} style={{ ...block, height: 88 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {["d", "e"].map(k => <div key={k} style={{ ...block, height: 150 }} />)}
      </div>
    </div>
  );
}

export { PageFallback };
