// ── Lightweight markdown renderer ────────────────────────────────────────────
// News articles and ChessWiki content are authored with a small markdown
// subset (## headers, **bold**, "- " bullet lists, blank-line-separated
// paragraphs — see the seed content in defaultAdminData for examples).
// Escapes HTML first since this feeds dangerouslySetInnerHTML, then applies
// just that subset. A "## Header" line is often immediately followed by its
// paragraph OR its bullet list on the very next line, with no blank line in
// between (exactly how the seed content is written) — renderBody handles
// whichever of the two the remaining lines turn out to be.
function mdToHtml(src) {
  if (!src) return "";
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const renderBody = (lines) => {
    const nonEmpty = lines.filter(l => l.trim() !== "");
    if (nonEmpty.length === 0) return "";
    if (nonEmpty.every(l => /^-\s+/.test(l.trim()))) {
      const items = nonEmpty.map(l => `<li>${l.trim().replace(/^-\s+/, "")}</li>`).join("");
      return `<ul style="margin:0 0 1em;padding-left:1.3em;">${items}</ul>`;
    }
    return `<p style="margin:0 0 1em;">${nonEmpty.join(" ")}</p>`;
  };
  const blocks = esc(src).split(/\n\n+/);
  const html = blocks.map(block => {
    const lines = block.split("\n");
    if (/^##\s+/.test(lines[0])) {
      const heading = `<h3 style="margin:1.2em 0 0.5em;">${lines[0].replace(/^##\s+/, "")}</h3>`;
      return heading + renderBody(lines.slice(1));
    }
    return renderBody(lines);
  }).join("");
  return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export {
  mdToHtml,
};
