const RATING_GROUP_COLORS = {
  Beginner: "#4ade80", Novice: "#60a5fa", Intermediate: "#2563EB",
  Advanced: "#f59e0b", Expert: "#fb7185", Master: "#a78bfa",
};

// ── Question bank, organized by rating group and topic ───────────────────────
const DQ_BANK = {
  Beginner: [
    { id:"b1", topic:"Piece Values",       type:"Multiple Choice", q:"Which piece is generally worth the most material (excluding the king)?", options:["Rook","Bishop","Queen","Knight"], answer:2,
      explain:"The queen is worth approximately 9 points, the most valuable piece besides the king.", learning:"Standard values: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9.", difficulty:"Easy", strengthNeeded:"600+" },
    { id:"b2", topic:"Basic Tactics",      type:"Tactical Puzzle", q:"White to move. Find the move that wins material with a fork.", fen:"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", options:["Ng5","Bxf7+","Qe2","O-O"], answer:1,
      explain:"Bxf7+! forks the king and wins the f7 pawn with check, disrupting Black's structure.", learning:"Always check for undefended squares near the enemy king.", difficulty:"Easy", strengthNeeded:"700+" },
    { id:"b3", topic:"Checkmate Patterns", type:"Position Evaluation", q:"True or False: A king on the back rank surrounded by its own pawns with no escape square can be checkmated by a single rook on the back rank.", options:["True","False"], answer:0,
      explain:"This is the 'back rank mate' — one of the most fundamental checkmate patterns in chess.", learning:"Always keep a luft (escape square) for your king once your back rank is weak.", difficulty:"Easy", strengthNeeded:"500+" },
    { id:"b4", topic:"Opening Principles", type:"Multiple Choice", q:"Which of these is NOT a core opening principle?", options:["Control the center","Develop pieces quickly","Move the same piece multiple times early","Castle for king safety"], answer:2,
      explain:"Moving the same piece repeatedly in the opening wastes time (tempo) that could be used for development.", learning:"Develop a new piece each move where possible in the opening.", difficulty:"Easy", strengthNeeded:"500+" },
    { id:"b5", topic:"Basic Endgames",     type:"Best Move", q:"King and pawn vs king: your king is in front of your pawn with the opposition. What should you do?", options:["Push the pawn immediately","Advance the king first, keep the opposition","Move the king backward","Sacrifice the pawn"], answer:1,
      explain:"In king and pawn endgames, having the opposition while advancing the king (not the pawn) is the winning technique.", learning:"The king should usually lead the pawn in basic king and pawn endgames.", difficulty:"Medium", strengthNeeded:"700+" },
  ],
  Novice: [
    { id:"n1", topic:"Forks",              type:"Tactical Puzzle", q:"Black to move. Find the knight move that forks two pieces.", fen:"r2qkb1r/ppp2ppp/2n1bn2/3pp3/4P3/2NP1N2/PPP2PPP/R1BQKB1R b KQkq - 0 6", options:["Nb4","Nxe4","Ng4","Nd4"], answer:1,
      explain:"Nxe4! wins a central pawn and creates threats since the knight attacks both c3 and f2 simultaneously.", learning:"Knights on central squares often have powerful forking potential.", difficulty:"Medium", strengthNeeded:"1000+" },
    { id:"n2", topic:"Pins",               type:"Best Move", q:"You see your opponent's knight pinned to their king by your bishop. What's the best follow-up plan?", options:["Trade the bishop immediately","Pile pressure on the pinned piece with more attackers","Ignore it and develop elsewhere","Move the bishop away"], answer:1,
      explain:"Adding attackers to a pinned piece often wins material since it cannot move to defend itself.", learning:"A pin restricts movement — exploit it by increasing pressure.", difficulty:"Medium", strengthNeeded:"1000+" },
    { id:"n3", topic:"Discovered Attacks", type:"Multiple Choice", q:"What makes discovered attacks especially dangerous?", options:["They are easy to spot", "The moving piece can deliver a second threat while revealing another", "They only work in the endgame", "They require a queen"], answer:1,
      explain:"Discovered attacks are powerful because two threats happen at once — the moved piece's threat plus the revealed piece's threat.", learning:"Look for pieces that can move to reveal an attack from a piece behind them.", difficulty:"Medium", strengthNeeded:"1100+" },
    { id:"n4", topic:"Pawn Structures",    type:"Position Evaluation", q:"You have doubled pawns on the c-file but open lines for your rooks. Is this generally:", options:["Always bad","Always good","Can be a fair trade-off depending on activity","Illegal in chess"], answer:2,
      explain:"Doubled pawns are a structural weakness, but if they come with open files and piece activity, they can be worth it.", learning:"Evaluate pawn weaknesses against the dynamic compensation you receive.", difficulty:"Medium", strengthNeeded:"1100+" },
    { id:"n5", topic:"Candidate Moves",    type:"Find the Plan", q:"Before playing a move, what should you always do first?", options:["Play the first move you see","Generate several candidate moves and compare them","Always capture if possible","Ask your opponent for hints"], answer:1,
      explain:"Strong players generate 2–4 candidate moves and compare them before committing, rather than playing the first idea.", learning:"Develop the habit of considering multiple candidate moves each turn.", difficulty:"Medium", strengthNeeded:"1000+" },
  ],
  Intermediate: [
    { id:"i1", topic:"Forks",              type:"Tactical Puzzle", q:"Find the tactical shot for White that wins material via a fork.", fen:"r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 2 8", options:["cxd5","Ne5","Bxh7+","Qb3"], answer:2,
      explain:"Bxh7+! is the classic Greek Gift sacrifice, exploiting weaknesses around the king after Kxh7 Ng5+.", learning:"Watch for sacrificial bishop attacks (Bxh7+) when the enemy king's defenders are reduced.", difficulty:"Hard", strengthNeeded:"1500+" },
    { id:"i2", topic:"Pawn Structures",    type:"Position Evaluation", q:"In an IQP (isolated queen's pawn) position, which side typically benefits from trading pieces?", options:["The side WITH the IQP", "The side WITHOUT the IQP", "Neither side benefits", "It depends only on material"], answer:1,
      explain:"The side without the IQP usually wants to trade pieces to reach an endgame where the isolated pawn becomes a long-term weakness.", learning:"IQP holder wants activity and attack; the opponent wants simplification.", difficulty:"Medium", strengthNeeded:"1400+" },
    { id:"i3", topic:"Candidate Moves",    type:"Find the Plan", q:"You have a strong knight outpost on d5 supported by a pawn. What is the priority plan?", options:["Trade the knight immediately","Keep the knight there and build around it","Retreat the knight to safety","Sacrifice the knight for activity"], answer:1,
      explain:"A well-supported outpost is a long-term structural advantage — build your position around it rather than trading it.", learning:"Outposts on the 5th/6th rank that can't be challenged by pawns are extremely valuable.", difficulty:"Medium", strengthNeeded:"1300+" },
    { id:"i4", topic:"Famous Games",       type:"Chess History", q:"In the famous 'Immortal Game' (Anderssen vs Kieseritzky, 1851), what did White famously sacrifice to deliver checkmate?", options:["Both rooks and the queen", "Just a knight", "Both bishops", "The queen only"], answer:0,
      explain:"Anderssen sacrificed both rooks and the queen, delivering checkmate with just three minor pieces.", learning:"Material sacrifice for mating attacks has been a chess theme since the Romantic era.", difficulty:"Medium", strengthNeeded:"1200+" },
    { id:"i5", topic:"Middlegame Decision",type:"Best Move", q:"You're choosing between trading into a slightly better endgame or keeping queens on for attacking chances with equal material. Generally you should:", options:["Always trade queens", "Consider your opponent's weaknesses and your attacking potential", "Always avoid trades", "Trade only rooks, never queens"], answer:1,
      explain:"The decision depends on context — king safety, piece activity, and pawn structure all matter more than a blanket rule.", learning:"Evaluate trades based on resulting structure and activity, not dogma.", difficulty:"Hard", strengthNeeded:"1500+" },
  ],
  Advanced: [
    { id:"a1", topic:"Strategic Planning", type:"Find the Plan", q:"You have a spatial advantage on the kingside but your opponent has counterplay on the queenside. What's the typical strategic approach?", options:["Race to attack faster than your opponent's counterplay","Defend passively on both sides","Trade all pieces immediately","Ignore the queenside entirely"], answer:0,
      explain:"In races between attacks on opposite wings, speed and precision matter — calculate who arrives first.", learning:"Opposite-side attacks require precise calculation of tempo.", difficulty:"Hard", strengthNeeded:"1800+" },
    { id:"a2", topic:"Positional Sacrifices", type:"Position Evaluation", q:"A piece sacrifice for long-term positional compensation (strong bishop pair, weak enemy king) is typically called:", options:["A blunder","An exchange sacrifice","A positional sacrifice","An illegal move"], answer:2,
      explain:"Positional sacrifices trade material for long-term structural or strategic advantages rather than immediate tactics.", learning:"Petrosian and Karpov were famous for positional exchange sacrifices.", difficulty:"Hard", strengthNeeded:"1700+" },
    { id:"a3", topic:"Transition to Endgame", type:"Best Move", q:"You're slightly better in the middlegame with a strong knight vs a bad bishop. Should you trade into an endgame?", options:["No, avoid endgames always","Yes, simplifying often increases the practical value of structural advantages","Only if you're losing","Never trade minor pieces"], answer:1,
      explain:"Trading down when you have a structural edge (good knight vs bad bishop) often increases your winning chances.", learning:"Simplification favors the side with a lasting structural or piece-quality advantage.", difficulty:"Hard", strengthNeeded:"1700+" },
    { id:"a4", topic:"Calculation",        type:"Tactical Puzzle", q:"Calculate: White to move and force a winning material gain in 3 moves.", fen:"2r3k1/5ppp/p7/1p6/3B4/1P6/P4PPP/4R1K1 w - - 0 28", options:["Bxb6","Re8+","Bb6","Rd1"], answer:1,
      explain:"Re8+! Rxe8 Bb6 forks the a8-rook... wait, this forces Rxe8, then the bishop wins material via discovered tactics on the back rank.", learning:"Always check forcing moves (checks, captures, threats) first in calculation.", difficulty:"Hard", strengthNeeded:"1800+" },
    { id:"a5", topic:"Advanced Opening Ideas", type:"Multiple Choice", q:"In modern opening theory, what is a key reason for delaying castling in some sharp lines?", options:["It's always wrong to delay castling","Keeping the king flexible can avoid becoming a target in certain attacking lines","Castling is illegal in some openings","There's no strategic reason"], answer:1,
      explain:"In some sharp systems, delaying castling keeps options open and avoids the king becoming a clear target for a prepared attack.", learning:"Modern theory treats castling as a strategic choice, not always an automatic move.", difficulty:"Hard", strengthNeeded:"1900+" },
  ],
  Expert: [
    { id:"e1", topic:"Complex Calculation", type:"Tactical Puzzle", q:"In a sharp tactical position with multiple candidate moves, what is the most reliable calculation method?", options:["Guess based on intuition only","Calculate forcing lines first (checks, captures, threats) to a clear endpoint","Only calculate one move deep","Avoid calculation and play positionally"], answer:1,
      explain:"At the expert level, calculating forcing sequences to a concrete, evaluable position is the gold standard.", learning:"Always seek a 'quiet' or clearly evaluable position at the end of forced calculation.", difficulty:"Very Hard", strengthNeeded:"2000+" },
    { id:"e2", topic:"GM Positions",       type:"Position Evaluation", q:"In a position with opposite-colored bishops and extra material for one side, what is generally true about drawing chances?", options:["OCB always wins for the side with more material","OCB endgames famously favor drawing chances even with extra pawns","OCB has no effect on draw likelihood","OCB only matters in the middlegame"], answer:1,
      explain:"Opposite-colored bishop endgames are notoriously drawish, even with a significant material advantage, due to blockading potential.", learning:"Material advantage means less in OCB endgames than in same-colored bishop endgames.", difficulty:"Hard", strengthNeeded:"2000+" },
    { id:"e3", topic:"Dynamic Imbalances", type:"Find the Plan", q:"You have two minor pieces for a rook and pawn in a complex middlegame. The strategic priority is usually:", options:["Trade pieces to reach a simple endgame immediately","Use piece coordination and activity to outweigh the small material deficit","Resign the position","Always avoid such imbalances"], answer:1,
      explain:"Two minor pieces vs rook+pawn is roughly balanced material-wise; piece coordination determines who's better.", learning:"Evaluate dynamic imbalances by activity and coordination, not just point-count.", difficulty:"Very Hard", strengthNeeded:"2100+" },
    { id:"e4", topic:"High-Level Endgames", type:"Best Move", q:"In a complex rook endgame with pawns on both sides, what's the single most important factor?", options:["Material count alone","Rook activity and king activity","Number of pawns only","Whoever has more time on the clock"], answer:1,
      explain:"Rook activity ('rooks belong behind passed pawns') and king activity are the dominant factors in rook endgames.", learning:"Tarrasch's rule: rooks belong behind passed pawns, whether yours or your opponent's.", difficulty:"Very Hard", strengthNeeded:"2100+" },
    { id:"e5", topic:"Preparation Concepts", type:"Chess History", q:"Modern top-level opening preparation primarily relies on:", options:["Pure intuition only","Deep engine analysis combined with practical understanding","Memorizing 50 moves without understanding","Avoiding all theoretical lines"], answer:1,
      explain:"Modern preparation blends engine-verified lines with deep practical and strategic understanding of resulting positions.", learning:"Engines find the moves; understanding why they work is what separates true mastery.", difficulty:"Very Hard", strengthNeeded:"2200+" },
  ],
  Master: [
    { id:"m1", topic:"Complex Calculation", type:"Tactical Puzzle", q:"In deep calculation with multiple branches, what is the critical skill that separates masters from experts?", options:["Speed alone","Accurate evaluation of resulting quiet positions at the end of each branch","Memorizing more openings","Playing faster blitz"], answer:1,
      explain:"Masters excel at accurately evaluating the resulting positions after forced sequences, not just finding the moves.", learning:"Calculation is only as good as your evaluation of the final position.", difficulty:"Master", strengthNeeded:"2400+" },
    { id:"m2", topic:"GM Positions",       type:"Position Evaluation", q:"In a position with mutual weaknesses and dynamic balance, top engines often disagree slightly with human evaluation because:", options:["Engines are always wrong","Engines calculate concrete lines deeply while humans weigh long-term strategic factors differently","Humans are always more accurate","There's no difference"], answer:1,
      explain:"Engines excel at concrete tactical evaluation; understanding why an evaluation holds requires human-style strategic insight.", learning:"Combining engine accuracy with human strategic understanding is the modern approach to mastery.", difficulty:"Master", strengthNeeded:"2400+" },
    { id:"m3", topic:"High-Level Endgames", type:"Find the Plan", q:"In a theoretically drawn but practically difficult endgame, what should a strong player prioritize?", options:["Resigning immediately","Setting maximum practical problems for the opponent to solve under time pressure","Offering a draw immediately","Playing randomly"], answer:1,
      explain:"Creating maximum practical difficulty in objectively equal or slightly worse positions is a hallmark of top-level play.", learning:"Practical chances often matter more than theoretical evaluation in human games.", difficulty:"Master", strengthNeeded:"2500+" },
  ],
};

