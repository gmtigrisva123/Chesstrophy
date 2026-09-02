// ── Skill tree data ───────────────────────────────────────────────────────────
const TREE_DATA = {
  id: "root", label: "Chess Mastery", icon: "♟", x: 0, y: 0,
  desc: "Your complete chess learning journey starts here.",
  xpReward: 0, requires: [],
  children: [
    {
      id: "openings", label: "Openings", icon: "📖", color: "#C9A84C",
      desc: "Master opening principles, repertoire, and theory.",
      xpReward: 500, requires: ["root"],
      children: [
        { id: "op_italian",   label: "Italian Game",    icon: "♙", color: "#C9A84C", xpReward: 100, requires: ["openings"], desc: "Learn the classical Italian setup, plans, and traps.", children: [] },
        { id: "op_sicilian",  label: "Sicilian Defense",icon: "🛡", color: "#C9A84C", xpReward: 150, requires: ["openings"], desc: "Master Black's most fighting response to 1.e4.", children: [] },
        { id: "op_french",    label: "French Defense",  icon: "🏰", color: "#C9A84C", xpReward: 120, requires: ["openings"], desc: "Solid defense with long-term counterplay.", children: [] },
        { id: "op_london",    label: "London System",   icon: "🏙", color: "#C9A84C", xpReward: 100, requires: ["openings"], desc: "Reliable White system requiring minimal theory.", children: [] },
        { id: "op_structures",label: "Pawn Structures", icon: "🧱", color: "#C9A84C", xpReward: 180, requires: ["op_italian","op_london"], desc: "Understand the pawn structures arising from major openings.", children: [] },
        { id: "op_orders",    label: "Move Orders",     icon: "🔀", color: "#C9A84C", xpReward: 120, requires: ["op_structures"], desc: "Learn transpositional tricks and move-order nuances.", children: [] },
      ]
    },
    {
      id: "tactics", label: "Tactics", icon: "⚔️", color: "#ef4444",
      desc: "Build sharp tactical vision through pattern training.",
      xpReward: 500, requires: ["root"],
      children: [
        { id: "tac_forks",     label: "Forks",          icon: "🍴", color: "#ef4444", xpReward: 80,  requires: ["tactics"], desc: "Attack two pieces simultaneously with a single move.", children: [] },
        { id: "tac_pins",      label: "Pins & Skewers", icon: "📌", color: "#ef4444", xpReward: 90,  requires: ["tactics"], desc: "Immobilize pieces and win material through line attacks.", children: [] },
        { id: "tac_discovered",label: "Discovered Attacks",icon:"💥",color: "#ef4444",xpReward: 100, requires: ["tactics"], desc: "Reveal powerful attacks by moving a piece out of the way.", children: [] },
        { id: "tac_mate_patterns",label:"Mate Patterns",icon: "♚", color: "#ef4444", xpReward: 150, requires: ["tac_forks","tac_pins"], desc: "Recognize back rank mates, smothered mates, and more.", children: [] },
        { id: "tac_combos",    label: "Combinations",   icon: "⚡", color: "#ef4444", xpReward: 200, requires: ["tac_mate_patterns","tac_discovered"], desc: "Chain multiple tactical themes into winning sequences.", children: [] },
      ]
    },
    {
      id: "calculation", label: "Calculation", icon: "🧠", color: "#8b5cf6",
      desc: "Develop deep, accurate calculation ability.",
      xpReward: 500, requires: ["root"],
      children: [
        { id: "calc_candidates",label: "Candidate Moves",icon: "🎯", color: "#8b5cf6", xpReward: 120, requires: ["calculation"], desc: "Generate and compare candidate moves systematically.", children: [] },
        { id: "calc_forcing",   label: "Forcing Moves",  icon: "⚡", color: "#8b5cf6", xpReward: 100, requires: ["calculation"], desc: "Identify checks, captures, and threats first.", children: [] },
        { id: "calc_sequences", label: "Tactical Sequences",icon:"🔗",color: "#8b5cf6",xpReward: 150, requires: ["calc_candidates","calc_forcing"], desc: "Calculate multi-move sequences to a clear conclusion.", children: [] },
        { id: "calc_long",      label: "Long Calculation",icon: "🔭", color: "#8b5cf6", xpReward: 200, requires: ["calc_sequences"], desc: "Extend your calculation horizon to 6+ moves deep.", children: [] },
      ]
    },
    {
      id: "endgames", label: "Endgames", icon: "♔", color: "#2563EB",
      desc: "Convert advantages and defend difficult positions.",
      xpReward: 500, requires: ["root"],
      children: [
        { id: "end_kp",       label: "King & Pawn",      icon: "♟", color: "#2563EB", xpReward: 100, requires: ["endgames"], desc: "Master opposition, key squares, and the square rule.", children: [] },
        { id: "end_philidor", label: "Philidor Position", icon: "🛡", color: "#2563EB", xpReward: 120, requires: ["end_kp"],  desc: "The essential defensive technique in rook endgames.", children: [] },
        { id: "end_lucena",   label: "Lucena Position",  icon: "🏆", color: "#2563EB", xpReward: 130, requires: ["end_kp"],  desc: "Bridge-building technique to win rook endgames.", children: [] },
        { id: "end_rook",     label: "Rook Endgames",    icon: "♜", color: "#2563EB", xpReward: 180, requires: ["end_philidor","end_lucena"], desc: "Active rook, cutting off the king, passed pawns.", children: [] },
        { id: "end_queen",    label: "Queen Endgames",   icon: "♛", color: "#2563EB", xpReward: 200, requires: ["end_rook"], desc: "Perpetual checks, stalemate tricks, and technique.", children: [] },
        { id: "end_minor",    label: "Minor Piece Endings",icon:"🐴",color: "#2563EB",xpReward: 180, requires: ["end_rook"], desc: "Good vs bad bishops, knight vs bishop endgames.", children: [] },
      ]
    },
    {
      id: "strategy", label: "Middlegame Strategy", icon: "🏰", color: "#60a5fa",
      desc: "Understand plans, structures, and positional play.",
      xpReward: 500, requires: ["root"],
      children: [
        { id: "str_outposts",  label: "Outposts",         icon: "🎖", color: "#60a5fa", xpReward: 100, requires: ["strategy"], desc: "Create and exploit powerful piece outposts.", children: [] },
        { id: "str_weaknesses",label: "Weak Squares",     icon: "🔍", color: "#60a5fa", xpReward: 110, requires: ["strategy"], desc: "Identify and target weak squares in the opponent's camp.", children: [] },
        { id: "str_pawns",     label: "Pawn Majorities",  icon: "♙", color: "#60a5fa", xpReward: 120, requires: ["str_outposts"], desc: "Use pawn majorities to create passed pawns.", children: [] },
        { id: "str_minority",  label: "Minority Attack",  icon: "⚔", color: "#60a5fa", xpReward: 150, requires: ["str_pawns"], desc: "Undermine the opponent's pawn majority.", children: [] },
        { id: "str_planning",  label: "Strategic Planning",icon:"🗺", color: "#60a5fa", xpReward: 200, requires: ["str_minority","str_weaknesses"], desc: "Formulate and execute multi-move strategic plans.", children: [] },
      ]
    },
    {
      id: "visualization", label: "Visualization", icon: "👁", color: "#fb7185",
      desc: "See further ahead and calculate without moving pieces.",
      xpReward: 400, requires: ["calculation"],
      children: [
        { id: "vis_board",   label: "Board Awareness",  icon: "🗂", color: "#fb7185", xpReward: 100, requires: ["visualization"], desc: "Hold the full board position in your mind.", children: [] },
        { id: "vis_ahead",   label: "Seeing Ahead",     icon: "🔮", color: "#fb7185", xpReward: 150, requires: ["vis_board"],        desc: "Visualize positions 3-5 moves in the future.", children: [] },
        { id: "vis_blindfold",label:"Blindfold Training",icon:"🙈",  color: "#fb7185", xpReward: 200, requires: ["vis_ahead"],        desc: "Practice calculating without looking at the board.", children: [] },
      ]
    },
    {
      id: "psychology", label: "Chess Psychology", icon: "💭", color: "#f59e0b",
      desc: "Master the mental side of chess competition.",
      xpReward: 300, requires: ["root"],
      children: [
        { id: "psy_pressure",  label: "Handling Pressure",icon: "💪", color: "#f59e0b", xpReward: 100, requires: ["psychology"], desc: "Stay calm and accurate in critical moments.", children: [] },
        { id: "psy_mistakes",  label: "Recovering from Mistakes",icon:"🔄",color:"#f59e0b",xpReward:120,requires:["psychology"],    desc: "Bounce back psychologically after blunders.", children: [] },
        { id: "psy_time",      label: "Time Management",  icon: "⏱", color: "#f59e0b", xpReward: 130, requires: ["psy_pressure"],    desc: "Allocate thinking time efficiently throughout the game.", children: [] },
      ]
    },
  ]
};

export {
  TREE_DATA,
};
