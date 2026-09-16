import { useState, useEffect } from "react";
import { DashEmpty } from "../../components/ui/EmptyState.jsx";
import { EventJoinButton } from "../../components/ui/EventJoinButton.jsx";
import { LevelBadge } from "../../components/ui/LevelBadge.jsx";
import { ProgStat } from "../../components/ui/StatTiles.jsx";
import { ALL_GAMES } from "../../data/classicGames.js";
import { OPENING_REPERTOIRE } from "../../data/openingRepertoire.js";
import { STUDIES_DATA } from "../../data/studies.js";
import { timeAgo } from "../../lib/format/time.js";
import { defaultAdminData, loadAdminData } from "../../services/adminData.js";
import { getMostRecentCourse } from "../../services/courseProgress.js";
import { loadDQState } from "../../services/dailyQuestionsState.js";
import { levelBounds, levelFromXP, loadEconomy } from "../../services/economy.js";
import { getMostRecentOpening, loadOpState } from "../../services/openingProgress.js";
import { eventCountdown, loadProfile, saveProfile } from "../../services/profile.js";
import { loadPzState } from "../../services/puzzleProgress.js";
import { ChessDNAWidget } from "../chessDna/ChessDNAWidget.jsx";

// Module scope: a nested definition restarts the shimmer animation from frame
// zero on every Dashboard render.
function Skel({ h = 60, r = 12, dark }) {
  return <div style={{ height: h, background: dark ? "#151515" : "#f0f0f0", borderRadius: r, animation: "dashShimmer 1.5s ease-in-out infinite" }} />;
}

