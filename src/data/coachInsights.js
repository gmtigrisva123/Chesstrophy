// ── Static data ───────────────────────────────────────────────────────────────
const PLACEMENT_QUESTIONS = [
  {
    type: "tactical",
    label: "Tactical Awareness",
    question: "White to move. A rook is on e1, knight on d5, enemy king on g8, enemy queen on d8. What is the winning idea?",
    options: ["Rook to e8 — back rank checkmate threat", "Knight fork on f6 winning the queen", "Push the f-pawn to create space", "Trade the rook for the queen"],
    correct: 1,
    explanation: "Nf6+ forks king and queen — a classic knight fork pattern on g8+d8."
  },
  {
    type: "positional",
    label: "Positional Understanding",
    question: "You have a bishop pair vs bishop and knight in an open position. Which plan is most principled?",
    options: ["Trade one bishop to simplify", "Keep the position open — bishops thrive on open diagonals", "Castle queenside immediately", "Push pawns on the side where you have more space"],
    correct: 1,
    explanation: "Bishop pairs are strongest in open positions. Keeping files and diagonals open maximises their value."
  },
  {
    type: "endgame",
    label: "Endgame Technique",
    question: "King and pawn endgame: your king is on e4, pawn on e5, enemy king on e7. Whose turn is it and can White win?",
    options: ["White wins easily regardless of turn", "White wins only if it's White's turn (opposition)", "It's always a draw", "Black wins with correct play"],
    correct: 1,
    explanation: "White needs the opposition (e4 vs e6 or d5 vs d7). If it's White's turn with this position, White has the opposition and wins."
  },
  {
    type: "strategy",
    label: "Strategic Planning",
    question: "You have a isolated queen's pawn (IQP) on d4. What is the main strategic idea?",
    options: ["Trade it off as quickly as possible", "Use it as a base for piece activity and kingside attacks", "Advance it immediately to d5", "Block it with your own pieces"],
    correct: 1,
    explanation: "The IQP gives space and piece activity. Use it as a launching pad for central control and dynamic play."
  },
  {
    type: "pattern",
    label: "Pattern Recognition",
    question: "The 'Lucena position' is a key technique in which type of endgame?",
    options: ["King and pawn endgames", "Rook endgames", "Queen endgames", "Bishop endgames"],
    correct: 1,
    explanation: "The Lucena position is the most fundamental winning technique in rook endgames — 'building a bridge'."
  },
];

const PLAYER_STYLES = {
  tactical:   { label: "Tactical Fighter",  icon: "⚔️",  desc: "You see the board dynamically. Combinations and sharp positions energise you.",       color: "#ef4444" },
  positional: { label: "Positional Player", icon: "♟️",  desc: "You think long-term. Pawn structures, outposts, and strategic plans are your tools.", color: "#60a5fa" },
  universal:  { label: "Universal Player",  icon: "⭐",  desc: "You adapt to whatever the position demands — a well-rounded, flexible thinker.",    color: "#f59e0b" },
  endgame:    { label: "Endgame Specialist",icon: "♔",  desc: "You convert advantages with precision. Technique and patience define your play.",    color: "#2563EB" },
};

const COGNITIVE_METRICS = [
  { key: "tacticalVision",       label: "Tactical Vision",        icon: "⚔️",  desc: "Ability to see forcing sequences and combinations" },
  { key: "patternRecognition",   label: "Pattern Recognition",    icon: "🔍",  desc: "Speed at identifying known tactical and strategic motifs" },
  { key: "calculationDepth",     label: "Calculation Depth",      icon: "🔢",  desc: "How far ahead you calculate accurately" },
  { key: "positionalJudgement",  label: "Positional Judgement",   icon: "♟️",  desc: "Understanding of pawn structures, piece coordination" },
  { key: "endgameTechnique",     label: "Endgame Technique",      icon: "♔",  desc: "Precision in converting endgames and defending" },
  { key: "openingKnowledge",     label: "Opening Knowledge",      icon: "📖",  desc: "Familiarity with opening theory and principles" },
  { key: "timeManagement",       label: "Time Management",        icon: "⏱️",  desc: "Efficient use of clock in different phases" },
  { key: "decisionConfidence",   label: "Decision Confidence",    icon: "🎯",  desc: "Ability to commit to decisions under pressure" },
  { key: "consistencyScore",     label: "Consistency",            icon: "📊",  desc: "Maintaining performance level across a session" },
  { key: "learningVelocity",     label: "Learning Velocity",      icon: "🚀",  desc: "Speed of improvement from feedback and practice" },
];

