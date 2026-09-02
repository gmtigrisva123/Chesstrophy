// ── Radar SVG ────────────────────────────────────────────────────────────────
function RadarChart({ data, size = 220, color = "#2563EB" }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, val) => {
    const a = angle(i), pct = val / 100;
    return [cx + r * pct * Math.cos(a), cy + r * pct * Math.sin(a)];
  };
  const gridPts = (pct) =>
    data.map((_, i) => { const a = angle(i); return `${cx + r * pct * Math.cos(a)},${cy + r * pct * Math.sin(a)}`; }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <polygon key={p} points={gridPts(p)} fill="none" stroke="#2a2a2a" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const a = angle(i);
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#2a2a2a" strokeWidth="1" />;
      })}
      <polygon
        points={data.map((d, i) => pt(i, d.value).join(",")).join(" ")}
        fill={color + "33"} stroke={color} strokeWidth="2"
      />
      {data.map((d, i) => {
        const [x, y] = pt(i, d.value);
        return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
      })}
      {data.map((d, i) => {
        const a = angle(i), lx = cx + (r + 22) * Math.cos(a), ly = cy + (r + 22) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#888" fontFamily="sans-serif">{d.label}</text>
        );
      })}
    </svg>
  );
}

export {
  RadarChart,
};
