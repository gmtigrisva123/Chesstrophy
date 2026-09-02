import backgroundImage from "./images/background.jpg";

// ── AMBIENT BACKGROUND — user-provided photograph shown behind the whole app,
// blurred and dimmed by ChessProphyApp so foreground text stays legible.
//
// Emitted as a real, cacheable file rather than an inline data URI; see the
// note in ./mascot.js.
const BG_IMAGE = backgroundImage;

export {
  BG_IMAGE,
};