function Dashboard({ dark, setActive }) {
  const G      = "#2563EB";
  const GOLD   = "#C9A84C";
  const PURPLE = "#8b5cf6";
  const BLUE   = "#60a5fa";
  const AMBER  = "#f59e0b";
  const RED    = "#ef4444";
  const GREEN  = "#4ade80";
  const fg     = dark ? "#f1f5f9" : "#111";
  const muted  = dark ? "#7d8598"    : "#888";
  const card   = dark ? "rgba(17,24,39,0.55)" : "rgba(255,255,255,0.75)";
  const border = dark ? "rgba(148,163,255,0.10)" : "rgba(37,99,235,0.10)";

  // ── Live data (all pulled from existing storage — nothing new invented) ────
  const adminData = loadAdminData();
  const rawCfg = adminData.dashboardConfig || defaultAdminData().dashboardConfig;
  // Reconcile: a browser that already has a saved dashboardConfig (from before
  // classicGames/openingTrainer existed) would have an `order` array missing
  // those keys — and since the render loop below only shows keys present in
  // `order`, the new sections would silently never appear for that install.
  // Append any known section key that's missing, defaulting to visible, so
  // newly-added dashboard sections always show up regardless of what's saved.
  const missingKeys = Object.keys({ welcome: 1, classicGames: 1, openingTrainer: 1, updates: 1, featuredEvent: 1, upcomingEvents: 1, continueLearning: 1, progress: 1, recommendations: 1, activity: 1 }).filter(k => !rawCfg.order.includes(k));
  const cfg = missingKeys.length ? { ...rawCfg, order: [...rawCfg.order, ...missingKeys] } : rawCfg;
  // NOTE: adminData.widgets is a leftover toggle set from the removed Admin
  // Portal. Its keys (dailyPuzzle, leaderboard, …) do not correspond to any
  // section this dashboard renders — `cfg.sections` / `cfg.order` below is the
  // live mechanism. Deliberately not read here rather than guessing a mapping.

  const profile = loadProfile();
  const econ = loadEconomy();
  const pz = loadPzState();
  const dq = loadDQState();
  const level = levelFromXP(econ.xp);
  const { min: lvlMin, max: lvlMax } = levelBounds(level);
  const levelPct = Math.max(2, Math.round(((econ.xp - lvlMin) / Math.max(1, lvlMax - lvlMin)) * 100));
  const bestStreak = Math.max(pz.streak || 0, dq.streak || 0);
  const coursesCompleted = (econ.transactions || []).filter(t => t.type === "course_complete").length;

  const [graffTime] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const events = adminData.events || [];
  const now = Date.now();
  const isUpcoming = ev => !ev.datetime || new Date(ev.datetime).getTime() >= now;
  const featuredEvent = events.find(e => e.featured) || events.filter(isUpcoming).sort((a, b) => new Date(a.datetime || 0) - new Date(b.datetime || 0))[0] || null;
  const upcomingEvents = events.filter(e => e.id !== featuredEvent?.id && isUpcoming(e))
    .sort((a, b) => new Date(a.datetime || 0) - new Date(b.datetime || 0)).slice(0, 3);

  const announcements = (adminData.announcements || []).filter(a => a.active);
  const news = (adminData.news || []).filter(n => n.published);
  const updates = [
    ...announcements.map(a => ({ id: "a" + a.id, title: a.title, desc: a.body, image: "", date: a.date, category: "Announcement", icon: "📢", go: null })),
    ...news.slice().reverse().map(n => ({ id: "n" + n.id, title: n.title, desc: (n.content || "").replace(/[#*_`]/g, "").slice(0, 140), image: n.cover, date: n.date, category: "News", icon: "📰", go: "News" })),
  ].slice(0, 4);

  const mostRecent = getMostRecentCourse();

  // ── Opening Trainer data — real spaced-repetition progress, same source as
  // the Opening Academy itself. Falls back to the top of the repertoire
  // (by popularity) when the user hasn't practiced anything yet.
  const opState = loadOpState();
  const mostRecentOpening = getMostRecentOpening(opState);
  const openingSpotlight = mostRecentOpening || (() => {
    const top = [...OPENING_REPERTOIRE].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
    return top ? { opening: top, chapterIdx: 0, chapterCount: top.variations.length, pct: 0 } : null;
  })();

  // Simple rule-based recommendations by puzzle rating tier, skipping completed courses
  const completedIds = new Set((econ.transactions || []).filter(t => t.type === "course_complete").map(t => t.referenceId));
  const tier = pz.puzzleRating >= 1700 ? "Advanced" : pz.puzzleRating >= 1300 ? "Intermediate" : "Beginner";
  const allCourses = [
    ...STUDIES_DATA.flatMap(cat => cat.items.map(i => ({ ...i, category: cat.category, color: cat.color }))),
    ...((adminData.courses || []).filter(c => c.published && !c.archived)),
  ];
  const recommendations = allCourses.filter(c => !completedIds.has(c.id) && c.difficulty === tier).slice(0, 3)
    .concat(allCourses.filter(c => !completedIds.has(c.id) && c.difficulty !== tier)).slice(0, 3);

  const recentTx = (econ.transactions || []).slice(0, 5);

  const isNewUser = (econ.transactions || []).length === 0 && coursesCompleted === 0 && bestStreak === 0;
  const [onboardDismissed, setOnboardDismissed] = useState(() => !!loadProfile().dismissedOnboarding);
  const dismissOnboarding = () => { const p = loadProfile(); saveProfile({ ...p, dismissedOnboarding: true }); setOnboardDismissed(true); };

  // ── Section renderers ──────────────────────────────────────────────────────
  const renderWelcome = () => (
    <div key="welcome" style={{
      position: "relative", overflow: "hidden",
      background: dark ? "linear-gradient(135deg,#0a120a 0%,#0d0d0d 40%,#0a0d12 100%)" : "linear-gradient(135deg,#f0fdf4 0%,#fff 40%,#f0f4ff 100%)",
      border: `1px solid ${G}22`, borderRadius: 20, padding: "26px 26px", marginBottom: 30,
      boxShadow: dark ? `0 0 40px ${G}0a, 0 2px 16px rgba(0,0,0,0.3)` : `0 2px 16px rgba(0,0,0,0.06)`,
    }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: `radial-gradient(circle,${G}12 0%,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: "0.7rem", color: G, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: G, display: "inline-block", boxShadow: `0 0 6px ${G}` }} />
        ChessProphy · Home
      </div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: fg, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.15 }}>
        {graffTime}, <span style={{ background: `linear-gradient(90deg,${G},#4ade80)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{profile.displayName || profile.username}</span> {profile.avatar || "👋"}
      </h1>
      <p style={{ fontSize: "0.85rem", color: muted, marginBottom: 18 }}>Ready to improve your chess? Here&apos;s what&apos;s happening on ChessProphy today.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="dash-action" onClick={() => setActive("Studies")} style={{ padding: "9px 16px", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, borderRadius: 10, color: fg, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>📖 Continue Learning</button>
        <button className="dash-action" onClick={() => setActive("Puzzles")} style={{ padding: "9px 16px", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, borderRadius: 10, color: fg, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>🧩 Solve Puzzles</button>
        <button className="dash-action" onClick={() => setActive("Classics")} style={{ padding: "9px 16px", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}`, borderRadius: 10, color: fg, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>🔍 Analyze Game</button>
        <button className="dash-action" onClick={() => setActive("Events")} style={{ padding: "9px 16px", background: `${G}14`, border: `1px solid ${G}33`, borderRadius: 10, color: G, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}>📅 View Events</button>
      </div>
      {isNewUser && !onboardDismissed && (
        <div style={{
          marginTop: 20, paddingTop: 18, borderTop: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.3rem" }}>👋</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.84rem", color: fg }}>New here? Here&apos;s where to start.</div>
              <div style={{ fontSize: "0.76rem", color: muted, marginTop: 2 }}>Solve a few puzzles or start a course — your progress, streak, and ProphyCoins all build from there.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setActive("Puzzles")} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${G},${G}cc)`, color: "#fff", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}>Get Started →</button>
            <button onClick={dismissOnboarding} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: "transparent", color: muted, fontWeight: 600, fontSize: "0.76rem", cursor: "pointer" }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderUpdates = () => (
    <div key="updates" style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>📢 ChessProphy Updates</div>
        <button onClick={() => setActive("News")} style={{ background: "transparent", border: "none", color: G, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>View all →</button>
      </div>
      {updates.length === 0 ? (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16 }}>
          <DashEmpty icon="📢" title="No updates yet" sub="Check back soon for news from the ChessProphy team." dark={dark} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {updates.map(u => (
            <div key={u.id} onClick={() => u.go && setActive(u.go)} style={{
              background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden",
              cursor: u.go ? "pointer" : "default", display: "flex", flexDirection: "column",
            }}>
              {u.image && <img src={u.image} alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />}
              <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: u.category === "News" ? BLUE : GOLD, background: (u.category === "News" ? BLUE : GOLD) + "18", borderRadius: 6, padding: "2px 8px" }}>{u.icon} {u.category}</span>
                  <span style={{ fontSize: "0.64rem", color: muted }}>{u.date}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.86rem", color: fg, marginBottom: 6, lineHeight: 1.3 }}>{u.title}</div>
                <div style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.55, flex: 1 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFeaturedEvent = () => (
    <div key="featuredEvent" style={{ marginBottom: 30 }}>
      {!featuredEvent ? null : (
        <div style={{
          position: "relative", overflow: "hidden", borderRadius: 20, padding: "26px 28px",
          background: featuredEvent.banner ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${featuredEvent.banner}) center/cover` : `linear-gradient(135deg, ${GOLD}22, ${G}18)`,
          border: `1px solid ${GOLD}44`,
        }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>🏆 Featured Event</div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: featuredEvent.banner ? "#fff" : fg, marginBottom: 8, fontFamily: "Georgia,serif" }}>{featuredEvent.title}</div>
          <div style={{ fontSize: "0.82rem", color: featuredEvent.banner ? "#e5e5e5" : muted, marginBottom: 14 }}>
            📅 {featuredEvent.date} · {featuredEvent.time} · {featuredEvent.type}
          </div>
          {featuredEvent.desc && <div style={{ fontSize: "0.82rem", color: featuredEvent.banner ? "#ddd" : muted, lineHeight: 1.6, marginBottom: 18, maxWidth: 560 }}>{featuredEvent.desc}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setActive("Events")} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${GOLD}66`, background: "transparent", color: GOLD, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>View Event</button>
            <EventJoinButton ev={featuredEvent} primary GOLD={GOLD} />
          </div>
        </div>
      )}
    </div>
  );

  const renderUpcomingEvents = () => (
    <div key="upcomingEvents" style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>📅 Upcoming Events</div>
        <button onClick={() => setActive("Events")} style={{ background: "transparent", border: "none", color: G, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>View all →</button>
      </div>
      {upcomingEvents.length === 0 ? (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16 }}>
          <DashEmpty icon="📅" title="No upcoming events yet" sub="Check back soon for the next ChessProphy event." dark={dark} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {upcomingEvents.map(ev => {
            const cd = eventCountdown(ev);
            return (
              <div key={ev.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: BLUE, background: BLUE + "18", borderRadius: 6, padding: "2px 8px" }}>{ev.type || "Event"}</span>
                  {cd && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD }}>{cd}</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.86rem", color: fg, marginBottom: 6 }}>{ev.title}</div>
                <div style={{ fontSize: "0.74rem", color: muted, marginBottom: 4 }}>{ev.date} · {ev.time}</div>
                {ev.organizer && <div style={{ fontSize: "0.72rem", color: muted, marginBottom: 12 }}>{ev.organizer}</div>}
                <EventJoinButton ev={ev} GOLD={GOLD} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderContinueLearning = () => (
    <div key="continueLearning" style={{ marginBottom: 30 }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 12 }}>📖 Continue Learning</div>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "22px 22px" }}>
        {mostRecent ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 3 }}>{mostRecent.course.category || "Studies"}</div>
                <div style={{ fontWeight: 700, fontSize: "0.94rem", color: fg }}>{mostRecent.course.title}</div>
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: mostRecent.course.color || G }}>{mostRecent.pct}%</div>
            </div>
            <div style={{ height: 7, background: dark ? "#1e1e1e" : "#ebebeb", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: "100%", width: `${mostRecent.pct}%`, background: `linear-gradient(90deg,${mostRecent.course.color || G},${mostRecent.course.color || G}bb)`, borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            <button onClick={() => setActive("Studies")} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${mostRecent.course.color || G},${mostRecent.course.color || G}cc)`, color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Continue →</button>
          </div>
        ) : (
          <div>
            <DashEmpty icon="🚀" title="Start your chess improvement journey" sub="Explore our learning resources to get started." dark={dark} />
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4 }}>
              <button onClick={() => setActive("Studies")} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${G},${G}cc)`, color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Browse Studies →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClassicGames = () => (
    <div key="classicGames" style={{ marginBottom: 30 }}>
      <div
        onClick={() => setActive("Classics")}
        style={{
          background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "22px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.15s, transform 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = `${PURPLE}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}
      >
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(360px 140px at 0% 0%, ${PURPLE}12, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: `${PURPLE}18`, border: `1px solid ${PURPLE}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>♟</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 3 }}>Classic Games</div>
            <div style={{ fontSize: "0.78rem", color: muted }}>Explore {ALL_GAMES.length} legendary games and learn from the ideas behind them.</div>
          </div>
        </div>
        {/* flexShrink: 0 — without it the flex row shrinks this box below its
            own (nowrap) content on narrow screens, and the card's overflow:hidden
            clips the arrow. */}
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: PURPLE, whiteSpace: "nowrap", flexShrink: 0, position: "relative" }}>Browse →</span>
      </div>
    </div>
  );

  const renderOpeningTrainer = () => (
    <div key="openingTrainer" style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg }}>🗺️ Opening Trainer</div>
        <button onClick={() => setActive("Openings")} style={{ background: "transparent", border: "none", color: G, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>View all openings →</button>
      </div>
      <div style={{
        background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "22px 22px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(420px 160px at 100% 0%, ${PURPLE}12, transparent 60%)`, pointerEvents: "none" }} />
        {openingSpotlight ? (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: muted, marginBottom: 3 }}>{openingSpotlight.opening.eco ? `ECO ${openingSpotlight.opening.eco}` : "Opening"}</div>
                <div style={{ fontWeight: 700, fontSize: "0.94rem", color: fg }}>{openingSpotlight.opening.name}</div>
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: PURPLE }}>{openingSpotlight.pct}%</div>
            </div>
            <div style={{ fontSize: "0.74rem", color: muted, marginBottom: 10 }}>Chapter {openingSpotlight.chapterIdx + 1} / {openingSpotlight.chapterCount}</div>
            <div style={{ height: 7, background: dark ? "#1e1e1e" : "#ebebeb", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: "100%", width: `${openingSpotlight.pct}%`, background: `linear-gradient(90deg,${PURPLE},${BLUE})`, borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            <button onClick={() => setActive("Openings")} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${PURPLE},${BLUE})`, color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>Continue →</button>
          </div>
        ) : (
          <DashEmpty icon="🗺️" title="Build your opening repertoire" sub="Start Opening Academy to track your progress here." dark={dark} />
        )}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div key="progress" style={{ marginBottom: 30 }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 12 }}>📈 My Chess Progress</div>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: fg }}>Level {level}</span>
          <span style={{ fontSize: "0.72rem", color: muted }}>{econ.xp.toLocaleString()} / {lvlMax.toLocaleString()} XP</span>
        </div>
        <div style={{ height: 8, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: "100%", width: `${levelPct}%`, background: `linear-gradient(90deg,${BLUE},${PURPLE})`, borderRadius: 4, transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
          <ProgStat label="Puzzle Rating" value={pz.puzzleRating || 1200} icon="🧩" color={AMBER} />
          <ProgStat label="Puzzles Solved" value={(pz.solved || []).length} icon="✅" color={GREEN} />
          <ProgStat label="Courses Done" value={coursesCompleted} icon="📖" color={GOLD} />
          <ProgStat label="Streak" value={`${bestStreak}d`} icon="🔥" color={RED} />
          <ProgStat label="ProphyCoins" value={econ.coins.toLocaleString()} icon="🪙" color={GOLD} />
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div key="recommendations" style={{ marginBottom: 30 }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 12 }}>✨ Recommended For You</div>
      {recommendations.length === 0 ? (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16 }}>
          <DashEmpty icon="✨" title="You're all caught up!" sub="Check back soon for new recommendations." dark={dark} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {recommendations.map(c => (
            <div key={c.id} onClick={() => setActive("Studies")} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <LevelBadge level={c.difficulty} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.84rem", color: fg, marginBottom: 6, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: "0.72rem", color: muted, lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div key="activity" style={{ marginBottom: 30 }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fg, marginBottom: 12 }}>⏰ Recent Activity</div>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "18px 22px" }}>
        {recentTx.length === 0 ? (
          <DashEmpty icon="⏰" title="No activity yet" sub="Solve a puzzle or complete a course to see it here." dark={dark} />
        ) : (
          recentTx.map((t, i) => (
            <div key={t.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", paddingBottom: 9, marginBottom: 9, borderBottom: i < recentTx.length - 1 ? `1px solid ${border}` : "none" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: (t.amount >= 0 ? GREEN : RED) + "15", border: `1px solid ${(t.amount >= 0 ? GREEN : RED)}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{t.amount >= 0 ? "🪙" : "💎"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.74rem", color: fg, fontWeight: 500 }}>{t.reason || t.type}</div>
                <div style={{ fontSize: "0.64rem", color: muted, marginTop: 2 }}>{timeAgo(t.date)}</div>
              </div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: t.amount >= 0 ? GREEN : RED }}>{t.amount >= 0 ? "+" : ""}{t.amount}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const SECTION_RENDERERS = {
    welcome: renderWelcome, classicGames: renderClassicGames, openingTrainer: renderOpeningTrainer,
    updates: renderUpdates, featuredEvent: renderFeaturedEvent,
    upcomingEvents: renderUpcomingEvents, continueLearning: renderContinueLearning,
    progress: renderProgress, recommendations: renderRecommendations, activity: renderActivity,
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
      <style>{`
        @keyframes dashFade    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dashShimmer { 0%{opacity:0.5} 50%{opacity:0.9} 100%{opacity:0.5} }
        .dash-action:hover { opacity: 0.85; transform: translateY(-2px); }
      `}</style>

      {cfg.banner?.active && cfg.banner.text && (
        <div onClick={() => cfg.banner.linkTarget && setActive(cfg.banner.linkTarget)} style={{
          background: `${cfg.banner.color}18`, border: `1px solid ${cfg.banner.color}44`, borderRadius: 14,
          padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: cfg.banner.linkTarget ? "pointer" : "default",
        }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: fg }}>{cfg.banner.text}</span>
          {cfg.banner.linkLabel && <span style={{ fontSize: "0.76rem", fontWeight: 700, color: cfg.banner.color }}>{cfg.banner.linkLabel} →</span>}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skel dark={dark} h={160} r={20} /><Skel dark={dark} h={100} /><Skel dark={dark} h={100} /><Skel dark={dark} h={100} />
        </div>
      ) : (
        <div style={{ animation: "dashFade 0.4s ease" }}>
          {cfg.order.filter(key => cfg.sections[key] !== false && SECTION_RENDERERS[key]).map(key => SECTION_RENDERERS[key]())}

          {/* ─── CHESS DNA WIDGET ────────────────────────────────────────────── */}
          <ChessDNAWidget dark={dark} fg={fg} muted={muted} onExpand={() => setActive("ChessDNA")} />
        </div>
      )}
    </div>
  );
}

export {
  Dashboard,
};
