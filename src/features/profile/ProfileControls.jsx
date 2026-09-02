function ProfileField({ label, value, onChange, placeholder = "", multiline = false, dark }) {
  const border = dark ? "#1f1f1f" : "#e8e8e8";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: "0.7rem", color: dark ? "#888" : "#666", fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {multiline ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{
          width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9,
          padding: "9px 12px", color: dark ? "#eee" : "#111", fontSize: "0.82rem", fontFamily: "inherit", resize: "vertical",
        }} />
      ) : (
        <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width: "100%", background: dark ? "#151515" : "#f5f5f5", border: `1px solid ${border}`, borderRadius: 9,
          padding: "9px 12px", color: dark ? "#eee" : "#111", fontSize: "0.82rem", fontFamily: "inherit",
        }} />
      )}
    </div>
  );
}
function SettingToggle({ label, checked, onChange, dark }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", cursor: "pointer" }}>
      <span style={{ fontSize: "0.82rem", color: dark ? "#ddd" : "#333" }}>{label}</span>
      <div style={{
        width: 38, height: 22, borderRadius: 11, background: checked ? "#C9A84C" : (dark ? "#2a2a2a" : "#ddd"),
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
          left: checked ? 19 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

export {
  ProfileField,
  SettingToggle,
};
