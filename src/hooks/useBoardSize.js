import { useState, useRef, useEffect } from "react";

// ── Responsive chess board sizing — keeps every board on-screen at any width ──
function computeBoardSquareSize(base, containerWidth) {
  const w = containerWidth || (typeof window !== "undefined" ? window.innerWidth : base * 8);
  const maxSquare = Math.floor(w / 8);
  // BUG FIX (boards too big on desktop): on wide screens maxSquare (window/8,
  // often 150-250px) never actually constrains anything, so every board
  // rendered at its raw `base` size — up to 72px/square (576px board). Add a
  // firm desktop ceiling so no board can render oversized regardless of base.
  const DESKTOP_MAX_SQUARE = 60;
  return Math.max(30, Math.min(base, maxSquare, DESKTOP_MAX_SQUARE));
}
// Measures the ACTUAL available width of the board's own wrapper (not just
// window.innerWidth), so the board never overflows however deeply it's nested
// (sidebars, padded cards, preview boxes, etc.) — returns [size, refToAttach].
function useBoardSize(base) {
  const ref = useRef(null);
  const [size, setSize] = useState(base);
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.parentElement) return;
    // BUG FIX (mobile board overflow — GameViewer, PuzzleSolver, etc. cutting off
    // the h-file on phones): this measured `el.parentElement.clientWidth`, but
    // several call sites put the ref on a div that ITSELF has left/right padding
    // (e.g. `paddingLeft:24`, to visually indent the board). The board was then
    // sized to fill that full parent width while ALSO carrying its own padding —
    // so total rendered width = padding + parentWidth, overflowing the parent
    // (and on a narrow phone screen, overflowing the viewport) by exactly the
    // padding amount. Subtracting the ref'd element's own padding here fixes
    // every board using this hook at once, including ones added later.
    const measure = () => {
      const cs = window.getComputedStyle(el);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const available = el.parentElement.clientWidth - padL - padR;
      setSize(computeBoardSquareSize(base, available));
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el.parentElement);
    }
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); ro?.disconnect(); };
  }, [base]);
  return [size, ref];
}

export {
  computeBoardSquareSize,
  useBoardSize,
};