// Map types to icons
const DQ_TYPE_ICONS = {
  "Multiple Choice": "📝", "Best Move": "♟️", "Position Evaluation": "⚖️",
  "Find the Plan": "🗺️", "Tactical Puzzle": "⚡", "Opening Question": "📖",
  "Middlegame Decision": "🎯", "Endgame Technique": "👑", "Chess History": "📜", "Famous Games": "🏆",
};

// Quiz tester categories and question pools (reuse bank, tagged by category)
const QUIZ_CATEGORIES = [
  { id:"opening",    label:"Opening",    icon:"📖" },
  { id:"middlegame", label:"Middlegame", icon:"⚔️" },
  { id:"endgame",    label:"Endgame",    icon:"👑" },
  { id:"tactics",    label:"Tactics",    icon:"⚡" },
  { id:"strategy",   label:"Strategy",   icon:"🗺️" },
  { id:"calculation",label:"Calculation",icon:"🔢" },
  { id:"general",    label:"General Chess Knowledge", icon:"🌍" },
];

const QUIZ_BANK = {
  opening: [
    { q:"What does it mean to 'control the center' in the opening?", options:["Place pawns and pieces to influence d4/d5/e4/e5","Move your king to the center","Avoid developing pieces","Trade all central pawns immediately"], answer:0, explain:"Central control restricts your opponent's piece mobility and supports your own development." },
    { q:"Which opening is known for an early kingside fianchetto by White?", options:["Italian Game","King's Indian Attack","Queen's Gambit","French Defense"], answer:1, explain:"The King's Indian Attack features an early g3 and Bg2 fianchetto setup." },
    { q:"True or False: It's generally good to move your queen out very early in the opening.", options:["True","False"], answer:1, explain:"Early queen moves often waste tempo as the opponent develops with tempo by attacking the queen." },
  ],
  middlegame: [
    { q:"What is 'prophylaxis' in chess strategy?", options:["Attacking immediately","Preventing your opponent's plans before executing your own","Sacrificing material for speed","A type of opening"], answer:1, explain:"Prophylaxis means anticipating and preventing opponent's ideas — a key Karpov/Petrosian theme." },
    { q:"A 'minority attack' typically refers to:", options:["Attacking with fewer pawns against a pawn majority to create weaknesses","Always attacking with the queen alone","An illegal strategy","Attacking only in the endgame"], answer:0, explain:"Minority attacks (e.g., b4-b5 vs a pawn majority) aim to create structural weaknesses in the opponent's camp." },
  ],
  endgame: [
    { q:"What is the 'opposition' in king and pawn endgames?", options:["When kings face each other with one square between them and it's the opponent's move","A type of checkmate","An illegal position","A pawn structure"], answer:0, explain:"Having the opposition forces your opponent's king to give way, which is often key to winning king/pawn endgames." },
    { q:"In rook endgames, where should a rook be placed relative to passed pawns?", options:["In front of the pawn always","Behind the pawn (yours or the opponent's)","On the side of the board","It doesn't matter"], answer:1, explain:"Tarrasch's Rule: rooks belong behind passed pawns, whether they're your own (to support) or the opponent's (to attack)." },
  ],
  tactics: [
    { q:"What tactic involves attacking two pieces at once with a single piece?", options:["A pin","A fork","A skewer","Zugzwang"], answer:1, explain:"A fork attacks two or more pieces simultaneously, typically with a knight or pawn." },
    { q:"A 'skewer' is best described as:", options:["Attacking a less valuable piece first, forcing it to move and expose a more valuable piece behind it","Trading pieces equally","A type of checkmate","Castling early"], answer:0, explain:"A skewer is like a reverse pin — the more valuable piece is in front and forced to move." },
  ],
  strategy: [
    { q:"What does 'piece activity' generally refer to?", options:["How many pieces you have","How effectively your pieces influence the board","The color of your pieces","How fast you move"], answer:1, explain:"Piece activity measures how much influence and mobility your pieces have, often more important than material alone." },
    { q:"A 'good bishop' is typically one that:", options:["Is blocked by its own pawns","Has open diagonals not blocked by its own pawns","Is traded early","Stays on the back rank"], answer:1, explain:"A good bishop has freedom of movement; a bad bishop is hemmed in by its own pawn structure." },
  ],
  calculation: [
    { q:"When calculating, which moves should you consider first?", options:["Quiet developing moves","Forcing moves: checks, captures, and threats","Random moves","Only pawn moves"], answer:1, explain:"Forcing moves narrow the opponent's options and are easier to calculate accurately." },
    { q:"What is a 'quiet move' in calculation?", options:["A move that doesn't create immediate threats but improves the position","A move that always loses","A check","A capture"], answer:0, explain:"Quiet moves consolidate gains after forcing sequences and are often the hardest to find." },
  ],
  general: [
    { q:"Who was the first official World Chess Champion?", options:["Paul Morphy","Wilhelm Steinitz","Emanuel Lasker","Bobby Fischer"], answer:1, explain:"Wilhelm Steinitz became the first official World Champion in 1886." },
    { q:"What does 'FIDE' stand for?", options:["Federation Internationale Des Echecs","Federal International Defense Engine","French International Chess Exhibition","None of the above"], answer:0, explain:"FIDE (Fédération Internationale des Échecs) is the international chess governing body." },
  ],
};