const ADAPTIVE_LESSONS = [
  {
    id: "L1", category: "Tactics",   title: "Knight Fork Patterns",        difficulty: "Beginner",     xp: 50,
    duration: "15 min", desc: "Master the most common knight fork motifs seen in games under 1400.",
    steps: ["Introduction to knight forks","L-shaped attack geometry","Identifying vulnerable squares","Practice positions","Real game examples"],
    completed: false,
  },
  {
    id: "L2", category: "Tactics",   title: "Pin & Skewer Mastery",         difficulty: "Intermediate", xp: 75,
    duration: "20 min", desc: "Recognise absolute and relative pins. Use skewers to win material.",
    steps: ["Absolute vs relative pins","Exploiting pinned pieces","Skewer technique","Breaking pins","Combined exercises"],
    completed: false,
  },
  {
    id: "L3", category: "Strategy",  title: "Isolated Pawn Positions",      difficulty: "Intermediate", xp: 80,
    duration: "25 min", desc: "Learn both how to attack and defend IQP positions with confidence.",
    steps: ["IQP fundamentals","Piece activity around the IQP","Blockading the IQP","Converting the advantage","Famous IQP games"],
    completed: false,
  },
  {
    id: "L4", category: "Endgames",  title: "Rook Endgame Essentials",      difficulty: "Intermediate", xp: 90,
    duration: "30 min", desc: "Lucena, Philidor, and the Vancura position — the three most important rook endgames.",
    steps: ["Why rook endgames matter","The Philidor position (defence)","The Lucena position (winning)","The Vancura defence","Mixed exercises"],
    completed: false,
  },
  {
    id: "L5", category: "Openings",  title: "London System Blueprint",      difficulty: "Beginner",     xp: 55,
    duration: "20 min", desc: "Build a solid, reliable White repertoire with the London System.",
    steps: ["Core setup and move order","Plans vs common Black setups","The e4 break","Piece coordination","Model games"],
    completed: false,
  },
  {
    id: "L6", category: "Strategy",  title: "Pawn Structure Fundamentals",  difficulty: "Advanced",     xp: 100,
    duration: "35 min", desc: "Understand how pawn structure dictates plans for both sides.",
    steps: ["Passed pawns","Doubled pawns","Backward pawns","Pawn majorities","Pawn breaks"],
    completed: false,
  },
];

const COACH_PERSONAS = [
  { id: "aria",  name: "GM Aria Volkov",    style: "Tactical",    icon: "⚔️",  accent: "#ef4444", desc: "Direct, sharp, focuses on combinations and calculation drills." },
  { id: "dante", name: "IM Dante Ferreira", style: "Opening",     icon: "📖", accent: "#f59e0b", desc: "Opening specialist. Builds your repertoire from the ground up." },
  { id: "yuki",  name: "FM Yuki Tanaka",    style: "Positional",  icon: "♟️",  accent: "#60a5fa", desc: "Patient and methodical. Teaches structure, plans, and endgames." },
];

const AI_INSIGHTS = [
  { id: "i1", icon: "🔥", title: "Tactical blindspot detected",     body: "You missed knight fork patterns in 3 of your last 5 puzzles. Recommend: 15 min knight fork drill today.",           action: "Start Drill", priority: "high"   },
  { id: "i2", icon: "📈", title: "Learning velocity: +12% this week",body: "Your pattern recognition improved significantly. Morning sessions are 34% more effective for you.",                 action: "View Data",  priority: "medium" },
  { id: "i3", icon: "⏱️", title: "Time management opportunity",      body: "You spend 40% more time on moves 10–20 than average. Consider practising blitz games to sharpen decision speed.", action: "Play Blitz", priority: "medium" },
  { id: "i4", icon: "🎯", title: "Endgame gap identified",           body: "Rook endgame accuracy: 58%. The Lucena and Philidor positions are your priority area.",                             action: "Start Lesson",priority: "high"  },
];

const WEEKLY_GOALS = [
  { id: "g1", label: "Complete 2 adaptive lessons",  progress: 1, max: 2, icon: "📚" },
  { id: "g2", label: "Solve 20 tactical puzzles",    progress: 13, max: 20, icon: "🧩" },
  { id: "g3", label: "Play 5 practice games",        progress: 2, max: 5,  icon: "♟️" },
  { id: "g4", label: "Review 1 annotated game",      progress: 1, max: 1,  icon: "🔍" },
];

const RADAR_DATA = [
  { label: "Tactics",      value: 72 },
  { label: "Strategy",     value: 58 },
  { label: "Endgames",     value: 44 },
  { label: "Openings",     value: 65 },
  { label: "Calculation",  value: 68 },
  { label: "Time Mgmt",    value: 55 },
];

export {
  PLACEMENT_QUESTIONS,
  PLAYER_STYLES,
  COGNITIVE_METRICS,
  ADAPTIVE_LESSONS,
  COACH_PERSONAS,
  AI_INSIGHTS,
  WEEKLY_GOALS,
  RADAR_DATA,
};
