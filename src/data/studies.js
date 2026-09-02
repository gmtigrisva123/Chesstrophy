// ── STUDIES PAGE ──────────────────────────────────────────────────────────────
const STUDIES_DATA = [
  {
    category: "Endgame Studies", icon: "♚", color: "#C9A84C",
    items: [
      { id:"kp-vs-k", title: "King & Pawn vs King", difficulty: "Beginner", progress: 80, lessons: 6, desc: "Master the opposition and key squares to convert pawn endgames.",
        content: {
          chapters: [
            { title: "The Key Squares", fen: "8/8/8/4k3/4P3/4K3/8/8 w - - 0 1",
              body: [
                "Every king and pawn ending is decided by one question: can the attacking king reach the key squares in front of its pawn? For a pawn on e4, the key squares are d5, e5 and f5 — if White's king gets there first, the pawn queens no matter what Black does.",
                "The rule of thumb: with the pawn not yet past the fourth rank, the key squares sit two ranks ahead of it. As the pawn advances, the key squares move up with it.",
              ],
              note: "Count squares before you push the pawn. Pushing too early can hand the key squares to the defender for free." },
            { title: "Opposition", fen: "8/8/8/3k4/8/3K4/4P3/8 w - - 0 1",
              body: [
                "Opposition means the two kings face each other with exactly one square between them, and it's the other player's move. Whoever is forced to move away from the confrontation loses ground.",
                "Direct opposition (same file or rank) is the version you'll use most, but diagonal opposition and 'distant opposition' follow the same parity logic — count the squares between the kings; if it's odd and it's your opponent's move, you have the opposition.",
              ] },
            { title: "Converting the Win", fen: "8/8/8/8/3k4/8/3PK3/8 w - - 0 1",
              body: [
                "Once your king controls the key squares, the technique is mechanical: shoulder the enemy king away, walk your king in front of the pawn, then hand over the opposition at the right moment to let the pawn through.",
                "If you don't yet have the key squares, try to win the opposition first with a waiting move — often a pawn move elsewhere, or triangulation with the king.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Key squares = 2 ranks ahead of the pawn (fewer as it advances)", "Opposition = facing kings, one square apart, opponent to move", "The side with the opposition usually gains ground", "A rook pawn (a/h-file) is often a draw even with the key squares"],
            rules: ["If your king reaches a key square before the enemy king, the pawn queens by force.", "With the opposition, step forward — never sideways or back.", "Triangulation lets you lose a tempo to pass the opposition to your opponent."],
            mistakes: ["Pushing the pawn before securing the key squares — it can wall in your own king.", "Forgetting that rook-pawn endings are drawn far more often than other pawns.", "Chasing the enemy king instead of the key squares."],
            tricks: ["'Key squares before pawn moves' — say it before every push.", "Picture a ladder: the key squares climb the board one rung behind the pawn."],
          },
          practice: {
            tasks: ["Play out 5 king & pawn endings against the engine at a slow time control.", "Set up a rook-pawn ending and prove to yourself it's a draw with best defence.", "Practice triangulation from 3 different starting positions."],
            puzzleTags: ["Endgame", "King & Pawn", "Opposition"],
            quiz: [
              { q: "With a pawn on e4, which squares are the key squares?", options: ["d4, e4, f4", "d5, e5, f5", "d6, e6, f6"], answer: 1 },
              { q: "You have direct opposition when the kings are:", options: ["Two squares apart, your move", "One square apart, opponent to move", "On the same rank, any distance"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Play out one king & pawn ending to the end", "Review a rook-pawn draw", "Practice triangulation once"],
          },
        }
      },
      { id:"rook-endgame", title: "Rook Endgame Essentials", difficulty: "Intermediate", progress: 45, lessons: 10, desc: "Lucena, Philidor, and the most common rook endgame patterns.",
        content: {
          chapters: [
            { title: "The Lucena Position", fen: "1K6/1P6/8/8/8/8/r7/2k3R1 w - - 0 1",
              body: [
                "The Lucena position is the single most important winning technique in rook endings. The attacking side builds a 'bridge' with the rook on the fourth rank to shield the king from checks while the pawn queens.",
                "The method: cut the defending king off, walk your king to the queening square, then slide the rook to the fourth rank to block checks from the side.",
              ],
              note: "If you only remember one rook ending, make it this one — it comes up constantly." },
            { title: "The Philidor Position", fen: "8/8/1k6/8/8/1K6/1P6/r7 w - - 0 1",
              body: [
                "The Philidor position is the key drawing technique for the defender. Keep your rook on the third rank (the sixth from the pawn's perspective) until the pawn advances to that rank, then swing to the back rank for endless checks.",
                "The critical error is checking too early — you'll just get pushed away and lose the drawing chances.",
              ] },
            { title: "Cutting Off the King", fen: "8/8/8/3k4/8/3K1R2/4P3/8 b - - 0 1",
              body: [
                "A rook cutting off the enemy king along a file or rank is worth roughly a tempo every move — the king has to go the long way around. Combine a cut-off with pawn advances to make progress in endings that would otherwise be drawn.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Lucena = building a bridge to win", "Philidor = third-rank defence to draw", "Active rook > extra pawn, almost always", "Cutting off the king is worth a tempo"],
            rules: ["Rooks belong behind passed pawns — yours or the opponent's.", "In a draw-ish rook ending, activity beats material.", "Checking from behind rarely helps; check from the side."],
            mistakes: ["Putting the rook in front of your own passed pawn.", "Checking too early from the Philidor defence.", "Trading into a lost king & pawn ending by mistake."],
            tricks: ["'Rooks belong behind passers' — yours push, theirs you blockade from behind.", "Lucena = 'build the bridge'. Philidor = 'hold the third rank'."],
          },
          practice: {
            tasks: ["Drill the Lucena position from 3 different starting files.", "Drill the Philidor defence until you can hold it blindfolded.", "Analyze one of your own rook endgames for activity mistakes."],
            puzzleTags: ["Rook Endgame", "Technique"],
            quiz: [
              { q: "In the Lucena position, the rook builds a bridge on which rank?", options: ["The 2nd rank", "The 4th rank", "The 7th rank"], answer: 1 },
              { q: "The Philidor defence relies on holding which rank before the pawn passes it?", options: ["The 1st rank", "The 3rd rank (6th for Black)", "The 5th rank"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Drill Lucena once from scratch", "Drill Philidor once from scratch", "Review one rook ending from your own games"],
          },
        }
      },
      { id:"bn-mate", title: "Bishop & Knight Checkmate", difficulty: "Advanced", progress: 10, lessons: 4, desc: "The hardest basic checkmate. Step-by-step method to corner the king.",
        content: {
          chapters: [
            { title: "Why It's Hard", fen: "8/8/8/4k3/8/3BKN2/8/8 w - - 0 1",
              body: [
                "Bishop and knight vs. lone king is the hardest of the 'basic' checkmates because the king can only be mated in a corner that matches your bishop's colour. Push the wrong way and you'll never deliver mate.",
                "Give yourself the full 50 moves — this technique takes practice before it becomes automatic.",
              ] },
            { title: "The W-Manoeuvre", fen: "8/8/8/3k4/8/3BKN2/8/8 w - - 0 1",
              body: [
                "The knight and king herd the enemy king toward the correct corner using a repeating zig-zag pattern nicknamed the 'W'. The bishop controls the escape diagonal while the knight and king close the net.",
              ],
              note: "If the king slips to the wrong-coloured corner, you must shepherd it all the way across the board again." },
            { title: "Delivering Mate", fen: "7k/5N2/6K1/8/8/3B4/8/8 w - - 0 1",
              body: [
                "The final mate is almost always a knight check that forces the king onto the bishop's diagonal, with your king controlling the escape squares. Recognise the pattern so you don't fumble the last few moves.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Mate only works in the corner matching your bishop's colour", "The 'W' manoeuvre herds the king across the board", "You get 50 moves under FIDE rules — don't rush"],
            rules: ["Keep the bishop's diagonal cutting through the danger corner as often as possible.", "Use your king actively — it does most of the cornering work.", "Never let the king escape to the safe-coloured corner without a fight."],
            mistakes: ["Herding toward the wrong corner colour.", "Losing the opposition and letting the king slip past your king.", "Forgetting the knight can also accidentally stalemate the king — check before every move."],
            tricks: ["'Bishop's colour, bishop's corner' — say it before you start.", "The W-pattern: picture the knight tracing a W across the board as it drives the king in."],
          },
          practice: {
            tasks: ["Set up bishop & knight vs king from scratch and mate in under 30 moves.", "Repeat from the opposite side of the board (other colour corner) for the other bishop.", "Time yourself — aim to beat your previous attempt."],
            puzzleTags: ["Checkmate Technique", "Endgame"],
            quiz: [
              { q: "Bishop & knight mate only works in a corner that matches:", options: ["The knight's starting square", "The bishop's square colour", "Either corner, doesn't matter"], answer: 1 },
              { q: "How many moves does FIDE allow for this mate before a draw claim?", options: ["25", "50", "75"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Attempt the full mate once against the engine", "Review the W-manoeuvre diagram", "Time a second attempt"],
          },
        }
      },
    ],
  },
  {
    category: "Tactical Patterns", icon: "⚔", color: "#60a5fa",
    items: [
      { id:"pins-skewers", title: "Pins & Skewers", difficulty: "Beginner", progress: 100, lessons: 8, desc: "Recognise and exploit linear piece tactics in any position.",
        content: {
          chapters: [
            { title: "Absolute vs Relative Pins", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
              body: [
                "An absolute pin traps a piece against the king — it's illegal to move it at all. A relative pin traps a piece against something valuable, like the queen; moving it is legal but usually costly.",
                "Bishops, rooks and queens create pins along the lines they control. Always scan for enemy pieces lined up with their king or queen before you move.",
              ] },
            { title: "Skewers", fen: "6k1/8/8/8/8/8/6R1/6K1 w - - 0 1",
              body: [
                "A skewer is a pin in reverse: you attack a valuable piece, and when it moves, you win whatever is standing behind it. The classic pattern is a rook or bishop skewering a king in front of a rook or queen on the back rank.",
              ],
              note: "Look for skewers especially in the endgame, when kings are exposed on open files and diagonals." },
            { title: "Exploiting the Pin", fen: "rnb1kbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 1",
              body: [
                "A pinned piece is a weak piece — pile more attackers onto it than the defender has protectors, and it falls. This is one of the most common ways lower-rated players win material.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Absolute pin = against the king, illegal to move", "Relative pin = against something valuable, legal but costly", "Skewer = pin in reverse — attack the valuable piece first"],
            rules: ["Add attackers to a pinned piece faster than the defender can add defenders.", "Check every line your bishops, rooks and queens control for pins before moving.", "A pinned pawn can't capture — remember this in tactical calculations."],
            mistakes: ["Moving a relatively pinned piece without checking what's behind it.", "Missing that your own piece is pinned before making a tactical calculation.", "Overlooking skewers on open files in simplified endgames."],
            tricks: ["'Pin then pile' — pin it, then add more attackers than defenders.", "X-ray vision: always look one square past the piece you're attacking."],
          },
          practice: {
            tasks: ["Solve 10 pin puzzles in a row without hints.", "Find 3 skewer patterns from your recent games.", "Play a practice game trying to create at least one pin every game."],
            puzzleTags: ["Pin", "Skewer", "Tactics"],
            quiz: [
              { q: "A pin against the king is called:", options: ["Relative pin", "Absolute pin", "Discovered pin"], answer: 1 },
              { q: "In a skewer, which piece is attacked first?", options: ["The less valuable piece", "The more valuable piece", "It doesn't matter"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Analyse one game for a pin you missed", "Play one game looking for skewers", "Review absolute vs relative pins"],
          },
        }
      },
      { id:"discovered-attacks", title: "Discovered Attacks", difficulty: "Intermediate", progress: 60, lessons: 7, desc: "Unleash hidden attacks by moving a piece out of the way.",
        content: {
          chapters: [
            { title: "The Basic Idea", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
              body: [
                "A discovered attack happens when you move one piece, revealing an attack from a piece behind it. Because two pieces are moving in effect, the opponent often can't deal with both threats at once.",
              ] },
            { title: "Discovered Check", fen: "4k3/8/4B3/8/8/4R3/8/4K3 w - - 0 1",
              body: [
                "Discovered check is the deadliest version — the moving piece is free to do anything (even capture something undefended) while the revealed piece delivers check. This is one of the most powerful tactical weapons in chess.",
              ],
              note: "Double check — where both the moving piece and the revealed piece give check — can only be answered by moving the king." },
            { title: "Spotting the Setup", fen: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1",
              body: [
                "Look for your own pieces lined up on the same file, rank or diagonal, with an enemy king or queen at the far end. If you can move the front piece with tempo, you likely have a discovered attack waiting.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Moving one piece reveals an attack from another behind it", "Discovered check = the moving piece is free to do anything", "Double check can only be answered by moving the king"],
            rules: ["Scan for your own aligned pieces every few moves — this is how discoveries are found.", "A discovered check is often winning even if the moving piece 'does nothing' — check the board for hanging pieces first.", "Watch out for your opponent's discovered attacks too, especially after you develop a piece into a line."],
            mistakes: ["Missing that your own move opens a discovered attack for the opponent.", "Not checking what the 'free' moving piece can do before playing the discovery.", "Confusing discovered check with a simple double attack."],
            tricks: ["'What's behind it?' — ask this every time you consider moving a piece.", "Double check = king must move, no exceptions."],
          },
          practice: {
            tasks: ["Solve 10 discovered attack puzzles.", "Find one discovered check pattern and set it up on the board.", "Review a game where you missed a discovery opportunity."],
            puzzleTags: ["Discovered Attack", "Discovered Check", "Tactics"],
            quiz: [
              { q: "In a discovered check, the moving piece:", options: ["Must also give check", "Is free to move anywhere, even capture", "Cannot move at all"], answer: 1 },
              { q: "A double check can only be answered by:", options: ["Blocking one of the checks", "Capturing the checking piece", "Moving the king"], answer: 2 },
            ],
            checklist: ["Solve 15 puzzles", "Set up one discovered check pattern", "Analyse a game for missed discoveries", "Review the cheat sheet rules"],
          },
        }
      },
      { id:"interference-deflection", title: "Interference & Deflection", difficulty: "Advanced", progress: 20, lessons: 9, desc: "Remove defensive pieces through forcing combinations.",
        content: {
          chapters: [
            { title: "Deflection", fen: "3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1",
              body: [
                "Deflection lures a defending piece away from its job — usually with a check, capture, or threat it can't ignore — so you can exploit whatever it was protecting.",
              ] },
            { title: "Interference", fen: "6k1/8/8/3b4/8/8/1R6/6K1 w - - 0 1",
              body: [
                "Interference blocks the line between a defender and what it's defending, usually by sacrificing a piece onto the critical square. Once the line is cut, the tactic behind it goes through.",
              ],
              note: "Interference sacrifices often look like they lose material — calculate the follow-up carefully before dismissing them." },
            { title: "Combining Both", fen: "r4rk1/pp3ppp/2p5/8/3Q4/8/PPP2PPP/R3R1K1 w - - 0 1",
              body: [
                "The strongest combinations often chain deflection and interference together — remove one defender, block another, and the position collapses. These are the tactics that separate strong players from the rest.",
              ] },
          ],
          cheatSheet: {
            concepts: ["Deflection = lure a defender away from its job", "Interference = block the line between defender and defended", "Both are usually sacrifices — calculate the follow-up first"],
            rules: ["Ask 'what is this piece defending?' before every trade in a sharp position.", "A forcing move (check, capture, threat) is the best deflection tool.", "Interference sacrifices need concrete calculation — don't play them on instinct alone."],
            mistakes: ["Sacrificing for interference without checking the follow-up wins material back.", "Missing that a piece is overloaded, defending two things at once.", "Stopping calculation one move too early."],
            tricks: ["'What's it defending?' — the single most useful tactical question.", "Overloaded pieces are the classic deflection target — find the piece doing two jobs."],
          },
          practice: {
            tasks: ["Solve 10 deflection/interference puzzles.", "Find one overloaded piece in your last tournament or online game.", "Practice calculating 3 moves deep before playing a sacrifice."],
            puzzleTags: ["Deflection", "Interference", "Advanced Tactics"],
            quiz: [
              { q: "Deflection works by:", options: ["Blocking a defensive line", "Luring a defender away from its job", "Trading pieces evenly"], answer: 1 },
              { q: "A piece defending two things at once is called:", options: ["Pinned", "Overloaded", "Interfered"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Find one overloaded piece pattern", "Calculate one sacrifice 3 moves deep", "Review deflection vs interference"],
          },
        }
      },
    ],
  },
  {
    category: "Positional Concepts", icon: "♜", color: "#4ade80",
    items: [
      { id:"pawn-structure", title: "Pawn Structure Fundamentals", difficulty: "Intermediate", progress: 35, lessons: 12, desc: "Isolated, doubled, and passed pawns — how to exploit or defend them.",
        content: {
          chapters: [
            { title: "The Isolated Queen's Pawn", fen: "r1bqkb1r/pp3ppp/2n1pn2/3p4/2PP4/5N2/PP2BPPP/RNBQ1RK1 w kq - 0 1",
              body: [
                "An isolated pawn (no friendly pawns on either neighbouring file) can't be defended by other pawns, but it also controls key central squares and gives its owner active piece play. Whether it's a strength or weakness depends on who controls the game's pace.",
                "The blockading square directly in front of the isolated pawn is critical — a well-placed knight there neutralises much of its dynamic potential.",
              ] },
            { title: "Doubled Pawns", fen: "r1bqkbnr/pp1p1ppp/2n5/2p1p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1",
              body: [
                "Doubled pawns can't defend each other and often become long-term targets, but they also open a half-open file for a rook and can control extra central squares. Judge them by the position, not by reflex.",
              ] },
            { title: "Passed Pawns", fen: "8/5k2/8/4P3/8/5K2/8/8 w - - 0 1",
              body: [
                "A passed pawn — no enemy pawns able to stop it on its file or the adjacent files — grows more dangerous the closer it gets to promotion. 'A passed pawn's lust to expand' is one of the most quoted lines in chess literature for a reason.",
              ],
              note: "Rooks belong behind passed pawns, whichever side owns them." },
          ],
          cheatSheet: {
            concepts: ["Isolated pawn = no pawn support, but open lines for pieces", "Doubled pawns = weak long-term, but open files short-term", "Passed pawn = nothing can stop it reaching the 8th but blockade/capture"],
            rules: ["Blockade an isolated pawn with a knight, not a bishop, when possible.", "Trade pieces (not pawns) when you're playing against an isolated pawn.", "Push passed pawns when you have piece support behind them, not before."],
            mistakes: ["Trading into a pawn structure without evaluating who benefits long-term.", "Blockading with the wrong piece, letting it get kicked away.", "Ignoring a passed pawn until it's too late to stop."],
            tricks: ["'Pieces over pawns vs isolani' — trade pieces, keep pawns, if you're attacking an isolated pawn.", "A passed pawn wants to run — rooks behind it, king in front to stop it."],
          },
          practice: {
            tasks: ["Analyse one of your games and label every pawn island.", "Play a practice game aiming to create a passed pawn.", "Find 3 examples of good vs bad knight blockades in master games."],
            puzzleTags: ["Pawn Structure", "Positional"],
            quiz: [
              { q: "The best piece to blockade an isolated pawn is usually:", options: ["A bishop", "A knight", "A rook"], answer: 1 },
              { q: "Rooks belong _____ passed pawns.", options: ["In front of", "Behind", "Beside"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Label pawn islands in one of your games", "Find one passed-pawn example", "Review blockading rules"],
          },
        }
      },
      { id:"outposts", title: "Outpost Squares", difficulty: "Intermediate", progress: 0, lessons: 6, desc: "Place knights and bishops on dominant squares your opponent cannot attack.",
        content: {
          chapters: [
            { title: "What Makes an Outpost", fen: "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N2N2/PP2BPPP/R1BQK2R w KQkq - 0 1",
              body: [
                "An outpost is a square that can't be attacked by an enemy pawn — usually because the pawns that would attack it have already been traded or advanced past it. A knight on an outpost is often worth more than a bishop.",
              ] },
            { title: "Getting a Piece There", fen: "r1bq1rk1/pp1n1ppp/2p1pn2/3pN3/2PP4/2N5/PP2BPPP/R1BQ1RK1 w - - 0 1",
              body: [
                "Route your knight to the outpost via the safest path, and consider provoking the pawn trades that create the outpost in the first place — for instance, trading on d5 to hand yourself the d5 square.",
              ],
              note: "Protect the outpost square with a pawn if you can — it's much harder to dislodge a defended piece." },
          ],
          cheatSheet: {
            concepts: ["Outpost = square no enemy pawn can attack", "Knights love outposts more than bishops", "A protected outpost is nearly impossible to remove"],
            rules: ["Look for outposts on your 4th, 5th or 6th rank (from your side).", "Support the outpost with a pawn whenever the structure allows it.", "Trade off the opponent's pieces that could challenge your outpost knight (their same-coloured bishop, or a knight that could also reach the square)."],
            mistakes: ["Placing a piece on an 'outpost' that can still be attacked by a pawn a move later.", "Ignoring the bishop that could trade off your outpost knight.", "Forgetting to protect the outpost square with a pawn when possible."],
            tricks: ["Circle the square, then ask: can any enemy pawn ever reach a square that attacks it? If no, it's a real outpost."],
          },
          practice: {
            tasks: ["Find 3 outpost squares in your recent games, played or missed.", "Play a practice game aiming to establish a knight outpost by move 20.", "Study one master game built entirely around an outpost knight."],
            puzzleTags: ["Outposts", "Positional"],
            quiz: [
              { q: "An outpost square is one that:", options: ["Is defended by two pieces", "No enemy pawn can ever attack", "Is in the center of the board"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Find one outpost square in a recent game", "Study one master game with an outpost theme", "Review the cheat sheet rules"],
          },
        }
      },
      { id:"rook-7th", title: "Rook on the Seventh Rank", difficulty: "Advanced", progress: 0, lessons: 5, desc: "How to dominate with a rook cutting off the king on the 7th rank.",
        content: {
          chapters: [
            { title: "Why the 7th Rank Matters", fen: "6k1/R4ppp/8/8/8/8/5PPP/6K1 w - - 0 1",
              body: [
                "A rook on the seventh rank (second rank for Black) attacks pawns that haven't moved and often traps the enemy king on the back rank. Two rooks doubled on the seventh — the 'pigs on the seventh' — can be devastating.",
              ] },
            { title: "Cutting Off the King", fen: "6k1/5R1p/6p1/8/8/8/5PPP/6K1 w - - 0 1",
              body: [
                "Beyond eating pawns, a rook on the seventh often confines the enemy king to the back rank entirely, which can be enough on its own to win an endgame by zugzwang.",
              ],
              note: "Look for perpetual check patterns too — a rook on the seventh combined with another piece can sometimes force a draw from a losing position." },
          ],
          cheatSheet: {
            concepts: ["Rook on the 7th attacks undeveloped pawns", "Doubled rooks on the 7th = 'pigs on the seventh'", "Can confine the enemy king to the back rank"],
            rules: ["Look to plant a rook on the seventh as soon as an open file allows it.", "Two rooks on the seventh can deliver perpetual check even when material down.", "Defend against it by trading rooks or advancing the pawns it attacks before it arrives."],
            mistakes: ["Allowing a rook to reach the seventh for free when a trade was available.", "Missing a perpetual-check drawing resource for the defending side.", "Not evaluating how confined your own king is once the rook lands."],
            tricks: ["'Pigs on the seventh' — a fun way to remember just how strong doubled 7th-rank rooks are."],
          },
          practice: {
            tasks: ["Find one example of 'pigs on the seventh' from master games.", "Play a practice game aiming to plant a rook on the seventh rank.", "Analyse a defensive game where the seventh rank was under attack."],
            puzzleTags: ["Rook Activity", "Positional"],
            quiz: [
              { q: "Two rooks doubled on the seventh rank are nicknamed:", options: ["Twin towers", "Pigs on the seventh", "The double lock"], answer: 1 },
            ],
            checklist: ["Solve 15 puzzles", "Study one 'pigs on the seventh' example", "Play one game aiming for the 7th rank", "Review defensive resources against it"],
          },
        }
      },
    ],
  },
];

export {
  STUDIES_DATA,
};
