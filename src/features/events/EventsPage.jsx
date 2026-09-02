import { EventJoinButton } from "../../components/ui/EventJoinButton.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { loadAdminData } from "../../services/adminData.js";
import { eventCountdown } from "../../services/profile.js";

function EventsPage({ dark }) {
  const fg = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#888" : "#666";
  const card = dark ? "rgba(17,24,39,0.5)" : "#fff";
  const border = dark ? "rgba(148,163,255,0.10)" : "#e8e8e8";
  const GOLD = "#C9A84C";
  const events = loadAdminData().events || [];
  const featured = events.find(e => e.featured);
  const rest = events.filter(e => e.id !== featured?.id);
  return (
    <div>
      <SectionHeader dark={dark} eyebrow="Get Involved" title="Upcoming Events" sub="Tournaments, webinars, and community meetups." />
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: muted, fontSize: "0.85rem" }}>No events scheduled right now.</div>
      ) : (
        <>
          {featured && (
            <div style={{
              position: "relative", overflow: "hidden", borderRadius: 20, padding: "26px 28px", marginBottom: 24,
              background: featured.banner ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${featured.banner}) center/cover` : `linear-gradient(135deg, ${GOLD}22, #2563EB18)`,
              border: `1px solid ${GOLD}44`,
            }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>🏆 Featured Event</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: featured.banner ? "#fff" : fg, marginBottom: 8, fontFamily: "Georgia,serif" }}>{featured.title}</div>
              <div style={{ fontSize: "0.82rem", color: featured.banner ? "#e5e5e5" : muted, marginBottom: 14 }}>
                📅 {featured.date} · {featured.time} · {featured.type}{featured.participants ? ` · ${featured.participants.toLocaleString()} registered` : ""}
              </div>
              {featured.desc && <div style={{ fontSize: "0.82rem", color: featured.banner ? "#ddd" : muted, lineHeight: 1.6, marginBottom: 18, maxWidth: 560 }}>{featured.desc}</div>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <EventJoinButton ev={featured} primary GOLD={GOLD} />
                {featured.registerUrl && <a href={featured.registerUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${GOLD}66`, background: "transparent", color: GOLD, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>External Registration ↗</a>}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {rest.map(ev => {
              const cd = eventCountdown(ev);
              return (
                <div key={ev.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                  {ev.banner && <img src={ev.banner} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      {ev.type && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#60a5fa", background: "#60a5fa18", borderRadius: 6, padding: "2px 8px" }}>{ev.type}</span>}
                      {cd && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD }}>{cd}</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ fontSize: "0.76rem", color: "#60a5fa", marginBottom: 6 }}>📅 {ev.date} · {ev.time}</div>
                    {(ev.organizer || ev.participants) && (
                      <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 10 }}>{ev.organizer}{ev.participants ? ` · ${ev.participants.toLocaleString()} joined` : ""}</div>
                    )}
                    <div style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.6, marginBottom: 14 }}>{ev.desc}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <EventJoinButton ev={ev} GOLD={GOLD} />
                      {ev.registerUrl && (
                        <a href={ev.registerUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "transparent", border: `1px solid ${border}`, color: fg, fontWeight: 700, fontSize: "0.74rem", padding: "8px 14px", borderRadius: 8, textDecoration: "none" }}>External ↗</a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export {
  EventsPage,
};
