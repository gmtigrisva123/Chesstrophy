import { useState } from "react";
import { hasJoinedEvent, joinEventLocal } from "../../services/profile.js";

function EventJoinButton({ ev, primary = false, GOLD }) {
  const [joined, setJoined] = useState(() => hasJoinedEvent(ev.id));
  const join = () => { joinEventLocal(ev.id); setJoined(true); };
  if (joined) {
    return <button disabled style={{ padding: primary ? "10px 20px" : "8px 16px", borderRadius: 9, border: "1px solid #4ade8055", background: "#4ade8015", color: "#4ade80", fontWeight: 700, fontSize: primary ? "0.8rem" : "0.74rem" }}>✓ Joined</button>;
  }
  return (
    <button onClick={join} style={{
      padding: primary ? "10px 20px" : "8px 16px", borderRadius: 9, border: "none",
      background: `linear-gradient(135deg,${GOLD},${GOLD}cc)`, color: "#0a0a0a", fontWeight: 800,
      fontSize: primary ? "0.8rem" : "0.74rem", cursor: "pointer",
    }}>Join Event</button>
  );
}

export {
  EventJoinButton,
};
