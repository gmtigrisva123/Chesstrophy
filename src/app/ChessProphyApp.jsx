import { Suspense, lazy, useState, useEffect } from "react";
import { PageFallback } from "./PageFallback.jsx";
import { BG_IMAGE } from "../assets/backgroundImage.js";
import { ErrorBoundary } from "../components/feedback/ErrorBoundary.jsx";
import { MobileDrawer } from "../components/layout/MobileDrawer.jsx";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { Topbar } from "../components/layout/Topbar.jsx";
import { Dashboard } from "../features/dashboard/Dashboard.jsx";
import { LandingPage } from "../features/landing/LandingPage.jsx";
import { MaintenanceScreen } from "../features/maintenance/MaintenanceScreen.jsx";
import { OnboardingFlow } from "../features/onboarding/OnboardingFlow.jsx";
import { useThemeMode } from "../hooks/useThemeMode.js";
import { subscribeAdminDataChanged } from "../lib/storage/adminDataEvents.js";
import { loadAdminData } from "../services/adminData.js";
import { loadProfile, saveProfile } from "../services/profile.js";

// ── ROUTE-LEVEL CODE SPLITTING ────────────────────────────────────────────────
// Dashboard, the landing page and onboarding stay in the main bundle: one of
// them is always the first thing a visitor sees. Every other route is fetched
// on first navigation, which keeps the initial download to the screens that are
// actually rendered rather than all thirteen of them.
const ChessDNAPage           = lazy(() => import("../features/chessDna/ChessDNAPage.jsx").then(m => ({ default: m.ChessDNAPage })));
const ClassicGamesPage       = lazy(() => import("../features/games/ClassicGamesPage.jsx").then(m => ({ default: m.ClassicGamesPage })));
const EventsPage             = lazy(() => import("../features/events/EventsPage.jsx").then(m => ({ default: m.EventsPage })));
const LearningTreePage       = lazy(() => import("../features/learningTree/LearningTreePage.jsx").then(m => ({ default: m.LearningTreePage })));
const NewsPage               = lazy(() => import("../features/news/NewsPage.jsx").then(m => ({ default: m.NewsPage })));
const OpeningsPage           = lazy(() => import("../features/openings/OpeningsPage.jsx").then(m => ({ default: m.OpeningsPage })));
const ProfilePage            = lazy(() => import("../features/profile/ProfilePage.jsx").then(m => ({ default: m.ProfilePage })));
const ProphyStorePage        = lazy(() => import("../features/store/ProphyStorePage.jsx").then(m => ({ default: m.ProphyStorePage })));
const ProphyStudioComingSoon = lazy(() => import("../features/studio/ProphyStudioPage.jsx").then(m => ({ default: m.ProphyStudioComingSoon })));
const PuzzlesPage            = lazy(() => import("../features/puzzles/PuzzlesPage.jsx").then(m => ({ default: m.PuzzlesPage })));
const StudiesPage            = lazy(() => import("../features/studies/StudiesPage.jsx").then(m => ({ default: m.StudiesPage })));
const WikiPage               = lazy(() => import("../features/wiki/WikiPage.jsx").then(m => ({ default: m.WikiPage })));

