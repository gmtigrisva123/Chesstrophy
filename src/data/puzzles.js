// ══════════════════════════════════════════════════════════════════════════════
// ── PUZZLE SYSTEM ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── Puzzle Database ──────────────────────────────────────────────────────────
const PUZZLE_DB = [
  // Puzzle of the Day (id: "potd")
  {
    id:"potd", title:"Puzzle of the Day", rating:1850,
    fen:"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5",
    solution:["d1e2","e8g8"],
    theme:"Development + Castle Safety",
    desc:"White finds the key developing move that prepares queenside castling while centralising the queen.",
    tags:["middlegame","strategy"],
  },
  // Free daily puzzles
  {
    id:"f1", title:"Fork Attack", rating:1050,
    fen:"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4",
    solution:["f3g5"],
    theme:"Knight Fork",
    desc:"White's knight can launch a powerful fork — find the key move.",
    tags:["tactics","fork"],
  },
  {
    id:"f2", title:"Pin to Win", rating:1200,
    fen:"r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 2 8",
    solution:["d1b3"],
    theme:"Absolute Pin",
    desc:"Find the move that creates an absolute pin, winning material.",
    tags:["tactics","pin"],
  },
  {
    id:"f3", title:"Discovered Check", rating:1400,
    fen:"2r3k1/5ppp/p7/1p6/3B4/1P6/P4PPP/4R1K1 w - - 0 28",
    solution:["d4b6"],
    theme:"Discovered Attack",
    desc:"Unleash a discovered attack that wins decisive material.",
    tags:["tactics","discovered"],
  },
  // Practice puzzles (unlimited)
  {
    id:"p1", title:"Back Rank Mate", rating:900,
    fen:"6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution:["a1a8"],
    theme:"Back Rank Checkmate",
    desc:"The classic back rank finish — White to move and checkmate in 1.",
    tags:["checkmate","beginner"],
  },
  {
    id:"p2", title:"Smothered Mate", rating:1350,
    // Philidor's Legacy: the queen is given up on g8 so the rook blocks the
    // king's last flight square, then the knight mates.
    fen:"r4r1k/pp4pp/7N/8/8/1Q6/PP4PP/6K1 w - - 0 1",
    solution:["b3g8","f8g8","h6f7"],
    theme:"Smothered Mate",
    desc:"A classic smothered mate pattern. White to move and force checkmate in two.",
    tags:["checkmate","knight"],
  },
  {
    id:"p3", title:"Queen Sacrifice", rating:1750,
    fen:"r4rk1/pp3ppp/2p5/4Pb2/2B5/q4N2/PP3PPP/2RQ1RK1 w - - 0 18",
    solution:["d1d8","f8d8","c1d1"],
    theme:"Queen Sacrifice + Discovery",
    desc:"A spectacular queen sacrifice leads to a decisive material gain.",
    tags:["tactics","sacrifice"],
  },
  {
    id:"p4", title:"Zugzwang", rating:1600,
    // The white king has exactly one legal square after ...e2; the black king
    // then takes the queening square's neighbour and the pawn walks in.
    fen:"8/8/8/8/8/3kp3/8/4K3 b - - 0 1",
    solution:["e3e2","e1f2","d3d2","f2g3","e2e1q"],
    theme:"Pawn Promotion",
    desc:"Black to move. Use zugzwang to push the white king away from the queening square, then promote.",
    tags:["endgame","promotion"],
  },
  {
    id:"p5", title:"Rook Endgame", rating:1300,
    fen:"8/R7/8/8/8/4k3/r7/4K3 w - - 0 1",
    solution:["a7a3","e3e4","a3a4"],
    theme:"Rook Endgame Technique",
    desc:"Cut off the enemy king — a key technique in rook endgames.",
    tags:["endgame","rook"],
  },
  {
    id:"p6", title:"Italian Game Trap", rating:1100,
    fen:"r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution:["f3e5","c6e5","d1h5"],
    theme:"Opening Trap",
    desc:"Find the sharp tactical sequence that wins a pawn with tempo.",
    tags:["opening","tactics"],
  },
];

export {
  PUZZLE_DB,
};
