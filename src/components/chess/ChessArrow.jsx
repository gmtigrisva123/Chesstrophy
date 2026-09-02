import { CHESS_ARROW_BEST } from "../../theme/boardTheme.js";

// Clean directional move arrow (from → to), layered behind the piece.
// square(sq) must return {x,y} center coordinates in the same pixel space
// as the board render. Pass color to distinguish best-move (green) vs
// alternative (muted brown) suggestions.
function ChessArrow({ from, to, squareOf, sqSize, color = CHESS_ARROW_BEST, opacity = 0.85 }) {
  if (from == null || to == null || from === to) return null;
  const a = squareOf(from), b = squareOf(to);
  if (!a || !b) return null;
  const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const shorten = sqSize * 0.32; // stop before the destination square center so the arrowhead doesn't hide under the piece
  const ex = x2 - Math.cos(angle) * shorten;
  const ey = y2 - Math.sin(angle) * shorten;
  const headLen = Math.max(10, sqSize * 0.22);
  const hx1 = ex - headLen * Math.cos(angle - Math.PI / 7);
  const hy1 = ey - headLen * Math.sin(angle - Math.PI / 7);
  const hx2 = ex - headLen * Math.cos(angle + Math.PI / 7);
  const hy2 = ey - headLen * Math.sin(angle + Math.PI / 7);
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={Math.max(4, sqSize * 0.14)} strokeLinecap="round" opacity={opacity} />
      <polygon points={`${ex},${ey} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} opacity={opacity} />
    </svg>
  );
}

export {
  ChessArrow,
};