function ChessProphyApp() {
  const { themeMode, dark, setThemeMode } = useThemeMode();
  const [active, setActive]           = useState("Home");
  const [mobileOpen, setMobileOpen]   = useState(false);

  // Landing page — shown once before a visitor enters the app proper, driven
  // by the same Homepage CMS data the Admin Portal already writes.
  const [showLanding, setShowLanding] = useState(() => !loadProfile().hasSeenLanding);
  const enterApp = () => { const p = loadProfile(); saveProfile({ ...p, hasSeenLanding: true }); setShowLanding(false); };

  // Onboarding — shown once right after the LandingPage, unless the visitor
  // picks Guest (skips straight to the Dashboard) or has already completed it.
  // See OnboardingFlow/OnboardingComplete above LandingPage for the steps.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const p = loadProfile();
    return !p.onboardingCompleted && !p.isGuest;
  });
  const completeOnboarding = (data) => {
    const p = loadProfile();
    saveProfile({ ...p, ...data });
    setShowOnboarding(false);
  };
  const skipOnboardingAsGuest = () => {
    const p = loadProfile();
    saveProfile({ ...p, isGuest: true });
    setShowOnboarding(false);
  };

  // Re-render the whole app the instant an admin edit is saved, so every
  // already-open page (not just the Admin Portal) reflects it immediately
  // instead of only updating after a navigation away and back.
  const [, forceRerenderOnAdminChange] = useState(0);
  useEffect(() => subscribeAdminDataChanged(() => forceRerenderOnAdminChange(v => v + 1)), []);

  // Site identity + maintenance mode — this data still lives in the same
  // content store the (now-removed) Admin Portal used to write to; there's
  // just no admin UI left to edit it, so it stays whatever it's currently set to.
  const siteSettings = loadAdminData().settings || {};
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = siteSettings.seoTitle || siteSettings.siteName || "ChessProphy";
    }
  }, [siteSettings.seoTitle, siteSettings.siteName]);

  if (siteSettings.maintenanceMode) {
    return <MaintenanceScreen />;
  }
  if (showLanding) {
    return <LandingPage onEnter={enterApp} />;
  }
  if (showOnboarding) {
    return <OnboardingFlow onComplete={completeOnboarding} onGuest={skipOnboardingAsGuest} />;
  }

  const sidebarW = 280; // desktop sidebar is now a fixed-width full sidebar (icons + labels always shown)

  const renderPage = () => {
    switch (active) {
      case "Home":          return <Dashboard        dark={dark} setActive={setActive} />;
      case "Puzzles":       return <PuzzlesPage       dark={dark} />;
      case "LearningTree":  return <LearningTreePage  dark={dark} />;
      case "ChessDNA":      return <ChessDNAPage      dark={dark} />;
      case "News":          return <NewsPage          dark={dark} />;
      case "Events":        return <EventsPage        dark={dark} />;
      case "Openings":      return <OpeningsPage      dark={dark} />;
      case "Studies":       return <StudiesPage       dark={dark} setActive={setActive} />;
      case "Classics":      return <ClassicGamesPage  dark={dark} />;
      case "ChessWiki":     return <WikiPage           dark={dark} setActive={setActive} />;
      case "ProphyStore":   return <ProphyStorePage   dark={dark} setActive={setActive} />;
      case "ProphyStudio":  return <ProphyStudioComingSoon dark={dark} setActive={setActive} />; // gated — see ProphyStudioComingSoon above ProphyStudioPage
      case "Profile":       return <ProfilePage       dark={dark} setActive={setActive} themeMode={themeMode} setThemeMode={setThemeMode} />;
      default:              return <Dashboard         dark={dark} setActive={setActive} />;
    }
  };

  return (
    <>
      <style>{`
        .mobile-topbar { display: none !important; }
        .desktop-sidebar { display: flex !important; }
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .desktop-sidebar { display: none !important; }
        }
      `}</style>

      {/* ── Background image (user-provided), softly blurred for a blended ambient feel ── */}
      <div style={{
        position: "fixed", inset: "-30px", zIndex: 0, pointerEvents: "none",
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        filter: "blur(22px)",
        transform: "scale(1.08)",
      }}/>
      {/* Readability overlay — darkens/lightens the photo so text and cards stay legible */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: dark
          ? "linear-gradient(180deg,rgba(6,10,20,0.62) 0%,rgba(6,10,20,0.52) 40%,rgba(6,10,20,0.72) 100%)"
          : "linear-gradient(180deg,rgba(240,244,255,0.78) 0%,rgba(240,244,255,0.74) 100%)",
      }}/>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {/* Desktop sidebar */}
        <div className="desktop-sidebar">
          <Sidebar dark={dark} active={active} setActive={setActive} />
        </div>

        {/* Mobile topbar */}
        <Topbar dark={dark} active={active} sidebarOpen={mobileOpen} setSidebarOpen={setMobileOpen} />

        {/* Mobile drawer */}
        {mobileOpen && <MobileDrawer dark={dark} active={active} setActive={setActive} setSidebarOpen={setMobileOpen} />}

        {/* Main content */}
        <main style={{
          marginLeft: 0,
          paddingLeft: `calc(${sidebarW}px + 0px)`,
          transition: "padding-left 0.22s cubic-bezier(.4,0,.2,1)",
          minHeight: "100vh",
        }} className="desktop-main">
          <style>{`
            @media (max-width: 768px) {
              .desktop-main { padding-left: 0 !important; padding-top: 56px !important; }
            }
            .cf-content-pad { max-width: 1100px; margin: 0 auto; padding: 40px 32px; }
            @media (max-width: 1024px) { .cf-content-pad { padding: 32px 24px; } }
            @media (max-width: 768px)  { .cf-content-pad { padding: 24px 18px; } }
            @media (max-width: 480px)  { .cf-content-pad { padding: 18px 14px; } }
            @media (max-width: 340px)  { .cf-content-pad { padding: 14px 10px; } }
            /* Admin manager list+form-panel layouts: stack on tablet/mobile */
            @media (max-width: 900px) {
              .cf-mgr-grid { grid-template-columns: 1fr !important; }
            }
            /* Any data-table-style grid: allow horizontal scroll instead of squeezing/overflowing the page */
            .cf-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .cf-table-scroll > * { min-width: 640px; }
          `}</style>
          <div className="cf-content-pad">
            {/* Keyed on the route so recovering from an error on one page does
                not leave the boundary latched when the user navigates away. */}
            <ErrorBoundary key={active} dark={dark} onReset={() => setActive("Home")}>
              <Suspense fallback={<PageFallback dark={dark} />}>
                {renderPage()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </>
  );
}

export {
  ChessProphyApp,
};
