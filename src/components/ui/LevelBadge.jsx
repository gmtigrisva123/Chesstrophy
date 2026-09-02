import { LEVEL_COLOR } from "../../theme/levelColors.js";

function LevelBadge({ level }) {
  return (
    <span style={{
      background: `${LEVEL_COLOR[level] || "#C9A84C"}22`,
      color: LEVEL_COLOR[level] || "#C9A84C",
      border: `1px solid ${LEVEL_COLOR[level] || "#C9A84C"}55`,
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em",
      padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{level}</span>
  );
}

export {
  LevelBadge,
};
