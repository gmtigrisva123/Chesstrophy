import { loadAdminData } from "../../services/adminData.js";

// ── MAINTENANCE MODE SCREEN ───────────────────────────────────────────────────
function MaintenanceScreen() {
  const ad = loadAdminData();
  const s = ad.settings || {};
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 40, marginBottom: 18 }}>🛠️</div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 700, marginBottom: 12 }}>{s.siteName || "ChessProphy"} is briefly offline</div>
        <p style={{ fontSize: "0.88rem", color: "#999", lineHeight: 1.7 }}>{s.maintenanceMsg || "ChessProphy is undergoing scheduled maintenance. Back soon!"}</p>
      </div>
    </div>
  );
}

export {
  MaintenanceScreen,
};
