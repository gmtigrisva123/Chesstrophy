// ── Radar SVG for DNA ─────────────────────────────────────────────────────────
function DNARadar({ attrs, size = 200 }) {
  const cx = size/2, cy = size/2, r = size * 0.38;
  const n = attrs.length;
  const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, val) => {
    const a = angle(i), pct = val / 100;
    return [cx + r * pct * Math.cos(a), cy + r * pct * Math.sin(a)];
  };
  const gridPts = pct => attrs.map((_, i) => {
    const a = angle(i);
    return `${cx + r * pct * Math.cos(a)},${cy + r * pct * Math.sin(a)}`;
  }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <polygon key={p} points={gridPts(p)} fill="none" stroke="#2a2a2a" strokeWidth="1" opacity={0.6} />
      ))}
      {attrs.map((_, i) => {
        const a = angle(i);
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#2a2a2a" strokeWidth="1" opacity={0.6} />;
      })}
      <polygon
        points={attrs.map((attr, i) => pt(i, attr.score).join(",")).join(" ")}
        fill="#8b5cf633" stroke="#8b5cf6" strokeWidth="2"
        style={{ transition: "all 0.8s ease" }}
      />
      {attrs.map((attr, i) => {
        const [x, y] = pt(i, attr.score);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={attr.color} style={{ filter: `drop-shadow(0 0 4px ${attr.color})` }} />
          </g>
        );
      })}
      {attrs.map((attr, i) => {
        const a = angle(i), lx = cx + (r + 24) * Math.cos(a), ly = cy + (r + 24) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#666" fontFamily="sans-serif">{attr.icon}</text>
        );
      })}
    </svg>
  );
}

export {
  DNARadar,
};
