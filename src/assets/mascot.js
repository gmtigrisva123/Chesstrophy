import mascotImage from "./images/mascot.jpg";

// ── MASCOT — official ChessProphy mascot (user-provided image) ────────────────
// Used across onboarding, the AI coach bubbles and the course/opening trainers.
// Do not regenerate or replace; reuse this constant wherever the mascot appears.
//
// Previously a ~133 kB base64 data URI compiled straight into the bundle. It is
// now a real file that Vite fingerprints and emits, so the browser caches it
// separately from the application code.
const MASCOT_IMG = mascotImage;

export {
  MASCOT_IMG,
};
