// ── ADMIN DATA CHANGE NOTIFIER ─────────────────────────────────────────────────
// Admin Portal edits write straight to storage via saveAdminData, but public
// pages that already rendered (Dashboard, Studies, ChessFlix, etc.) have no
// prop/state link to that write, so they'd otherwise stay stale until the user
// navigates away and back. This tiny pub/sub lets the top-level app force a
// fresh render the moment admin data actually changes, so every page picks up
// its next loadAdminData() call with current content — no polling needed.
let __adminDataListeners = [];
function __notifyAdminDataChanged() {
  // One listener throwing must not stop the others from being notified.
  __adminDataListeners.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error("[adminData] subscriber threw while handling a change", error);
    }
  });
}
function subscribeAdminDataChanged(fn) {
  __adminDataListeners.push(fn);
  return () => { __adminDataListeners = __adminDataListeners.filter(f => f !== fn); };
}

export {
  __adminDataListeners,
  __notifyAdminDataChanged,
  subscribeAdminDataChanged,
};
