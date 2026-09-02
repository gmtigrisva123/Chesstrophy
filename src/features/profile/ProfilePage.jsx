import { useState } from "react";
import { ProfileField, SettingToggle } from "./ProfileControls.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { ProfileStat, ProgressStat } from "../../components/ui/StatTiles.jsx";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { AVATAR_CHOICES } from "../../data/avatars.js";
import { loadDQState } from "../../services/dailyQuestionsState.js";
import { levelBounds, levelFromXP, loadEconomy } from "../../services/economy.js";
import { loadProfile, saveProfile } from "../../services/profile.js";
import { loadPzState } from "../../services/puzzleProgress.js";

function ProfilePage({ dark, setActive, themeMode, setThemeMode }) {
  const fg     = dark ? "#f0f0f0" : "#111";
  const muted  = dark ? "#888"    : "#666";
  const card   = dark ? "#111"    : "#fff";
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  const G = "#C9A84C";

  const [profile, setProfileRaw] = useState(loadProfile);
  const [econ] = useState(loadEconomy); // snapshot for this view; pages re-mount on nav so it's always fresh
  const [tab, setTab] = useState("profile");
  const [logoutNote, setLogoutNote] = useState(false);

  const updateProfile = (patch) => {
    const next = { ...profile, ...patch };
    setProfileRaw(next);
    saveProfile(next);
  };
  const updateSettings = (section, patch) => {
    const next = { ...profile, settings: { ...profile.settings, [section]: { ...profile.settings[section], ...patch } } };
    setProfileRaw(next);
    saveProfile(next);
  };

  const tabs = [
    { key: "profile",  icon: "👤", label: "Profile" },
    { key: "economy",  icon: "🪙", label: "Economy" },
    { key: "progress", icon: "📈", label: "Progress" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];
  const idx = tabs.findIndex(t => t.key === tab);

  const level = levelFromXP(econ.xp);
  const { min, max } = levelBounds(level);
  const levelPct = Math.max(2, Math.round(((econ.xp - min) / Math.max(1, max - min)) * 100));

  const pz = loadPzState();
  const dq = loadDQState();
  const bestStreak = Math.max(pz.streak || 0, dq.streak || 0);
  const coursesCompleted = (econ.transactions || []).filter(t => t.type === "course_complete").length;
  const testsCompleted   = (econ.transactions || []).filter(t => t.type === "course_test").length;
  const packsCompleted   = (econ.transactions || []).filter(t => t.type === "puzzle_pack").length;

  return (
    <div>
      <style>{`.cf-fade-in{animation:cfFadeIn 0.25s ease} @keyframes cfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .pf-tab-btn:hover{transform:translateY(-1px)}`}</style>
      <SectionHeader dark={dark} eyebrow="Account" title="Profile" sub="Manage your profile, track your progress, and adjust your settings." />

      {/* Header card */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "22px 26px", marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `${G}18`, border: `1px solid ${G}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{profile.avatar}</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: fg }}>{profile.displayName || profile.username}</div>
          <div style={{ fontSize: "0.78rem", color: muted }}>@{profile.username} · Joined {new Date(profile.joined).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: G }}>🪙 {econ.coins.toLocaleString()}</div>
            <div style={{ fontSize: "0.64rem", color: muted }}>ProphyCoins</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#60a5fa" }}>Lv {level}</div>
            <div style={{ fontSize: "0.64rem", color: muted }}>{econ.xp.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      {/* Tab bar (4-way) */}
      <div style={{ marginBottom: 24, maxWidth: 640 }}>
        <div style={{ position: "relative", display: "flex", background: dark ? "#111" : "#f2f2f2", border: `1px solid ${border}`, borderRadius: 14, padding: 5, gap: 4 }}>
          <div style={{
            position: "absolute", top: 5, bottom: 5, left: `calc(${idx} * (100% / 4) + 4px)`,
            width: `calc(100% / 4 - 8px)`, background: `linear-gradient(135deg, ${G}, ${G}cc)`,
            borderRadius: 10, transition: "left 0.35s cubic-bezier(.4,0,.2,1)", boxShadow: `0 4px 16px ${G}44`, zIndex: 0,
          }} />
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="pf-tab-btn" style={{
              position: "relative", zIndex: 1, flex: 1, border: "none", background: "transparent",
              padding: "12px 8px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontWeight: 800, fontSize: "0.78rem", color: t.key === tab ? "#0a0a0a" : muted, transition: "color 0.25s, transform 0.15s",
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === "profile" && (
        <div className="cf-fade-in" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 300, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22 }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: fg, marginBottom: 16 }}>Edit Profile</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.7rem", color: muted, fontWeight: 700, marginBottom: 7 }}>Avatar</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {AVATAR_CHOICES.map(a => (
                  <button key={a} onClick={() => updateProfile({ avatar: a })} style={{
                    width: 34, height: 34, borderRadius: 9, fontSize: 16,
                    border: `1px solid ${a === profile.avatar ? G : border}`,
                    background: a === profile.avatar ? `${G}18` : "transparent", cursor: "pointer",
                  }}>{a}</button>
                ))}
              </div>
            </div>

            <ProfileField label="Username" value={profile.username} onChange={v => updateProfile({ username: v })} dark={dark} />
            <ProfileField label="Display name" value={profile.displayName} onChange={v => updateProfile({ displayName: v })} placeholder="Shown instead of your username" dark={dark} />
            <ProfileField label="Bio" value={profile.bio} onChange={v => updateProfile({ bio: v })} multiline dark={dark} placeholder="A short line about you" />
            <ProfileField label="Chess.com username" value={profile.chesscomUsername} onChange={v => updateProfile({ chesscomUsername: v })} placeholder="Optional, for display only" dark={dark} />
            <ProfileField label="Lichess username" value={profile.lichessUsername} onChange={v => updateProfile({ lichessUsername: v })} placeholder="Optional, for display only" dark={dark} />
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 14 }}>Rating Snapshot</div>
              <ProfileStat label="Puzzle Rating" value={pz.puzzleRating || 1200} color="#f59e0b" />
              <ProfileStat label="Daily Questions accuracy" value={dq.totalSolved ? `${Math.round((dq.totalCorrect / dq.totalSolved) * 100)}%` : "—"} color="#60a5fa" />
              <ProfileStat label="Learning streak" value={`${bestStreak} day${bestStreak === 1 ? "" : "s"}`} color="#ef4444" />
            </div>
          </div>
        </div>
      )}

      {/* ── ECONOMY TAB ── */}
      {tab === "economy" && (
        <div className="cf-fade-in">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 160, background: `${G}12`, border: `1px solid ${G}33`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: "0.7rem", color: muted, marginBottom: 6 }}>ProphyCoins</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: G }}>🪙 {econ.coins.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: "0.7rem", color: muted, marginBottom: 6 }}>Lifetime earned</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4ade80" }}>+{(econ.lifetimeEarned||0).toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: "0.7rem", color: muted, marginBottom: 6 }}>Total spent</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: fg }}>{(econ.totalSpent||0).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 12 }}>Recent Transactions</div>
            {(!econ.transactions || econ.transactions.length === 0) ? (
              <div style={{ fontSize: "0.8rem", color: muted }}>No transactions yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {econ.transactions.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: fg }}>{t.reason || t.type}</span>
                    <span style={{ fontWeight: 700, color: t.amount >= 0 ? "#4ade80" : "#ef4444" }}>{t.amount >= 0 ? "+" : ""}{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setActive("ProphyStore")} style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg,${G},${G}cc)`, color: "#0a0a0a", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer",
          }}>View Economy →</button>
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === "progress" && (
        <div className="cf-fade-in">
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: fg }}>Level {level}</span>
              <span style={{ fontSize: "0.78rem", color: muted }}>{econ.xp.toLocaleString()} / {max.toLocaleString()} XP</span>
            </div>
            <div style={{ height: 10, background: dark ? "#1a1a1a" : "#e8e8e8", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${levelPct}%`, background: "linear-gradient(90deg,#60a5fa,#a78bfa)", borderRadius: 5, transition: "width 0.4s" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 22 }}>
            <ProgressStat label="Courses completed" value={coursesCompleted} icon="📖" color={G} />
            <ProgressStat label="Tests completed" value={testsCompleted} icon="📝" color="#60a5fa" />
            <ProgressStat label="Puzzle packs" value={packsCompleted} icon="🧩" color="#4ade80" />
            <ProgressStat label="Learning streak" value={`${bestStreak}d`} icon="🔥" color="#ef4444" />
          </div>

          <div style={{ fontWeight: 800, fontSize: "0.88rem", color: fg, marginBottom: 12 }}>🏆 Achievements</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = !!(econ.achievements || {})[a.id];
              return (
                <div key={a.id} style={{
                  display: "flex", gap: 10, alignItems: "center", background: card,
                  border: `1px solid ${unlocked ? "#a78bfa55" : border}`, borderRadius: 12, padding: "13px 16px",
                  opacity: unlocked ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: "1.3rem" }}>{unlocked ? a.icon : "🔒"}</span>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: fg }}>{a.label}</div>
                    <div style={{ fontSize: "0.68rem", color: muted }}>{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div className="cf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 560 }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 14 }}>Appearance</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ k: "light", l: "☀️ Light" }, { k: "dark", l: "🌙 Dark" }, { k: "system", l: "🖥️ System" }].map(o => (
                <button key={o.k} onClick={() => setThemeMode(o.k)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  border: `1px solid ${themeMode === o.k ? G : border}`,
                  background: themeMode === o.k ? `${G}18` : "transparent",
                  color: themeMode === o.k ? G : muted, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                }}>{o.l}</button>
              ))}
            </div>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 14 }}>Notifications</div>
            <SettingToggle label="Reward alerts" checked={profile.settings.notifications.rewards} onChange={v => updateSettings("notifications", { rewards: v })} dark={dark} />
            <SettingToggle label="Streak reminders" checked={profile.settings.notifications.streakReminders} onChange={v => updateSettings("notifications", { streakReminders: v })} dark={dark} />
            <SettingToggle label="Weekly mission alerts" checked={profile.settings.notifications.weeklyMissions} onChange={v => updateSettings("notifications", { weeklyMissions: v })} dark={dark} />
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 14 }}>Privacy</div>
            <SettingToggle label="Public profile" checked={profile.settings.privacy.publicProfile} onChange={v => updateSettings("privacy", { publicProfile: v })} dark={dark} />
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 14 }}>Language</div>
            <select value={profile.settings.language} onChange={e => updateProfile({ settings: { ...profile.settings, language: e.target.value } })} style={{
              width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9,
              padding: "9px 12px", color: fg, fontSize: "0.82rem", fontFamily: "inherit",
            }}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
            </select>
            <div style={{ fontSize: "0.68rem", color: muted, marginTop: 8 }}>Interface translation is coming soon — this preference is saved for later.</div>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 10 }}>Landing Page</div>
            <div style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.6, marginBottom: 14 }}>See the marketing page again — useful after an admin updates the Homepage or Settings content.</div>
            <button onClick={() => { const p = loadProfile(); saveProfile({ ...p, hasSeenLanding: false }); window.location.reload(); }} style={{
              padding: "9px 18px", borderRadius: 9, border: `1px solid ${border}`, background: "transparent",
              color: fg, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
            }}>View Landing Page</button>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: fg, marginBottom: 10 }}>Account</div>
            <div style={{ fontSize: "0.76rem", color: muted, lineHeight: 1.6, marginBottom: 14 }}>ChessProphy doesn&apos;t have account sign-in yet — this profile is stored locally on this device rather than tied to a real account.</div>
            <button onClick={() => setLogoutNote(true)} style={{
              padding: "9px 18px", borderRadius: 9, border: `1px solid ${border}`, background: "transparent",
              color: "#ef4444", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
            }}>Log Out</button>
            {logoutNote && <div style={{ fontSize: "0.72rem", color: muted, marginTop: 10 }}>There&apos;s no account session to log out of yet — your data stays right here on this device.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export {
  ProfilePage,
};
