import { Component } from "react";

/**
 * Catches render-time errors anywhere below it and shows a recovery screen
 * instead of React's default behaviour, which is to unmount the whole tree and
 * leave the user staring at a blank page.
 *
 * This is a class component because error boundaries have no hook equivalent —
 * `componentDidCatch` / `getDerivedStateFromError` are the only API React
 * exposes for this.
 *
 * @example
 * <ErrorBoundary onReset={() => setRoute("Home")}>
 *   <Dashboard />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // The console is the only sink available today. When a monitoring backend
    // is wired up (Sentry et al.), this is the single place to report from.
    console.error("[ErrorBoundary] render failed", error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset() {
    this.setState({ error: null });
    this.props.onReset?.();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { dark = true, title = "Something went wrong" } = this.props;
    const fg = dark ? "#f0f0f0" : "#111";
    const muted = dark ? "#8891a8" : "#666";
    const card = dark ? "rgba(17,24,39,0.6)" : "#fff";
    const border = dark ? "rgba(148,163,255,0.12)" : "#e8e8e8";

    return (
      <div role="alert" style={{
        maxWidth: 560, margin: "48px auto", padding: "28px 26px",
        background: card, border: `1px solid ${border}`, borderRadius: 16, textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">⚠️</div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: "1.15rem", fontWeight: 700, color: fg, marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: "0.85rem", color: muted, lineHeight: 1.6, marginBottom: 20 }}>
          This screen hit an unexpected error. Your saved progress is untouched — you can go back and try again.
        </p>
        {import.meta.env?.DEV && (
          <pre style={{
            textAlign: "left", fontSize: "0.72rem", color: "#ef4444", background: dark ? "#12070a" : "#fff5f5",
            border: "1px solid #ef444433", borderRadius: 10, padding: "10px 12px", marginBottom: 18,
            overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>{String(error?.stack || error)}</pre>
        )}
        <button onClick={this.handleReset} style={{
          background: "linear-gradient(135deg,#2563EB,#1d4ed8)", border: "none", borderRadius: 10,
          padding: "11px 22px", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
        }}>Try again</button>
      </div>
    );
  }
}

export { ErrorBoundary };
