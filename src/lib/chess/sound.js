// Short, self-contained Web Audio tones — no external sound files needed.
function playBoardSound(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const presets = {
      move:    [{ f: 520, d: 0.055, type: "sine",     v: 0.05 }],
      capture: [{ f: 260, d: 0.09,  type: "triangle", v: 0.07 }],
      check:   [{ f: 720, d: 0.06,  type: "square",   v: 0.05 }, { f: 480, d: 0.08, type: "square", v: 0.05, delay: 0.06 }],
      illegal: [{ f: 160, d: 0.08,  type: "sawtooth", v: 0.04 }],
    };
    (presets[kind] || presets.move).forEach(({ f, d, type, v, delay = 0 }) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type; osc.frequency.value = f;
      gain.gain.value = v;
      osc.connect(gain); gain.connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      osc.start(t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      osc.stop(t0 + d + 0.03);
    });
    setTimeout(() => ctx.close?.(), 400);
  } catch {
    // Web Audio is unavailable or blocked by the browser's autoplay policy.
    // Sound is a nicety here — never let it break a move.
  }
}

export {
  playBoardSound,
};