// ── Recommended studies generator based on weak topics ────────────────────────
const STUDY_LIBRARY = {
  "Forks":               { title:"Basic Fork Patterns",          difficulty:"Beginner",     time:"15 min" },
  "Pins":                { title:"Pin Tactics Masterclass",      difficulty:"Intermediate", time:"20 min" },
  "Discovered Attacks":  { title:"Discovered Attack Patterns",   difficulty:"Intermediate", time:"18 min" },
  "Pawn Structures":     { title:"Pawn Structures Explained",    difficulty:"Intermediate", time:"25 min" },
  "Candidate Moves":     { title:"Candidate Move Selection",     difficulty:"Intermediate", time:"20 min" },
  "Basic Endgames":      { title:"Opposition in King Endgames",  difficulty:"Beginner",     time:"15 min" },
  "Checkmate Patterns":  { title:"Essential Checkmate Patterns", difficulty:"Beginner",     time:"20 min" },
  "Opening Principles":  { title:"Italian Game Plans",           difficulty:"Beginner",     time:"18 min" },
  "Strategic Planning":  { title:"Strategic Planning Fundamentals", difficulty:"Advanced",  time:"30 min" },
  "Calculation":         { title:"Calculation Training",         difficulty:"Advanced",     time:"35 min" },
  "Transition to Endgame": { title:"Middlegame to Endgame Transitions", difficulty:"Advanced", time:"25 min" },
  "Positional Sacrifices": { title:"Positional Exchange Sacrifices", difficulty:"Advanced", time:"30 min" },
  "Famous Games":        { title:"Classic Games Study",          difficulty:"All Levels",   time:"20 min" },
  "Middlegame Decision": { title:"Piece Activity",               difficulty:"Intermediate", time:"22 min" },
  "Complex Calculation": { title:"Deep Calculation Training",    difficulty:"Master",       time:"40 min" },
  "GM Positions":        { title:"GM Position Analysis",         difficulty:"Expert",       time:"35 min" },
  "Dynamic Imbalances":  { title:"Dynamic Imbalances Study",     difficulty:"Expert",       time:"30 min" },
  "High-Level Endgames": { title:"Advanced Rook Endgames",       difficulty:"Expert",       time:"35 min" },
  "Preparation Concepts":{ title:"Modern Opening Preparation",   difficulty:"Master",       time:"40 min" },
  "Advanced Opening Ideas": { title:"Advanced Opening Strategy", difficulty:"Advanced",    time:"28 min" },
};

export {
  DQ_BANK,
  DQ_TYPE_ICONS,
  QUIZ_CATEGORIES,
  QUIZ_BANK,
  STUDY_LIBRARY,
  RATING_GROUP_COLORS,
};
