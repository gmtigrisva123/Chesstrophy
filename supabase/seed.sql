-- =========================================================================
-- ChessProphy - seed data
-- =========================================================================
--
--   GENERATED FILE - DO NOT EDIT BY HAND.
--
--   Source:     src/data/*.js and src/services/adminData.js
--   Generator:  scripts/generate-supabase-seed.mjs
--   Regenerate: npm run db:seed:generate
--   CI asserts this file matches its sources (npm run db:seed:check).
--
-- Every statement is idempotent, so this can be re-run against a database that
-- already holds it. Applied automatically by `supabase db reset`.
--
-- Content ids are the application's own stable identifiers, so a re-seed
-- updates rows in place rather than duplicating them. Learner data is never
-- touched by this file.
-- =========================================================================

begin;

-- --------------------------------------------------------------------------
-- Openings
-- --------------------------------------------------------------------------

insert into public.openings (id, name, eco, opening_group, for_side, style, difficulty, rating_band, popularity, study_time, accent_colour, tags, history, overview, editorial, sort_order, is_published) values
  ('italian', 'Italian Game', 'C50–C59', 'e4 Openings', 'white', 'Attacking', 'Beginner', '600–1400', 92, '2–3 hrs', '#C9A84C', array['Attack', 'Classical']::text[], 'One of the oldest recorded openings, played since the 16th century. The Italian Game develops naturally and leads to open, tactical positions ideal for learning piece coordination.', 'White develops the bishop to c4, eyeing the f7 weakness, and aims for rapid development and central control.', '{"mainIdeas":["Target the f7 square — the weakest point in Black''s camp early on","Castle quickly for king safety","Build a strong pawn center with d3/d4","Develop pieces toward the kingside for attacking chances"],"strategicConcepts":["Piece activity over material in some lines","Central pawn tension management","Open lines for rooks after central exchanges"],"tacticalThemes":["Fried Liver Attack sacrifices","Greek Gift on h7 in certain structures","Pins on the c6-knight","Discovered attacks via the c4-bishop"],"typicalPlans":["Push d4 to seize the center","Re-route the c4 bishop to b3 to avoid trades","Build a kingside attack with Ng5/Qh5 in sharp lines"],"pieceDevelopment":"Nf3 and Bc4 first, then O-O. The dark bishop often develops to e3 or g5 depending on the variation.","pawnStructures":"Symmetrical e4/e5 structure that can become asymmetric after d4 exchanges.","importantSquares":["f7 (weak point)","d5 (central outpost)","g5 (knight jumps in sharp lines)"],"typicalSacrifices":"The Fried Liver Attack sacrifices a knight on f7 for a long-term attack on Black''s exposed king.","commonMistakes":["Playing Bxf7+ too early without follow-up","Neglecting development for premature attacks","Allowing ...Nxe4 tactics due to weak e4 defense"],"moveOrderTricks":"1.e4 e5 2.Nf3 Nc6 3.Bc4 can transpose into the Two Knights Defense if Black plays 3...Nf6 instead of 3...Bc5.","transpositions":"Can transpose to the Giuoco Piano, Two Knights Defense, or even some Scotch Game lines.","commonTraps":["Legal''s Mate trap if Black is careless with development","Fried Liver Attack if Black allows Ng5"],"opponentResponses":"Most common replies are 3...Bc5 (Giuoco Piano) or 3...Nf6 (Two Knights Defense).","famousPlayers":["Paul Morphy","Garry Kasparov (occasionally)","Magnus Carlsen (modern revival)"],"modelGames":[{"white":"Paul Morphy","black":"Duke of Brunswick","year":1858,"note":"The Opera Game — a model of rapid development and attack."}]}'::jsonb, 0, true),
  ('ruylopez', 'Ruy López', 'C60–C99', 'e4 Openings', 'white', 'Positional', 'Advanced', '1400–2400+', 85, '10+ hrs', '#C9A84C', array['Positional', 'Classical', 'Theory-heavy']::text[], 'Named after 16th-century Spanish priest Ruy López de Segura, this is one of the most respected and deeply analyzed openings in chess history, favored by World Champions for over a century.', 'White pins the knight defending e5, creating long-term pressure while preparing flexible central play.', '{"mainIdeas":["Pressure the e5 pawn indirectly via the pin","Maintain flexible pawn structure with options for d4 or c3-d4","Long-term maneuvering and piece improvement"],"strategicConcepts":["The Spanish bishop''s long-term influence on the queenside","Minority attacks in closed structures","Knight maneuvers via d2-f1-g3 or e1-d3"],"tacticalThemes":["Exchange sacrifices on e5 or f6 structures","Greek Gift in some Closed Ruy lines","Breaking with d4 at the right moment"],"typicalPlans":["Build slowly with c3 and d4","Maneuver knights to improve piece activity (Nbd2-f1-g3)","Target queenside space with a2-a4 and b4 expansion"],"pieceDevelopment":"Bb5, then O-O, Re1, c3 and d4 — methodical, classical development.","pawnStructures":"Often leads to closed e4/e5 structures with flexible pawn breaks on both wings.","importantSquares":["e5 (central tension point)","d5/f5 (outposts for both sides)","b5 (the Spanish bishop''s original square)"],"typicalSacrifices":"Exchange sacrifices (Rxc3 or Rxe5 ideas) appear in several modern main lines for long-term compensation.","commonMistakes":["Releasing central tension too early","Trading the light-squared bishop without compensation","Neglecting queenside space in closed lines"],"moveOrderTricks":"The Berlin Defense (3...Nf6) avoids most main-line theory and leads to a famous endgame structure.","transpositions":"Many lines transpose between the Closed, Open, and Exchange variations depending on move order.","commonTraps":["Noah''s Ark Trap — trapping the bishop with ...b5/...c4 if White is careless"],"opponentResponses":"3...a6 (Morphy Defense) is by far the most common, followed by 3...Nf6 (Berlin).","famousPlayers":["Bobby Fischer","Magnus Carlsen","Vladimir Kramnik","Anatoly Karpov"],"modelGames":[{"white":"Vladimir Kramnik","black":"Garry Kasparov","year":2000,"note":"The Berlin Wall — Kramnik''s famous use of the Berlin Defense to neutralize Kasparov."}]}'::jsonb, 1, true),
  ('sicilian', 'Sicilian Defense', 'B20–B99', 'e4 Openings', 'black', 'Attacking', 'Advanced', '1200–2400+', 98, '15+ hrs', '#C9A84C', array['Attack', 'Sharp', 'Theory-heavy']::text[], 'The most popular response to 1.e4 at all levels of chess, the Sicilian creates immediate asymmetry and fighting chances for Black from move one.', 'Black avoids symmetrical structures, fighting for the center with the c-pawn instead of mirroring e5, leading to unbalanced, dynamic positions.', '{"mainIdeas":["Create an asymmetrical pawn structure for winning chances","Counter-attack on the queenside while White attacks the kingside","Use the half-open c-file for rook activity"],"strategicConcepts":["Race dynamics — both sides often attack on opposite wings","The Maroczy Bind structure in some lines","Piece activity over structural purity"],"tacticalThemes":["Exchange sacrifices on c3","Knight sacrifices on d5 or b5 for dark-square control","Opposite-side castling attacks"],"typicalPlans":["Black plays ...d6, ...Nf6, ...a6 and counter-attacks with ...b5","White often attacks with f3/g4/h4 in the Najdorf and similar lines","Central breaks with ...d5 at the right moment equalize"],"pieceDevelopment":"Black develops flexibly with Nf6, d6, and delays committing the king''s bishop.","pawnStructures":"Highly asymmetric — White typically has central majority, Black has queenside pawn majority.","importantSquares":["d5 (key outpost for White)","c3/d4 (central tension)","b5 (Black''s expansion square)"],"typicalSacrifices":"Bxb5/Nxb5 sacrifices to break open Black''s queenside; Rxc3 exchange sacrifices for dark-square domination.","commonMistakes":["Castling too early into a prepared attack","Neglecting queenside counterplay","Moving the same piece repeatedly instead of completing development"],"moveOrderTricks":"Move order matters enormously — 2...d6 vs 2...Nc6 vs 2...e6 lead to entirely different systems.","transpositions":"The Sicilian has dozens of distinct systems (Najdorf, Dragon, Sveshnikov, Taimanov, etc.) often reachable via multiple move orders.","commonTraps":["The Magnus Smith Trap in the Najdorf if Black is careless with move order"],"opponentResponses":"White typically responds with the Open Sicilian (2.Nf3 and 3.d4) or closed systems (2.Nc3, c3-Sicilian).","famousPlayers":["Garry Kasparov","Bobby Fischer","Magnus Carlsen","Veselin Topalov"],"modelGames":[{"white":"Garry Kasparov","black":"Veselin Topalov","year":1999,"note":"Often called ''the greatest game ever played'' — a Sicilian Pirc hybrid showing deep calculation."}]}'::jsonb, 2, true),
  ('frenchdef', 'French Defense', 'C00–C19', 'e4 Openings', 'black', 'Solid', 'Intermediate', '1000–2000', 70, '5–7 hrs', '#C9A84C', array['Solid', 'Counterattacking']::text[], 'A solid, resilient defense to 1.e4 that has been a reliable weapon for World Champions including Botvinnik and Korchnoi.', 'Black accepts a temporarily cramped position in exchange for a solid pawn structure and long-term counterplay against White''s center.', '{"mainIdeas":["Challenge the center with ...d5 immediately","Accept short-term cramped pieces for structural solidity","Counter-attack the center with ...c5 and ...f6 breaks later"],"strategicConcepts":["The ''bad bishop'' problem on c8 and how to solve it","Pawn chain dynamics (attack the base, not the tip)","Closed center maneuvering"],"tacticalThemes":["Greek Gift sacrifices against the French king position","Exchange sacrifices on e3/f3 to open lines","Minority attacks on the queenside"],"typicalPlans":["Black plays ...c5 to attack the base of White''s pawn chain","Reroute the problematic c8 bishop via ...b6 and ...Ba6/Bb7","White often attacks with f4-f5 in advance structures"],"pieceDevelopment":"Black''s light-squared bishop is famously the ''problem piece'', often rerouted via b6/a6.","pawnStructures":"Classic pawn chain structures (e.g. White e5-d4 vs Black d5-c5) define strategic play.","importantSquares":["e5 (White''s space-gaining square)","f5 (key for both sides'' plans)","c5 (Black''s primary break)"],"typicalSacrifices":"Classic Bxh7+ sacrifices appear when Black castles too early without adequate defense.","commonMistakes":["Trading the dark-squared bishop without a plan","Castling kingside into a prepared attack","Neglecting the c5 break"],"moveOrderTricks":"2...d5 is nearly universal, but 3rd move choice (Nc3 vs Nd2 vs exd5) defines completely different middlegame types.","transpositions":"The Tarrasch (3.Nd2) can transpose to certain Advance lines depending on subsequent moves.","commonTraps":["Falling for early kingside attacks if development is neglected"],"opponentResponses":"White typically chooses between the Advance (3.e5), Exchange (3.exd5), Tarrasch (3.Nd2), or Classical (3.Nc3).","famousPlayers":["Mikhail Botvinnik","Viktor Korchnoi","Wesley So"],"modelGames":[{"white":"Viktor Korchnoi","black":"Anatoly Karpov","year":1978,"note":"A model demonstration of French Defense counterplay at the highest level."}]}'::jsonb, 3, true),
  ('carokann', 'Caro-Kann Defense', 'B10–B19', 'e4 Openings', 'black', 'Solid', 'Beginner', '800–1800', 65, '3–5 hrs', '#C9A84C', array['Solid', 'Low theory']::text[], 'Named after Horatio Caro and Marcus Kann, this defense has been a favorite of solid, positional players for over a century — including World Champions Capablanca and Karpov.', 'Black challenges the center with ...d5 while keeping the light-squared bishop active by developing it before playing ...e6.', '{"mainIdeas":["Solve the ''bad bishop'' problem early by developing Bc8 before ...e6","Build a solid pawn structure with minimal weaknesses","Aim for a comfortable middlegame or favorable endgame"],"strategicConcepts":["The importance of piece activity over the French''s structural similarity","Simple, low-theory plans suitable for club players","Endgame-oriented strategic thinking"],"tacticalThemes":["Exchange sacrifices are rare — this is a tactically quiet opening","Watch for central breaks with e5/e6 ideas"],"typicalPlans":["Develop Bc8 to f5 or g4 before playing ...e6","Trade pieces toward a favorable endgame","Counter-attack the center with ...c5 in some lines"],"pieceDevelopment":"Bc8-f5 (or g4) is the signature move, solving the bishop problem that plagues the French Defense.","pawnStructures":"Solid, often symmetric structures with few long-term weaknesses for Black.","importantSquares":["f5 (bishop development square)","d5 (central tension point)","e4 (key central square)"],"typicalSacrifices":"Rare in mainline Caro-Kann — this is a structurally solid, low-sacrifice opening.","commonMistakes":["Playing ...e6 before developing the bishop, falling into a ''bad French''","Passive piece placement"],"moveOrderTricks":"3...Bf5 (Classical) vs 3...dxe4 (the main line) lead to very different structures.","transpositions":"Some lines can transpose to Slav Defense structures.","commonTraps":[],"opponentResponses":"White typically plays the Advance (3.e5), Exchange (3.exd5), or Classical (3.Nc3 dxe4 4.Nxe4 Bf5) variations.","famousPlayers":["Anatoly Karpov","José Raúl Capablanca","Magnus Carlsen"],"modelGames":[{"white":"Anatoly Karpov","black":"Garry Kasparov","year":1991,"note":"A model demonstration of Caro-Kann solidity at the World Championship level."}]}'::jsonb, 4, true),
  ('qgd', 'Queen''s Gambit Declined', 'D06–D69', 'd4 Openings', 'black', 'Solid', 'Intermediate', '1200–2200', 75, '6–8 hrs', '#60a5fa', array['Solid', 'Classical']::text[], 'One of the most respected and analyzed defenses in chess history, played by virtually every World Champion since Steinitz.', 'Black declines the gambit pawn, maintaining a solid central presence and aiming for a sound structural game.', '{"mainIdeas":["Maintain central tension rather than grabbing the c4 pawn","Solve piece development methodically","Aim for either an equal middlegame or favorable structural endgame"],"strategicConcepts":["The Carlsbad structure and minority attacks","The ''IQP'' (isolated queen''s pawn) positions in some exchange lines","Classical piece development principles"],"tacticalThemes":["Minority attack breakthroughs (b4-b5)","Central pawn breaks with ...c5 or ...e5"],"typicalPlans":["White often employs the minority attack (b4-b5) in Exchange Variation structures","Black counters with central or kingside play","Piece activity battles in symmetric structures"],"pieceDevelopment":"Classical development: Nf6, e6, Be7, O-O — solid and principled.","pawnStructures":"The Carlsbad structure (after cxd5 exd5) is the defining structural theme of many QGD lines.","importantSquares":["c5/c4 (key central squares)","e5 (central break point for Black)"],"typicalSacrifices":"Rare — this is primarily a strategic, maneuvering opening rather than a tactical one.","commonMistakes":["Misjudging when to release central tension","Passive piece placement in closed structures"],"moveOrderTricks":"Move order can transpose between QGD, Slav, and Semi-Slav systems depending on early choices.","transpositions":"Highly transpositional — can reach Catalan, Slav, or Semi-Slav structures.","commonTraps":[],"opponentResponses":"White typically chooses between the Exchange Variation, Catalan setups, or the main line with Bg5.","famousPlayers":["José Raúl Capablanca","Anatoly Karpov","Vladimir Kramnik"],"modelGames":[{"white":"Anatoly Karpov","black":"Viktor Korchnoi","year":1978,"note":"A model demonstration of minority attack technique in the Exchange QGD."}]}'::jsonb, 5, true),
  ('kid', 'King''s Indian Defense', 'E60–E99', 'd4 Openings', 'black', 'Attacking', 'Advanced', '1400–2400+', 80, '10+ hrs', '#60a5fa', array['Attack', 'Sharp', 'Theory-heavy']::text[], 'Popularized in the mid-20th century, the King''s Indian became the defense of choice for attacking players like Kasparov, offering dynamic counterplay against White''s central space.', 'Black allows White a big pawn center, then strikes back with thematic pawn breaks and a powerful kingside attack.', '{"mainIdeas":["Allow White central space temporarily","Fianchetto the dark-squared bishop for long-diagonal influence","Strike back with ...e5 or ...c5 pawn breaks"],"strategicConcepts":["Opposite-wing play — White expands queenside, Black attacks kingside","The importance of pawn breaks at the right moment","Piece activity over structural concerns"],"tacticalThemes":["Kingside pawn storms with ...f5-f4-g4","Knight sacrifices on key central or kingside squares","Exchange sacrifices to open lines"],"typicalPlans":["Black plays ...e5 (Classical) or ...c5 (Benoni-style) to challenge the center","Kingside expansion with ...f5 in closed structures","White expands queenside with c5/b4 in race scenarios"],"pieceDevelopment":"g6/Bg7 fianchetto is the defining feature, followed by O-O, d6, Nbd7.","pawnStructures":"Highly dynamic — can become closed (after d5) leading to opposite-wing races, or open with central tension.","importantSquares":["e4/e5 (central break points)","f5 (kingside attack square)","d5 (White''s space advantage)"],"typicalSacrifices":"Classic Nf4/Nh4-style knight sacrifices on g2/h3 to open the king; exchange sacrifices on c3 in Benoni-related structures.","commonMistakes":["Playing ...e5 or ...c5 prematurely without proper preparation","Misjudging the race dynamics on opposite wings"],"moveOrderTricks":"Move order matters: 1.d4 Nf6 2.c4 g6 can also transpose from English or Réti openings.","transpositions":"Can transpose into Grünfeld structures depending on early move order choices.","commonTraps":[],"opponentResponses":"White typically plays the Classical (Be2/Nf3), Sämisch (f3/Be3), or Four Pawns Attack systems.","famousPlayers":["Garry Kasparov","Bobby Fischer","Hikaru Nakamura"],"modelGames":[{"white":"Garry Kasparov","black":"Veselin Topalov","year":1996,"note":"A demonstration of King''s Indian dynamism at the highest level."}]}'::jsonb, 6, true),
  ('london', 'London System', 'D02', 'd4 Openings', 'white', 'Solid', 'Beginner', '600–1800', 88, '2–3 hrs', '#60a5fa', array['Solid', 'Low theory', 'System opening']::text[], 'Gained massive popularity in the 21st century as a low-theory, high-practicality system suitable for players of all levels, championed by players like Magnus Carlsen in rapid/blitz formats.', 'White builds a consistent pawn-and-piece setup (d4, Nf3, Bf4, e3, Bd3, Nbd2, O-O) regardless of Black''s response, minimizing the need for memorized theory.', '{"mainIdeas":["Build a flexible, solid setup independent of Black''s choices","Develop the bishop to f4 before playing e3 (avoiding the bad bishop)","Aim for a small but lasting structural edge"],"strategicConcepts":["System-based play over deep theoretical lines","Practical decision-making over memorization","Solid, low-risk structures suitable for all time controls"],"tacticalThemes":["Occasional Ne5 outposts with kingside attacking chances","Bxh7 sacrifices in some sharper lines after castling"],"typicalPlans":["Develop Bf4, e3, Bd3/Be2, Nbd2, O-O, then decide on c3 or c4 based on Black''s setup","Aim for central breaks with e4 once fully developed","Use the f4-bishop''s diagonal for long-term pressure"],"pieceDevelopment":"Bf4 BEFORE e3 is critical — this avoids the bishop being blocked by its own pawn.","pawnStructures":"Flexible — White often maintains the option of c3 (solid) or c4 (more ambitious) based on Black''s setup.","importantSquares":["e5 (key outpost for White''s knight)","f4 (bishop development)"],"typicalSacrifices":"Occasional Bxh7+ ideas if Black castles into a vulnerable position.","commonMistakes":["Playing e3 before developing the bishop to f4","Being too passive and allowing Black full equality"],"moveOrderTricks":"Highly flexible move order — works against almost any Black setup with minimal adjustment.","transpositions":"Can transpose to Colle System or Stonewall structures in some lines.","commonTraps":[],"opponentResponses":"Black can respond with virtually any setup — ...d5, ...Nf6, ...g6, etc. The London''s strength is its flexibility.","famousPlayers":["Magnus Carlsen","Gata Kamsky","Many club-level players worldwide"],"modelGames":[{"white":"Magnus Carlsen","black":"Various Opponents","year":2019,"note":"Carlsen revitalized the London System''s reputation with strong practical results."}]}'::jsonb, 7, true),
  ('english', 'English Opening', 'A10–A39', 'Flank Openings', 'white', 'Positional', 'Intermediate', '1200–2200', 60, '8+ hrs', '#4ade80', array['Positional', 'Flexible']::text[], 'Named after English champion Howard Staunton, this flank opening offers maximum flexibility and has been a favorite of positional masters for generations.', 'White claims the center from the flank with c4, keeping maximum flexibility to transpose into many different structures.', '{"mainIdeas":["Control d5 from the flank rather than occupying the center directly","Maintain flexibility to transpose into Queen''s Gambit, King''s Indian, or Réti structures","Symmetric or asymmetric pawn structure battles"],"strategicConcepts":["Hypermodern central control principles","Maximum transpositional flexibility","Reversed Sicilian structures in symmetric lines"],"tacticalThemes":["Central breaks with d4 at the optimal moment","Knight outposts on d5 in many structures"],"typicalPlans":["Develop g3/Bg2 for long-diagonal pressure","Play for central breaks with d4 once fully developed","Use flexible piece placement to react to Black''s setup"],"pieceDevelopment":"Nc3, g3, Bg2 is a very common setup, fianchettoing for long-term central influence.","pawnStructures":"Highly variable — can become symmetric (Reversed Sicilian) or asymmetric depending on Black''s response.","importantSquares":["d5 (central control point)","e4 (secondary central square)"],"typicalSacrifices":"Rare — this is primarily a strategic, structure-based opening.","commonMistakes":["Playing too passively and allowing Black full central equality","Misjudging transposition opportunities"],"moveOrderTricks":"Extremely transpositional — can reach Queen''s Gambit, King''s Indian, or pure English structures.","transpositions":"One of the most transpositional openings in chess — move order knowledge is crucial.","commonTraps":[],"opponentResponses":"Black often responds symmetrically with ...c5 (Reversed Sicilian) or with ...e5/...Nf6 setups.","famousPlayers":["Bobby Fischer","Vladimir Kramnik","Magnus Carlsen"],"modelGames":[{"white":"Bobby Fischer","black":"Boris Spassky","year":1972,"note":"Fischer''s famous use of the English in the World Championship match."}]}'::jsonb, 8, true)
on conflict (id) do update set
  name = excluded.name,
  eco = excluded.eco,
  opening_group = excluded.opening_group,
  for_side = excluded.for_side,
  style = excluded.style,
  difficulty = excluded.difficulty,
  rating_band = excluded.rating_band,
  popularity = excluded.popularity,
  study_time = excluded.study_time,
  accent_colour = excluded.accent_colour,
  tags = excluded.tags,
  history = excluded.history,
  overview = excluded.overview,
  editorial = excluded.editorial,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published
;

insert into public.opening_variations (id, opening_id, name, difficulty, plans, traps, sort_order) values
  ('giuoco-piano', 'italian', 'Giuoco Piano', 'Beginner', 'After d4, White often follows with O-O and pressure on the center; Black typically counters with ...exd4 and ...d5.', array['If Black plays carelessly, Ng5 ideas targeting f7 can be very strong.']::text[], 0),
  ('two-knights', 'italian', 'Two Knights Defense', 'Intermediate', 'This leads to extremely sharp theoretical lines including the Fried Liver Attack and Lolli Attack.', array['The Fried Liver Attack: Nxf7!? Kxf7 Qf3+ leads to a dangerous attack for a piece.']::text[], 1),
  ('morphy-defense', 'ruylopez', 'Morphy Defense (3...a6)', 'Advanced', 'Leads to the Closed Ruy López after ...Be7, with deep maneuvering battles on both wings.', array['Noah''s Ark Trap: careless bishop placement can get trapped by ...b5 and ...c4.']::text[], 0),
  ('berlin-defense', 'ruylopez', 'Berlin Defense (3...Nf6)', 'Advanced', 'Often leads to an early queen trade and a technical endgame where Black''s structure is surprisingly resilient.', '{}'::text[], 1),
  ('najdorf', 'sicilian', 'Najdorf Variation', 'Advanced', 'Black often follows with ...e5, ...Be7, and queenside expansion with ...b5; White frequently attacks with f3/Be3/Qd2 setups (the English Attack).', array['The Poisoned Pawn Variation (6...Qb6) leads to extremely sharp, well-analyzed theoretical battles.']::text[], 0),
  ('dragon', 'sicilian', 'Dragon Variation', 'Advanced', 'Leads to the famous ''Opposite Side Castling'' races — White attacks with h4-h5, Black counters on the queenside.', array['The Yugoslav Attack is the critical test — precise move order knowledge is essential for both sides.']::text[], 1),
  ('advance-french', 'frenchdef', 'Advance Variation', 'Intermediate', 'Black aims to undermine d4 with ...c5 and ...Nc6/Qb6 pressure; White seeks kingside attacking chances with the extra space.', '{}'::text[], 0),
  ('classical-caro', 'carokann', 'Classical Variation', 'Beginner', 'Black continues with ...e6, ...Nf6/Nd7, and aims for a solid, comfortable middlegame.', '{}'::text[], 0),
  ('exchange-qgd', 'qgd', 'Exchange Variation', 'Intermediate', 'White typically launches a minority attack with b4-b5 to create weaknesses in Black''s queenside structure.', '{}'::text[], 0),
  ('classical-kid', 'kid', 'Classical Variation', 'Advanced', 'Black follows with ...e5, leading to either central tension or a closed structure where Black attacks with ...f5.', '{}'::text[], 0),
  ('main-london', 'london', 'Main Line Setup', 'Beginner', 'White continues with Bd3, Nbd2, O-O, c3, and looks for central or kingside chances depending on Black''s setup.', '{}'::text[], 0),
  ('symmetrical-english', 'english', 'Symmetrical Variation', 'Intermediate', 'Both sides fianchetto and battle for the d5/d4 squares; subtle move-order nuances determine who gets the first meaningful imbalance.', '{}'::text[], 0)
on conflict (id) do update set
  opening_id = excluded.opening_id,
  name = excluded.name,
  difficulty = excluded.difficulty,
  plans = excluded.plans,
  traps = excluded.traps,
  sort_order = excluded.sort_order
;

insert into public.opening_variation_moves (variation_id, ply, san, explanation) values
  ('giuoco-piano', 0, 'e4', 'Stakes a claim in the center and opens lines for the bishop and queen.'),
  ('giuoco-piano', 1, 'e5', 'Black mirrors White''s central claim symmetrically.'),
  ('giuoco-piano', 2, 'Nf3', 'Develops with tempo, attacking the e5 pawn.'),
  ('giuoco-piano', 3, 'Nc6', 'Defends e5 and develops naturally.'),
  ('giuoco-piano', 4, 'Bc4', 'The Italian bishop eyes f7, the weakest square in Black''s camp.'),
  ('giuoco-piano', 5, 'Bc5', 'Black mirrors the bishop development — the ''Giuoco Piano'' (quiet game).'),
  ('giuoco-piano', 6, 'c3', 'Prepares d4 to build a strong pawn center, a key Italian Game plan.'),
  ('giuoco-piano', 7, 'Nf6', 'Black develops and attacks e4.'),
  ('giuoco-piano', 8, 'd4', 'White strikes in the center, the thematic Italian break.'),
  ('two-knights', 0, 'e4', 'Central control.'),
  ('two-knights', 1, 'e5', 'Symmetrical response.'),
  ('two-knights', 2, 'Nf3', 'Develops, attacks e5.'),
  ('two-knights', 3, 'Nc6', 'Defends e5.'),
  ('two-knights', 4, 'Bc4', 'Targets f7.'),
  ('two-knights', 5, 'Nf6', 'Black counterattacks e4 instead of mirroring with ...Bc5 — the Two Knights.'),
  ('two-knights', 6, 'Ng5', 'The sharp main line, directly attacking f7 and threatening Nxf7.'),
  ('two-knights', 7, 'd5', 'Black''s best try, counterattacking the bishop and opening lines.'),
  ('two-knights', 8, 'exd5', 'White grabs the pawn, keeping the attack alive.'),
  ('morphy-defense', 0, 'e4', 'Central control.'),
  ('morphy-defense', 1, 'e5', 'Symmetrical reply.'),
  ('morphy-defense', 2, 'Nf3', 'Attacks e5.'),
  ('morphy-defense', 3, 'Nc6', 'Defends e5.'),
  ('morphy-defense', 4, 'Bb5', 'The Ruy López pin — indirectly pressures e5 via the knight.'),
  ('morphy-defense', 5, 'a6', 'The main line — Black asks the bishop a question immediately.'),
  ('morphy-defense', 6, 'Ba4', 'White retreats, maintaining the pin (the most popular choice).'),
  ('morphy-defense', 7, 'Nf6', 'Black develops and counterattacks e4.'),
  ('morphy-defense', 8, 'O-O', 'White castles for safety, a thematic move in nearly all Ruy lines.'),
  ('berlin-defense', 0, 'e4', 'Central control.'),
  ('berlin-defense', 1, 'e5', 'Symmetrical reply.'),
  ('berlin-defense', 2, 'Nf3', 'Attacks e5.'),
  ('berlin-defense', 3, 'Nc6', 'Defends e5.'),
  ('berlin-defense', 4, 'Bb5', 'The pin.'),
  ('berlin-defense', 5, 'Nf6', 'Counterattacks e4 immediately — the Berlin Defense, famous for its solid endgame structure.'),
  ('berlin-defense', 6, 'O-O', 'White castles, preparing to deal with the e4 threat.'),
  ('berlin-defense', 7, 'Nxe4', 'Black grabs the pawn — this leads to the famous ''Berlin Wall'' endgame after further trades.'),
  ('najdorf', 0, 'e4', 'White stakes central claim.'),
  ('najdorf', 1, 'c5', 'The Sicilian — Black avoids symmetry, fighting for the center asymmetrically.'),
  ('najdorf', 2, 'Nf3', 'Develops, prepares d4.'),
  ('najdorf', 3, 'd6', 'Supports a future ...e5 and prepares flexible development.'),
  ('najdorf', 4, 'd4', 'White opens the center — the Open Sicilian.'),
  ('najdorf', 5, 'cxd4', 'Black captures, opening the c-file.'),
  ('najdorf', 6, 'Nxd4', 'White recaptures, centralizing the knight.'),
  ('najdorf', 7, 'Nf6', 'Develops and attacks e4.'),
  ('najdorf', 8, 'Nc3', 'Defends e4 and develops.'),
  ('najdorf', 9, 'a6', 'The Najdorf move — prepares ...e5 or ...b5 while preventing Nb5/Bb5 ideas.'),
  ('dragon', 0, 'e4', 'Central claim.'),
  ('dragon', 1, 'c5', 'Sicilian Defense.'),
  ('dragon', 2, 'Nf3', 'Develops.'),
  ('dragon', 3, 'd6', 'Flexible setup.'),
  ('dragon', 4, 'd4', 'Opens the center.'),
  ('dragon', 5, 'cxd4', 'Captures.'),
  ('dragon', 6, 'Nxd4', 'Recaptures, centralizes.'),
  ('dragon', 7, 'Nf6', 'Develops, attacks e4.'),
  ('dragon', 8, 'Nc3', 'Defends e4.'),
  ('dragon', 9, 'g6', 'The Dragon — fianchettoes the bishop to g7 for long-diagonal pressure.'),
  ('advance-french', 0, 'e4', 'Central claim.'),
  ('advance-french', 1, 'e6', 'The French — prepares ...d5 without blocking the dark bishop yet.'),
  ('advance-french', 2, 'd4', 'Builds a big center.'),
  ('advance-french', 3, 'd5', 'Challenges the center immediately.'),
  ('advance-french', 4, 'e5', 'The Advance Variation — White locks the center, gaining space.'),
  ('advance-french', 5, 'c5', 'Black immediately attacks the base of White''s pawn chain (d4).'),
  ('classical-caro', 0, 'e4', 'Central claim.'),
  ('classical-caro', 1, 'c6', 'The Caro-Kann — prepares ...d5 with extra support.'),
  ('classical-caro', 2, 'd4', 'Builds the center.'),
  ('classical-caro', 3, 'd5', 'Challenges the center directly.'),
  ('classical-caro', 4, 'Nc3', 'Develops, defends e4.'),
  ('classical-caro', 5, 'dxe4', 'Black trades in the center.'),
  ('classical-caro', 6, 'Nxe4', 'White recaptures, centralizing the knight.'),
  ('classical-caro', 7, 'Bf5', 'The key Caro-Kann idea — developing the bishop BEFORE playing ...e6, avoiding the French''s bishop problem.'),
  ('exchange-qgd', 0, 'd4', 'Central claim.'),
  ('exchange-qgd', 1, 'd5', 'Black mirrors.'),
  ('exchange-qgd', 2, 'c4', 'The Queen''s Gambit — offers a pawn to gain central influence.'),
  ('exchange-qgd', 3, 'e6', 'Black declines the gambit, maintaining the center solidly.'),
  ('exchange-qgd', 4, 'Nc3', 'Develops, supports the center.'),
  ('exchange-qgd', 5, 'Nf6', 'Black develops symmetrically.'),
  ('exchange-qgd', 6, 'cxd5', 'The Exchange Variation — trades to create the Carlsbad structure.'),
  ('exchange-qgd', 7, 'exd5', 'Black recaptures, forming the famous Carlsbad pawn structure.'),
  ('classical-kid', 0, 'd4', 'Central claim.'),
  ('classical-kid', 1, 'Nf6', 'Develops, eyes e4.'),
  ('classical-kid', 2, 'c4', 'Expands further.'),
  ('classical-kid', 3, 'g6', 'The King''s Indian — prepares the Bg7 fianchetto.'),
  ('classical-kid', 4, 'Nc3', 'Develops, defends e4.'),
  ('classical-kid', 5, 'Bg7', 'Completes the fianchetto, eyeing the long diagonal.'),
  ('classical-kid', 6, 'e4', 'White builds a big center, the Classical main line.'),
  ('classical-kid', 7, 'd6', 'Black solidifies, preparing ...e5.'),
  ('classical-kid', 8, 'Nf3', 'Develops, defends e4 further.'),
  ('classical-kid', 9, 'O-O', 'Black castles, completing kingside development before the central break.'),
  ('main-london', 0, 'd4', 'Central claim.'),
  ('main-london', 1, 'd5', 'A common Black response (works similarly against most setups).'),
  ('main-london', 2, 'Nf3', 'Develops naturally.'),
  ('main-london', 3, 'Nf6', 'Black develops symmetrically.'),
  ('main-london', 4, 'Bf4', 'The key London move — develops the bishop BEFORE playing e3.'),
  ('main-london', 5, 'e6', 'Black continues development.'),
  ('main-london', 6, 'e3', 'Now White plays e3, with the bishop already safely developed outside the pawn chain.'),
  ('symmetrical-english', 0, 'c4', 'Claims central influence from the flank.'),
  ('symmetrical-english', 1, 'c5', 'Black mirrors symmetrically — the Symmetrical English.'),
  ('symmetrical-english', 2, 'Nc3', 'Develops, prepares central or kingside expansion.'),
  ('symmetrical-english', 3, 'Nc6', 'Black mirrors.'),
  ('symmetrical-english', 4, 'g3', 'Prepares the fianchetto for long-diagonal control.'),
  ('symmetrical-english', 5, 'g6', 'Black mirrors again, leading to a highly symmetric strategic battle.')
on conflict (variation_id, ply) do update set
  san = excluded.san,
  explanation = excluded.explanation
;


-- --------------------------------------------------------------------------
-- Puzzles
-- --------------------------------------------------------------------------

insert into public.puzzles (id, title, description, theme, rating, fen, solution, tags, is_daily, is_published) values
  ('potd', 'Puzzle of the Day', 'White finds the key developing move that prepares queenside castling while centralising the queen.', 'Development + Castle Safety', 1850, 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5', array['d1e2', 'e8g8']::text[], array['middlegame', 'strategy']::text[], true, true),
  ('f1', 'Fork Attack', 'White''s knight can launch a powerful fork — find the key move.', 'Knight Fork', 1050, 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4', array['f3g5']::text[], array['tactics', 'fork']::text[], false, true),
  ('f2', 'Pin to Win', 'Find the move that creates an absolute pin, winning material.', 'Absolute Pin', 1200, 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 2 8', array['d1b3']::text[], array['tactics', 'pin']::text[], false, true),
  ('f3', 'Discovered Check', 'Unleash a discovered attack that wins decisive material.', 'Discovered Attack', 1400, '2r3k1/5ppp/p7/1p6/3B4/1P6/P4PPP/4R1K1 w - - 0 28', array['d4b6']::text[], array['tactics', 'discovered']::text[], false, true),
  ('p1', 'Back Rank Mate', 'The classic back rank finish — White to move and checkmate in 1.', 'Back Rank Checkmate', 900, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', array['a1a8']::text[], array['checkmate', 'beginner']::text[], false, true),
  ('p2', 'Smothered Mate', 'A classic smothered mate pattern. White to move and deliver checkmate.', 'Smothered Mate', 1350, '6rk/6pp/8/8/8/8/6PP/5NRK w - - 0 1', array['f1h2', 'h8g8', 'h2f3', 'g8h8', 'f3g5', 'h8g8', 'g5f7']::text[], array['checkmate', 'knight']::text[], false, true),
  ('p3', 'Queen Sacrifice', 'A spectacular queen sacrifice leads to a decisive material gain.', 'Queen Sacrifice + Discovery', 1750, 'r4rk1/pp3ppp/2p5/4Pb2/2B5/q4N2/PP3PPP/2RQ1RK1 w - - 0 18', array['d1d8', 'f8d8', 'c1d1']::text[], array['tactics', 'sacrifice']::text[], false, true),
  ('p4', 'Zugzwang', 'Black must find the correct order to promote and win.', 'Pawn Promotion', 1600, '8/8/8/8/8/1k6/2p5/2K5 b - - 0 1', array['b3b2', 'c1d2', 'c2c1q']::text[], array['endgame', 'promotion']::text[], false, true),
  ('p5', 'Rook Endgame', 'Cut off the enemy king — a key technique in rook endgames.', 'Rook Endgame Technique', 1300, '8/R7/8/8/8/4k3/r7/4K3 w - - 0 1', array['a7a3', 'e3e4', 'a3a4']::text[], array['endgame', 'rook']::text[], false, true),
  ('p6', 'Italian Game Trap', 'Find the sharp tactical sequence that wins a pawn with tempo.', 'Opening Trap', 1100, 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', array['f3e5', 'c6e5', 'd1h5']::text[], array['opening', 'tactics']::text[], false, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  theme = excluded.theme,
  rating = excluded.rating,
  fen = excluded.fen,
  solution = excluded.solution,
  tags = excluded.tags,
  is_daily = excluded.is_daily,
  is_published = excluded.is_published
;


-- --------------------------------------------------------------------------
-- Classic games
-- --------------------------------------------------------------------------

insert into public.classic_games (id, white_player, black_player, white_rating, black_rating, event, played_year, result, opening_name, eco, description, pgn, is_published) values
  (1, 'Garry Kasparov', 'Anatoly Karpov', 2800, 2720, 'World Championship', 1985, '1-0', 'Sicilian Defence', 'B44', 'Game 16 of the 1985 World Championship — Kasparov''s masterpiece that wrested the title from Karpov. A sacrificial attack of breathtaking precision.', '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1', true),
  (2, 'Bobby Fischer', 'Boris Spassky', 2785, 2660, 'World Championship Game 6', 1972, '1-0', 'Queen''s Gambit Declined', 'D59', 'Considered by many the greatest game ever played. Fischer''s positional mastery left Spassky so impressed he applauded his own defeat.', '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0', true),
  (3, 'Mikhail Tal', 'Vasily Smyslov', 2670, 2640, 'Candidates Tournament', 1959, '1-0', 'Caro-Kann Defence', 'B10', 'Tal''s sacrificial genius on full display. An exchange sacrifice that opened lines no engine could have predicted, earning him the Candidates title.', '1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 Nc6 6. Bg5 dxc4 7. d5 Ne5 8. Qd4 Nd3+ 9. Bxd3 cxd3 10. Nf3 g6 11. O-O-O Bg7 12. Qxd3 O-O 13. Rhe1 Ng4 14. d6 exd6 15. h3 Nf6 16. Ng5 d5 17. Bxf6 Bxf6 18. Nge4 dxe4 19. Nxe4 Be7 20. Nf6+ Bxf6 21. Qxd8 Rxd8 22. Rxd8+ Rxd8 23. Rxe7 Rd1+ 24. Kc2 Rd2+ 25. Kb3 Rxf2 26. g4 Rd2 27. h4 h5 28. gxh5 gxh5 29. Kc3 Rd8 30. Kd4 Bd7 31. Ke5 Bc6 32. Kf6 Rd6+ 33. Kf7 Rd7+ 34. Ke6 Rxe7+ 35. Kxe7 1-0', true),
  (4, 'José Raúl Capablanca', 'Frank Marshall', 2725, 2580, 'New York', 1918, '1-0', 'Marshall Attack', 'C89', 'Marshall unleashed his prepared gambit against Capablanca, but Capa''s defensive genius neutralised the attack and converted with clinical perfection.', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d4 Bd6 13. Re1 Qh4 14. g3 Qh3 15. Be3 Bg4 16. Qd3 Rae8 17. Nd2 Re6 18. Qf1 Qh5 19. a4 bxa4 20. Bxa4 Nxe3 21. Rxe3 Rxe3 22. fxe3 Re8 23. Nf3 Be7 24. e4 Bh3 25. Qd3 Bg4 26. e5 Bxf3 27. Qxf3 Qxf3 28. Rxf3 f5 29. exf6 Bxf6 30. Rxf6 gxf6 31. Bc2 Kf7 32. Bd3 Re3 33. Bxh7 Rxg3+ 34. hxg3 1-0', true),
  (5, 'Magnus Carlsen', 'Viswanathan Anand', 2870, 2775, 'World Championship Game 5', 2013, '1-0', 'Nimzo-Indian Defence', 'E25', 'Carlsen''s endgame technique in this game was practically flawless. He outplayed the reigning champion in a rook endgame that seemed drawable.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 Nxd5 8. dxc5 f5 9. Qc2 Nd7 10. e4 fxe4 11. fxe4 N5f6 12. c4 O-O 13. Be2 e5 14. Bg5 Qe8 15. Bxf6 Nxf6 16. Nf3 Bg4 17. Nd2 Qe7 18. O-O Bxe2 19. Qxe2 a5 20. Nb3 a4 21. Nd2 Rac8 22. Rac1 Qe6 23. Qd3 b5 24. cxb5 Rxc1 25. Rxc1 Qxb3 26. Qxb3+ axb3 27. Rc7 Rxf2 28. Kxf2 Nd7 29. Rxd7 b2 30. Rb7 b1=Q 31. Rxb1 1-0', true),
  (6, 'Anatoly Karpov', 'Garry Kasparov', 2700, 2715, 'World Championship Game 9', 1984, '1-0', 'Nimzo-Indian Defence', 'E21', 'Karpov demonstrates his legendary positional squeeze, restricting Kasparov''s pieces until there was simply no room to breathe.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 O-O 5. Bg5 c5 6. e3 cxd4 7. exd4 d5 8. Rc1 dxc4 9. Bxc4 Nc6 10. O-O Be7 11. Re1 h6 12. Bh4 Nd5 13. Bg3 Nxc3 14. bxc3 b6 15. Bd3 Bb7 16. Qe2 g6 17. Bh4 Bxh4 18. Nxh4 Qd6 19. Nf3 Ne7 20. c4 Rfd8 21. d5 exd5 22. cxd5 Bxd5 23. Bxg6 Ng8 24. Bh5 fxg6 25. Qxe8+ 1-0', true),
  (7, 'Vladimir Kramnik', 'Garry Kasparov', 2770, 2849, 'World Championship Game 2', 2000, '1-0', 'Berlin Defence', 'C67', 'Kramnik''s Berlin Wall revolutionised chess. This game showed the world that Kasparov''s attacking style could be neutralised with precise defence.', '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 h5 11. Bf4 Be7 12. Rad1 Be6 13. Ng5 Bxg5 14. Bxg5 Rh6 15. Be3 Nxe3 16. fxe3 b6 17. Kf2 Kf8 18. Ke1 c5 19. Nd5 Bxd5 20. Rxd5 Ke7 21. Rfd1 Rh7 22. e4 c6 23. Rd6 Rc7 24. Rb6 Kd7 25. Ra6 c4 26. Rxa7 Rxa7 27. Rd1+ Rd7 28. Rxa7 Rxa7 29. e6+ fxe6 30. e5 Rc7 31. b4 cxb3 32. cxb3 Rc3 33. Ke2 Rxb3 34. Kf2 c5 35. Ke2 c4 36. a4 c3 37. a5 bxa5 38. Kd3 Rb2 39. Kxc3 Rxg2 40. Kb4 Kc6 41. Ka3 Rg5 42. Kb4 1/2-1/2', true),
  (8, 'Viswanathan Anand', 'Magnus Carlsen', 2780, 2843, 'World Championship Game 9', 2012, '1-0', 'Catalan Opening', 'E05', 'Anand''s technical masterpiece. Converting a tiny endgame advantage through perfect technique, showing why he was World Champion.', '1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Qc2 a6 8. a4 Bd7 9. Qxc4 Bc6 10. Bg5 Bd5 11. Qd3 Nbd7 12. Nc3 c5 13. Bxf6 Nxf6 14. dxc5 Bxc5 15. Rfd1 Qb6 16. Rab1 Bxf3 17. Bxf3 Rfd8 18. b4 Bxb4 19. Nb5 axb5 20. axb5 Rd5 21. b6 Rb8 22. Qa3 Bd2 23. Rb2 Bc3 24. Qa6 Rxb6 25. Rxb6 Qxb6 26. Qc8+ Rxc8 1-0', true),
  (9, 'Hikaru Nakamura', 'Magnus Carlsen', 2758, 2863, 'Tata Steel', 2012, '1-0', 'Dutch Defence', 'A90', 'Nakamura''s tactical brilliance overwhelms Carlsen''s defence in this explosive game from Wijk aan Zee. A sharp, uncompromising battle.', '1. d4 f5 2. g3 Nf6 3. Bg2 e6 4. c4 c6 5. Nh3 d5 6. Qb3 Qb6 7. Bf4 Be7 8. Nf2 O-O 9. O-O Nbd7 10. Qxb6 Nxb6 11. b3 a5 12. e3 Ne4 13. Nxe4 fxe4 14. Nd2 Rf7 15. Rfe1 g5 16. Bg5 Bxg5 17. f4 exf3 18. Nxf3 Bh6 19. Nd2 Bg7 20. Nf3 Bh6 21. cxd5 cxd5 22. Rec1 Rg7 23. Rc2 Kf7 24. Rac1 g4 25. Nh4 Rg5 26. h3 gxh3 27. Bxh3 Bg4 28. Rc7+ Ke8 29. Bxg4 Rxg4 30. Nf3 Bf8 31. R1c6 1-0', true),
  (10, 'Paul Morphy', 'Duke of Brunswick', null, null, 'Paris Opera', 1858, '1-0', 'Philidor Defence', 'C41', 'The Opera Game — perhaps the most famous chess game ever. Morphy''s brilliant piece play and sacrifices in just 17 moves created a masterpiece studied by every chess student.', '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0', true),
  (11, 'Garry Kasparov', 'Veselin Topalov', 2812, 2700, 'Hoogeveen', 1999, '1-0', 'Pirc Defence', 'B07', 'Dubbed ''the greatest chess game ever'' by many experts. Kasparov''s 44-move masterpiece involving a stunning rook march that defies conventional logic.', '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0', true),
  (12, 'Bobby Fischer', 'Robert Byrne', 2780, 2570, 'US Championship', 1963, '1-0', 'Grünfeld Defence', 'D71', 'Fischer''s ''Game of the Century'' runner-up. A stunning queen sacrifice on move 11 left analysts speechless and cemented Fischer''s legend.', '1. d4 Nf6 2. c4 g6 3. g3 c6 4. Bg2 d5 5. cxd5 cxd5 6. Nc3 Bg7 7. e3 O-O 8. Nge2 Nc6 9. O-O b6 10. b3 Ba6 11. Ba3 Re8 12. Qd2 e5 13. dxe5 Nxe5 14. Rfd1 Nd3 15. Qc2 Nxf2 16. Kxf2 Ng4+ 17. Kg1 Nxe3 18. Qd2 Nxg2 19. Kxg2 d4 20. Nxd4 Bb7+ 21. Kf1 Qd7 0-1', true),
  (13, 'Mikhail Tal', 'Mikhail Botvinnik', 2600, 2700, 'World Championship Game 6', 1960, '1-0', 'Caro-Kann Defence', 'B12', 'The Magician from Riga sacrifices a piece on move 9 in a position that defied analysis. Botvinnik was overwhelmed by the chaos Tal deliberately created.', '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Bc4 Ngf6 6. Ng5 e6 7. Qe2 Nb6 8. Bd3 h6 9. N5f3 c5 10. dxc5 Bxc5 11. Ne5 Nbd7 12. Ngf3 O-O 13. Bf4 Nxe5 14. Bxe5 Nd7 15. Bf4 Nf6 16. O-O b6 17. Ne5 Bb7 18. Qe3 Qc7 19. Bg3 Rfe8 20. Rae1 Rad8 21. Bb5 Re7 22. c4 g6 23. Ng4 Nxg4 24. Qxg4 Bg7 25. Re3 Rde8 26. Rfe1 Qd6 27. Kf1 e5 28. Rxe5 Rxe5 29. Rxe5 Rxe5 30. Qxg6 Re1+ 31. Ke2 Re6 32. Qh7+ Kf8 33. Bg7+ Ke7 34. Qxg7+ Ke8 35. Bxe6 fxe6 36. Bh8 Kd7 37. Qf7+ Kd6 38. Bf6 1-0', true),
  (14, 'Tigran Petrosian', 'Spassky Boris', 2640, 2660, 'World Championship Game 10', 1966, '1-0', 'English Opening', 'A28', 'Iron Tigran''s prophylactic mastery. Petrosian foresaw every threat and neutralised each one before slowly strangling Spassky into submission.', '1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 exd4 5. Nxd4 Bb4 6. g3 O-O 7. Bg2 Re8 8. O-O Bxc3 9. bxc3 d5 10. cxd5 Qxd5 11. c4 Qa5 12. Nxc6 bxc6 13. Bd2 Qa6 14. Qa4 Qxc4 15. Bf4 Be6 16. Rfc1 Qb5 17. Qa3 Rac8 18. Bxc7 Qb7 19. Bg2 Qa6 20. Qb2 Nd5 21. Qb6 Qxb6 22. Bxb6 Nb4 23. Rb1 Na6 24. Bd4 Nc7 25. Rb6 Rcd8 26. Rab1 Ne8 27. Rb8 Rxb8 28. Rxb8 Rxb8 29. Bxb8 Nd6 30. Ba7 Nc4 31. Bc5 g6 32. a4 Kf8 33. a5 Ke7 34. Kf1 Kd7 35. Ke1 Kc7 36. Kd1 Kb7 37. Kc2 Ka6 38. f3 1-0', true),
  (15, 'Magnus Carlsen', 'Sergey Karjakin', 2853, 2769, 'World Championship Game 8', 2016, '1-0', 'Berlin Defence', 'C65', 'The game that broke Karjakin. Carlsen''s endgame grinding at its finest — converting a seemingly drawn rook endgame with inhuman precision.', '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O Re8 7. Re1 a6 8. Ba4 b5 9. Bb3 d6 10. Bg5 Be6 11. Bxe6 Rxe6 12. Nbd2 d5 13. exd5 Nxd5 14. Ne4 Bb6 15. a4 bxa4 16. Rxa4 Ndb4 17. cxb4 Nxb4 18. Bxf6 Qxf6 19. Rxe5 Rxe5 20. Nxe5 Qxe5 21. d4 Qf5 22. Ra3 Nd5 23. Rd3 Re8 24. Rxd5 Qxd5 25. Qxd5 c6 26. Qb3 Re2 27. Nf6+ gxf6 28. Qxe2 Bxd4 29. Qb2 Bg7 30. b4 1-0', true),
  (16, 'Garry Kasparov', 'Nigel Short', 2805, 2655, 'World Championship', 1993, '1-0', 'King''s Indian Attack', 'A07', 'Kasparov overwhelms Short with a devastating king-side attack in their controversial World Championship match outside FIDE.', '1. Nf3 Nf6 2. g3 d5 3. Bg2 c6 4. O-O Bg4 5. d3 Nbd7 6. Nbd2 e6 7. e4 Be7 8. Qe1 O-O 9. e5 Ne8 10. h4 Bxf3 11. Nxf3 Nc7 12. Bf4 Nb5 13. g4 h6 14. h5 a5 15. Ng5 hxg5 16. Bxg5 Bxg5 17. Qxg5 Nb6 18. g5 a4 19. Qh6 Nd4 20. Rf4 Nf3+ 21. Rxf3 Nd7 22. Raf1 b5 23. Rf6 Nxf6 24. gxf6 g6 25. hxg6 fxg6 26. Rxf8+ Qxf8 27. Qxg6+ Qg7 28. f7+ Kh8 29. Qh6# 1-0', true),
  (17, 'Judit Polgar', 'Garry Kasparov', 2590, 2812, 'Moscow', 1994, '0-1', 'Sicilian Defence', 'B80', 'Kasparov at his very best — demolishing Polgar''s aggressive play and counterattacking with precision. A battle of legends.', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. Be2 Qc7 8. O-O b5 9. a3 Bb7 10. f4 Nc6 11. g4 Nd7 12. g5 Nxd4 13. Qxd4 e5 14. fxe5 dxe5 15. Qd2 Nb6 16. Nd5 Nxd5 17. exd5 Bd6 18. Bc5 Bxc5+ 19. Qxc5 Rd8 20. c4 bxc4 21. Qxc4 O-O 22. d6 Qb6+ 23. Kh1 Qxd6 24. Rad1 Qc6 25. Qxc6 Bxc6 26. Rd6 Bb5 27. Rfd1 Rxd6 28. Rxd6 Rc8 29. Rd7 Bxe2 0-1', true),
  (18, 'Alireza Firouzja', 'Magnus Carlsen', 2749, 2857, 'Tata Steel', 2021, '0-1', 'Sicilian Najdorf', 'B97', 'Carlsen''s precise dismantling of Firouzja''s ambitious play. The World Champion demonstrates perfect handling of a complex middlegame.', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 dxe5 11. fxe5 Nfd7 12. Bc4 Bb4 13. O-O Bxc3 14. Qxc3 Qxc3 15. Ne6+ Kf8 16. Nc7+ Ke7 17. Nd5+ exd5 18. Bxd5 Ra7 19. Rxb7 Rxb7 20. Bxb7 Bb7 21. Rf7+ Ke6 22. Bxg7 Rg8 23. Bh6 Nxe5 24. Bf4 Nbd7 0-1', true),
  (19, 'Fabiano Caruana', 'Magnus Carlsen', 2832, 2835, 'World Championship', 2018, '1/2-1/2', 'Ruy Lopez', 'C88', 'The most famous draw in recent chess history. Caruana had a potentially winning position but couldn''t convert against Carlsen''s defensive resourcefulness.', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. h3 Bb7 9. d3 Re8 10. a3 h6 11. Nbd2 Bf8 12. Nf1 Nd4 13. Nxd4 exd4 14. f3 c5 15. Ng3 Nd7 16. Bd2 Ne5 17. b4 cxb4 18. axb4 a5 19. bxa5 Rxa5 20. Qb1 Qa8 21. Rf1 Ra2 22. Qb2 Ra5 23. Qb1 Ra2 24. Qb2 Ra5 1/2-1/2', true),
  (20, 'Magnus Carlsen', 'Fabiano Caruana', 2845, 2828, 'Sinquefield Cup', 2014, '1-0', 'Nimzo-Indian Defence', 'E32', 'One of Carlsen''s finest victories. Slowly grinding down the world''s best prepared player in a display of endgame dominance.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6 7. Bg5 Bb7 8. e3 d6 9. Nf3 Nbd7 10. Be2 h6 11. Bh4 c5 12. dxc5 dxc5 13. O-O Qe7 14. Nd2 e5 15. Bg3 Rfd8 16. Rfd1 Nf8 17. b4 cxb4 18. axb4 Rxd1+ 19. Rxd1 Rd8 20. Rxd8+ Qxd8 21. Nb3 Ne6 22. Nd2 g5 23. Bxg5 hxg5 24. Qxg5+ Kf8 25. Qh6+ Ke7 26. f4 exf4 27. exf4 Nd4 28. Bd3 Qc7 29. f5 Qe5 30. Qh7 Nd7 31. c5 bxc5 32. bxc5 Qxc5+ 33. Kh1 Qe5 34. Qg7 Qf4 35. Ne4 Ne5 36. Qg8 Kd7 37. Bb5+ Ke7 38. Bc4 Qf1+ 39. Kh2 1-0', true),
  (21, 'Garry Kasparov', 'Deep Blue', 2795, null, 'Man vs Machine', 1996, '1-0', 'King''s Indian Defence', 'E69', 'In the first game of the historic match, Kasparov became the first human to defeat Deep Blue in tournament conditions. A landmark moment in chess history.', '1. Nf3 d5 2. d4 e6 3. c4 c6 4. Nc3 Nf6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7 9. O-O b4 10. Na4 c5 11. dxc5 Nxc5 12. Nxc5 Bxc5 13. a3 O-O 14. axb4 Bxb4 15. Bd2 Bd6 16. Qe2 Qe7 17. Ng5 g6 18. f4 Rae8 19. e4 Nd7 20. f5 exf5 21. Rxf5 gxf5 22. exf5 Rxe2 23. Bxe2 Kg7 24. Bh6+ Kxh6 25. Nxf7+ Kh5 26. Bxb4 Re8 27. Kf2 1-0', true),
  (22, 'Mikhail Botvinnik', 'José Raúl Capablanca', 2590, 2700, 'AVRO Tournament', 1938, '1-0', 'Nimzo-Indian Defence', 'E40', 'Considered one of the most important games of the 20th century. Botvinnik''s stunning queen sacrifice against the virtually unbeatable Capablanca.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. Bd3 O-O 9. Ne2 b6 10. O-O Ba6 11. Bxa6 Nxa6 12. Bb2 Qd7 13. a4 Rfe8 14. Qd3 c4 15. Qc2 Nb8 16. Rae1 Nc6 17. Ng3 Na5 18. f3 Nb3 19. e4 Qxa4 20. e5 Nd7 21. Qf2 g6 22. f4 f5 23. exf6 Nxf6 24. f5 Rxe1 25. Rxe1 Re8 26. Re6 Rxe6 27. fxe6 Kg7 28. Qf4 Qe8 29. Qe5 Qe7 30. Ba3 Qxa3 31. Nh5+ gxh5 32. Qg5+ Kf8 33. Qxf6+ Ke8 34. Qf7# 1-0', true),
  (23, 'Bobby Fischer', 'Donald Byrne', null, null, 'Rosenwald Memorial', 1956, '0-1', 'Grünfeld Defence', 'D92', '''The Game of the Century'' — 13-year-old Bobby Fischer sacrifices his queen in a stunning combination that stunned the chess world and announced his arrival.', '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1', true),
  (24, 'Magnus Carlsen', 'Peter Svidler', 2848, 2751, 'World Blitz Championship', 2012, '1-0', 'Sicilian Defence', 'B90', 'Carlsen''s blitz brilliance — converting an endgame advantage with the calm of a computer but the creativity of an artist.', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. h3 e5 7. Nde2 h5 8. g3 Be6 9. Ng1 d5 10. exd5 Nxd5 11. Nxd5 Bxd5 12. Qxd5 Qxd5 13. Bg2 Qe4 14. Kf1 Nc6 15. Nf3 f6 16. Re1 Qd3+ 17. Kg1 Nb4 18. Bd2 Nxc2 19. Rec1 Nxd4 20. Nxd4 exd4 21. Bxd5 O-O-O 22. Bc4 Qxd2 23. Rxc8+ Rxc8 24. Bxf7 Rc7 25. Be6+ Kb8 26. Rd1 Qe3+ 27. Kh2 d3 28. b4 d2 29. Rxd2 Rxd2 30. Bxd2 1-0', true),
  (25, 'Viswanathan Anand', 'Alexei Shirov', 2753, 2746, 'Linares', 1998, '1-0', 'Sicilian Sveshnikov', 'B33', 'A thundering attack from Anand — piece sacrifices leading to a forced checkmate that left Shirov with no defence.', '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Nd5 Be7 10. Bxf6 Bxf6 11. c3 O-O 12. Nc2 Rb8 13. a4 bxa4 14. Rxa4 a5 15. Bc4 Be6 16. Nce3 g6 17. O-O Kh8 18. Qd3 Bg7 19. Rd1 Ne7 20. Nxe7 Qxe7 21. b4 axb4 22. cxb4 Rxb4 23. Rxb4 Bxb4 24. Nd5 Qd8 25. Rxd6 Bxd5 26. Rxd5 Bc5 27. Qf3 Qe7 28. Rd2 Rd8 29. Rd5 Rxd5 30. Bxd5 f5 31. exf5 gxf5 32. Kh1 Kg7 33. Bxf7 Qxf7 34. Qb3 Qxb3 35. Nxb3 1-0', true),
  (26, 'Alexei Shirov', 'Veselin Topalov', 2723, 2700, 'Linares', 1998, '1-0', 'Benko Gambit', 'A57', 'Shirov''s legendary Bh3!! sacrifice — voted the greatest move ever in many polls. An utterly irrational bishop sacrifice that computer engines long failed to understand.', '1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 g6 6. Nc3 Bxa6 7. e4 Bxf1 8. Kxf1 d6 9. g3 Bg7 10. Kg2 O-O 11. Nf3 Nbd7 12. Re1 Ne5 13. Bf4 Ng4 14. h3 Nh6 15. Re2 Nf5 16. Nd2 Nd4 17. Re1 Rb8 18. b3 Re8 19. Nce4 Nd7 20. g4 Ne3+ 21. fxe3 Nxe2 22. exd4 Rxb3 23. Nxb3 Bxd4 24. Nd2 Bxa1 25. Qxa1 cxd4 26. e5 Rxe5 27. Rxe5 Nxe5 28. Qxd4 Qb6 29. Qxb6 Nf3+ 30. Nxf3 exf3+ 31. Kxf3 dxe5 32. Bh3 Kf8 0-1', true),
  (27, 'Mikhail Tal', 'Tigran Petrosian', 2640, 2630, 'USSR Championship', 1958, '1-0', 'Nimzo-Indian Defence', 'E54', 'Pure Tal — wild complications, speculative sacrifices, and the opponent completely lost in the chaos that only the Magician could create.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Nf3 O-O 6. Bd3 Nc6 7. O-O cxd4 8. exd4 d5 9. a3 dxc4 10. Bxc4 Be7 11. Re1 Bd6 12. Bg5 b6 13. Bc1 Bb7 14. Bg5 h6 15. Bh4 g5 16. Bg3 Nh5 17. Bxd6 Qxd6 18. Bb5 Rad8 19. d5 exd5 20. Nxd5 Nxg3 21. hxg3 Ne5 22. Nxe5 Qxe5 23. g4 Rd6 24. Qh5 1-0', true),
  (28, 'Garry Kasparov', 'Magnus Carlsen', 2812, 2698, 'Reykjavik Rapid', 2004, '1-0', 'Sicilian Defence', 'B90', 'A young Carlsen squares off against the legend. Kasparov outplays his future successor in a sharp Sicilian with experienced precision.', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. g4 d5 11. g5 Nfd7 12. exd5 Bxd5 13. O-O-O Nxg5 14. Nxd5 Qxd5 15. Kb1 Rd8 16. Qe2 Nc6 17. f4 exf4 18. Bxf4 Qf5 19. Nc1 Ne6 20. Bg3 Nd4 21. Qf2 Rxd1+ 22. Rxd1 Re8 23. Bd3 Qd7 24. Ne2 Nf3 25. Bxh7+ Kxh7 26. Qxf3 Qxd1+ 27. Kxd1 Re1+ 28. Kxe1 1-0', true),
  (29, 'Mikhail Botvinnik', 'Vassily Smyslov', 2620, 2600, 'World Championship', 1954, '1/2-1/2', 'Nimzo-Indian Defence', 'E26', 'A model positional game from Botvinnik. The game illustrates his deep understanding of structure and long-term planning.', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 exd5 8. Bd3 O-O 9. Ne2 b6 10. O-O Ba6 11. Bxa6 Nxa6 12. Bb2 Qd7 13. a4 Rfe8 14. Qd3 c4 15. Qc2 Nb8 16. Rae1 Nc6 17. Ng3 Na5 18. f3 1/2-1/2', true),
  (30, 'Hikaru Nakamura', 'Magnus Carlsen', 2772, 2870, 'Champions Chess Tour', 2021, '0-1', 'Queen''s Gambit Declined', 'D37', 'Nakamura sacrifices aggressively but Carlsen''s defensive accuracy and counter-play overcome the complications to win in style.', '1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. Nd2 Bb6 11. Nb3 Qd8 12. O-O-O dxc4 13. Bxc4 e5 14. Bg5 Be6 15. Bxe6 fxe6 16. Na4 Bc7 17. Rxd8 Rfxd8 18. Nc3 e4 19. Rd1 Nd4 20. Rxd4 exd4 21. exd4 exd3 22. Qxd3 Rxd4 23. Qxd4 Bxh2 24. Bc1 Rd8 25. Qe3 Bc7 26. Nd4 Ng4 27. Qe2 Nxf2 28. Nd5 Bd6 29. Nf5 Nxd1 0-1', true)
on conflict (id) do update set
  white_player = excluded.white_player,
  black_player = excluded.black_player,
  white_rating = excluded.white_rating,
  black_rating = excluded.black_rating,
  event = excluded.event,
  played_year = excluded.played_year,
  result = excluded.result,
  opening_name = excluded.opening_name,
  eco = excluded.eco,
  description = excluded.description,
  pgn = excluded.pgn,
  is_published = excluded.is_published
;


-- --------------------------------------------------------------------------
-- Study categories and courses
-- --------------------------------------------------------------------------

insert into public.study_categories (id, label, icon, accent_colour, sort_order) values
  ('endgame-studies', 'Endgame Studies', '♚', '#C9A84C', 0),
  ('tactical-patterns', 'Tactical Patterns', '⚔', '#60a5fa', 1),
  ('positional-concepts', 'Positional Concepts', '♜', '#4ade80', 2)
on conflict (id) do update set
  label = excluded.label,
  icon = excluded.icon,
  accent_colour = excluded.accent_colour,
  sort_order = excluded.sort_order
;

insert into public.courses (id, category_id, title, description, difficulty, lesson_count, cheat_sheet, sort_order, is_published) values
  ('kp-vs-k', 'endgame-studies', 'King & Pawn vs King', 'Master the opposition and key squares to convert pawn endgames.', 'Beginner', 6, '{"concepts":["Key squares = 2 ranks ahead of the pawn (fewer as it advances)","Opposition = facing kings, one square apart, opponent to move","The side with the opposition usually gains ground","A rook pawn (a/h-file) is often a draw even with the key squares"],"rules":["If your king reaches a key square before the enemy king, the pawn queens by force.","With the opposition, step forward — never sideways or back.","Triangulation lets you lose a tempo to pass the opposition to your opponent."],"mistakes":["Pushing the pawn before securing the key squares — it can wall in your own king.","Forgetting that rook-pawn endings are drawn far more often than other pawns.","Chasing the enemy king instead of the key squares."],"tricks":["''Key squares before pawn moves'' — say it before every push.","Picture a ladder: the key squares climb the board one rung behind the pawn."]}'::jsonb, 0, true),
  ('rook-endgame', 'endgame-studies', 'Rook Endgame Essentials', 'Lucena, Philidor, and the most common rook endgame patterns.', 'Intermediate', 10, '{"concepts":["Lucena = building a bridge to win","Philidor = third-rank defence to draw","Active rook > extra pawn, almost always","Cutting off the king is worth a tempo"],"rules":["Rooks belong behind passed pawns — yours or the opponent''s.","In a draw-ish rook ending, activity beats material.","Checking from behind rarely helps; check from the side."],"mistakes":["Putting the rook in front of your own passed pawn.","Checking too early from the Philidor defence.","Trading into a lost king & pawn ending by mistake."],"tricks":["''Rooks belong behind passers'' — yours push, theirs you blockade from behind.","Lucena = ''build the bridge''. Philidor = ''hold the third rank''."]}'::jsonb, 1, true),
  ('bn-mate', 'endgame-studies', 'Bishop & Knight Checkmate', 'The hardest basic checkmate. Step-by-step method to corner the king.', 'Advanced', 4, '{"concepts":["Mate only works in the corner matching your bishop''s colour","The ''W'' manoeuvre herds the king across the board","You get 50 moves under FIDE rules — don''t rush"],"rules":["Keep the bishop''s diagonal cutting through the danger corner as often as possible.","Use your king actively — it does most of the cornering work.","Never let the king escape to the safe-coloured corner without a fight."],"mistakes":["Herding toward the wrong corner colour.","Losing the opposition and letting the king slip past your king.","Forgetting the knight can also accidentally stalemate the king — check before every move."],"tricks":["''Bishop''s colour, bishop''s corner'' — say it before you start.","The W-pattern: picture the knight tracing a W across the board as it drives the king in."]}'::jsonb, 2, true),
  ('pins-skewers', 'tactical-patterns', 'Pins & Skewers', 'Recognise and exploit linear piece tactics in any position.', 'Beginner', 8, '{"concepts":["Absolute pin = against the king, illegal to move","Relative pin = against something valuable, legal but costly","Skewer = pin in reverse — attack the valuable piece first"],"rules":["Add attackers to a pinned piece faster than the defender can add defenders.","Check every line your bishops, rooks and queens control for pins before moving.","A pinned pawn can''t capture — remember this in tactical calculations."],"mistakes":["Moving a relatively pinned piece without checking what''s behind it.","Missing that your own piece is pinned before making a tactical calculation.","Overlooking skewers on open files in simplified endgames."],"tricks":["''Pin then pile'' — pin it, then add more attackers than defenders.","X-ray vision: always look one square past the piece you''re attacking."]}'::jsonb, 100, true),
  ('discovered-attacks', 'tactical-patterns', 'Discovered Attacks', 'Unleash hidden attacks by moving a piece out of the way.', 'Intermediate', 7, '{"concepts":["Moving one piece reveals an attack from another behind it","Discovered check = the moving piece is free to do anything","Double check can only be answered by moving the king"],"rules":["Scan for your own aligned pieces every few moves — this is how discoveries are found.","A discovered check is often winning even if the moving piece ''does nothing'' — check the board for hanging pieces first.","Watch out for your opponent''s discovered attacks too, especially after you develop a piece into a line."],"mistakes":["Missing that your own move opens a discovered attack for the opponent.","Not checking what the ''free'' moving piece can do before playing the discovery.","Confusing discovered check with a simple double attack."],"tricks":["''What''s behind it?'' — ask this every time you consider moving a piece.","Double check = king must move, no exceptions."]}'::jsonb, 101, true),
  ('interference-deflection', 'tactical-patterns', 'Interference & Deflection', 'Remove defensive pieces through forcing combinations.', 'Advanced', 9, '{"concepts":["Deflection = lure a defender away from its job","Interference = block the line between defender and defended","Both are usually sacrifices — calculate the follow-up first"],"rules":["Ask ''what is this piece defending?'' before every trade in a sharp position.","A forcing move (check, capture, threat) is the best deflection tool.","Interference sacrifices need concrete calculation — don''t play them on instinct alone."],"mistakes":["Sacrificing for interference without checking the follow-up wins material back.","Missing that a piece is overloaded, defending two things at once.","Stopping calculation one move too early."],"tricks":["''What''s it defending?'' — the single most useful tactical question.","Overloaded pieces are the classic deflection target — find the piece doing two jobs."]}'::jsonb, 102, true),
  ('pawn-structure', 'positional-concepts', 'Pawn Structure Fundamentals', 'Isolated, doubled, and passed pawns — how to exploit or defend them.', 'Intermediate', 12, '{"concepts":["Isolated pawn = no pawn support, but open lines for pieces","Doubled pawns = weak long-term, but open files short-term","Passed pawn = nothing can stop it reaching the 8th but blockade/capture"],"rules":["Blockade an isolated pawn with a knight, not a bishop, when possible.","Trade pieces (not pawns) when you''re playing against an isolated pawn.","Push passed pawns when you have piece support behind them, not before."],"mistakes":["Trading into a pawn structure without evaluating who benefits long-term.","Blockading with the wrong piece, letting it get kicked away.","Ignoring a passed pawn until it''s too late to stop."],"tricks":["''Pieces over pawns vs isolani'' — trade pieces, keep pawns, if you''re attacking an isolated pawn.","A passed pawn wants to run — rooks behind it, king in front to stop it."]}'::jsonb, 200, true),
  ('outposts', 'positional-concepts', 'Outpost Squares', 'Place knights and bishops on dominant squares your opponent cannot attack.', 'Intermediate', 6, '{"concepts":["Outpost = square no enemy pawn can attack","Knights love outposts more than bishops","A protected outpost is nearly impossible to remove"],"rules":["Look for outposts on your 4th, 5th or 6th rank (from your side).","Support the outpost with a pawn whenever the structure allows it.","Trade off the opponent''s pieces that could challenge your outpost knight (their same-coloured bishop, or a knight that could also reach the square)."],"mistakes":["Placing a piece on an ''outpost'' that can still be attacked by a pawn a move later.","Ignoring the bishop that could trade off your outpost knight.","Forgetting to protect the outpost square with a pawn when possible."],"tricks":["Circle the square, then ask: can any enemy pawn ever reach a square that attacks it? If no, it''s a real outpost."]}'::jsonb, 201, true),
  ('rook-7th', 'positional-concepts', 'Rook on the Seventh Rank', 'How to dominate with a rook cutting off the king on the 7th rank.', 'Advanced', 5, '{"concepts":["Rook on the 7th attacks undeveloped pawns","Doubled rooks on the 7th = ''pigs on the seventh''","Can confine the enemy king to the back rank"],"rules":["Look to plant a rook on the seventh as soon as an open file allows it.","Two rooks on the seventh can deliver perpetual check even when material down.","Defend against it by trading rooks or advancing the pawns it attacks before it arrives."],"mistakes":["Allowing a rook to reach the seventh for free when a trade was available.","Missing a perpetual-check drawing resource for the defending side.","Not evaluating how confined your own king is once the rook lands."],"tricks":["''Pigs on the seventh'' — a fun way to remember just how strong doubled 7th-rank rooks are."]}'::jsonb, 202, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  lesson_count = excluded.lesson_count,
  cheat_sheet = excluded.cheat_sheet,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published
;

insert into public.course_chapters (course_id, chapter_index, title, fen, body, note) values
  ('kp-vs-k', 0, 'The Key Squares', '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1', array['Every king and pawn ending is decided by one question: can the attacking king reach the key squares in front of its pawn? For a pawn on e4, the key squares are d5, e5 and f5 — if White''s king gets there first, the pawn queens no matter what Black does.', 'The rule of thumb: with the pawn not yet past the fourth rank, the key squares sit two ranks ahead of it. As the pawn advances, the key squares move up with it.']::text[], 'Count squares before you push the pawn. Pushing too early can hand the key squares to the defender for free.'),
  ('kp-vs-k', 1, 'Opposition', '8/8/8/3k4/8/3K4/4P3/8 w - - 0 1', array['Opposition means the two kings face each other with exactly one square between them, and it''s the other player''s move. Whoever is forced to move away from the confrontation loses ground.', 'Direct opposition (same file or rank) is the version you''ll use most, but diagonal opposition and ''distant opposition'' follow the same parity logic — count the squares between the kings; if it''s odd and it''s your opponent''s move, you have the opposition.']::text[], null),
  ('kp-vs-k', 2, 'Converting the Win', '8/8/8/8/3k4/8/3PK3/8 w - - 0 1', array['Once your king controls the key squares, the technique is mechanical: shoulder the enemy king away, walk your king in front of the pawn, then hand over the opposition at the right moment to let the pawn through.', 'If you don''t yet have the key squares, try to win the opposition first with a waiting move — often a pawn move elsewhere, or triangulation with the king.']::text[], null),
  ('rook-endgame', 0, 'The Lucena Position', '1K6/1P6/8/8/8/8/r7/2k3R1 w - - 0 1', array['The Lucena position is the single most important winning technique in rook endings. The attacking side builds a ''bridge'' with the rook on the fourth rank to shield the king from checks while the pawn queens.', 'The method: cut the defending king off, walk your king to the queening square, then slide the rook to the fourth rank to block checks from the side.']::text[], 'If you only remember one rook ending, make it this one — it comes up constantly.'),
  ('rook-endgame', 1, 'The Philidor Position', '8/8/1k6/8/8/1K6/1P6/r7 w - - 0 1', array['The Philidor position is the key drawing technique for the defender. Keep your rook on the third rank (the sixth from the pawn''s perspective) until the pawn advances to that rank, then swing to the back rank for endless checks.', 'The critical error is checking too early — you''ll just get pushed away and lose the drawing chances.']::text[], null),
  ('rook-endgame', 2, 'Cutting Off the King', '8/8/8/3k4/8/3K1R2/4P3/8 b - - 0 1', array['A rook cutting off the enemy king along a file or rank is worth roughly a tempo every move — the king has to go the long way around. Combine a cut-off with pawn advances to make progress in endings that would otherwise be drawn.']::text[], null),
  ('bn-mate', 0, 'Why It''s Hard', '8/8/8/4k3/8/3BKN2/8/8 w - - 0 1', array['Bishop and knight vs. lone king is the hardest of the ''basic'' checkmates because the king can only be mated in a corner that matches your bishop''s colour. Push the wrong way and you''ll never deliver mate.', 'Give yourself the full 50 moves — this technique takes practice before it becomes automatic.']::text[], null),
  ('bn-mate', 1, 'The W-Manoeuvre', '8/8/8/3k4/8/3BKN2/8/8 w - - 0 1', array['The knight and king herd the enemy king toward the correct corner using a repeating zig-zag pattern nicknamed the ''W''. The bishop controls the escape diagonal while the knight and king close the net.']::text[], 'If the king slips to the wrong-coloured corner, you must shepherd it all the way across the board again.'),
  ('bn-mate', 2, 'Delivering Mate', '7k/5N2/6K1/8/8/3B4/8/8 w - - 0 1', array['The final mate is almost always a knight check that forces the king onto the bishop''s diagonal, with your king controlling the escape squares. Recognise the pattern so you don''t fumble the last few moves.']::text[], null),
  ('pins-skewers', 0, 'Absolute vs Relative Pins', 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', array['An absolute pin traps a piece against the king — it''s illegal to move it at all. A relative pin traps a piece against something valuable, like the queen; moving it is legal but usually costly.', 'Bishops, rooks and queens create pins along the lines they control. Always scan for enemy pieces lined up with their king or queen before you move.']::text[], null),
  ('pins-skewers', 1, 'Skewers', '6k1/8/8/8/8/8/6R1/6K1 w - - 0 1', array['A skewer is a pin in reverse: you attack a valuable piece, and when it moves, you win whatever is standing behind it. The classic pattern is a rook or bishop skewering a king in front of a rook or queen on the back rank.']::text[], 'Look for skewers especially in the endgame, when kings are exposed on open files and diagonals.'),
  ('pins-skewers', 2, 'Exploiting the Pin', 'rnb1kbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 1', array['A pinned piece is a weak piece — pile more attackers onto it than the defender has protectors, and it falls. This is one of the most common ways lower-rated players win material.']::text[], null),
  ('discovered-attacks', 0, 'The Basic Idea', 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', array['A discovered attack happens when you move one piece, revealing an attack from a piece behind it. Because two pieces are moving in effect, the opponent often can''t deal with both threats at once.']::text[], null),
  ('discovered-attacks', 1, 'Discovered Check', '4k3/8/4B3/8/8/4R3/8/4K3 w - - 0 1', array['Discovered check is the deadliest version — the moving piece is free to do anything (even capture something undefended) while the revealed piece delivers check. This is one of the most powerful tactical weapons in chess.']::text[], 'Double check — where both the moving piece and the revealed piece give check — can only be answered by moving the king.'),
  ('discovered-attacks', 2, 'Spotting the Setup', 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1', array['Look for your own pieces lined up on the same file, rank or diagonal, with an enemy king or queen at the far end. If you can move the front piece with tempo, you likely have a discovered attack waiting.']::text[], null),
  ('interference-deflection', 0, 'Deflection', '3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', array['Deflection lures a defending piece away from its job — usually with a check, capture, or threat it can''t ignore — so you can exploit whatever it was protecting.']::text[], null),
  ('interference-deflection', 1, 'Interference', '6k1/8/8/3b4/8/8/1R6/6K1 w - - 0 1', array['Interference blocks the line between a defender and what it''s defending, usually by sacrificing a piece onto the critical square. Once the line is cut, the tactic behind it goes through.']::text[], 'Interference sacrifices often look like they lose material — calculate the follow-up carefully before dismissing them.'),
  ('interference-deflection', 2, 'Combining Both', 'r4rk1/pp3ppp/2p5/8/3Q4/8/PPP2PPP/R3R1K1 w - - 0 1', array['The strongest combinations often chain deflection and interference together — remove one defender, block another, and the position collapses. These are the tactics that separate strong players from the rest.']::text[], null),
  ('pawn-structure', 0, 'The Isolated Queen''s Pawn', 'r1bqkb1r/pp3ppp/2n1pn2/3p4/2PP4/5N2/PP2BPPP/RNBQ1RK1 w kq - 0 1', array['An isolated pawn (no friendly pawns on either neighbouring file) can''t be defended by other pawns, but it also controls key central squares and gives its owner active piece play. Whether it''s a strength or weakness depends on who controls the game''s pace.', 'The blockading square directly in front of the isolated pawn is critical — a well-placed knight there neutralises much of its dynamic potential.']::text[], null),
  ('pawn-structure', 1, 'Doubled Pawns', 'r1bqkbnr/pp1p1ppp/2n5/2p1p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1', array['Doubled pawns can''t defend each other and often become long-term targets, but they also open a half-open file for a rook and can control extra central squares. Judge them by the position, not by reflex.']::text[], null),
  ('pawn-structure', 2, 'Passed Pawns', '8/5k2/8/4P3/8/5K2/8/8 w - - 0 1', array['A passed pawn — no enemy pawns able to stop it on its file or the adjacent files — grows more dangerous the closer it gets to promotion. ''A passed pawn''s lust to expand'' is one of the most quoted lines in chess literature for a reason.']::text[], 'Rooks belong behind passed pawns, whichever side owns them.'),
  ('outposts', 0, 'What Makes an Outpost', 'r1bqkb1r/pp1n1ppp/2p1pn2/3p4/2PP4/2N2N2/PP2BPPP/R1BQK2R w KQkq - 0 1', array['An outpost is a square that can''t be attacked by an enemy pawn — usually because the pawns that would attack it have already been traded or advanced past it. A knight on an outpost is often worth more than a bishop.']::text[], null),
  ('outposts', 1, 'Getting a Piece There', 'r1bq1rk1/pp1n1ppp/2p1pn2/3pN3/2PP4/2N5/PP2BPPP/R1BQ1RK1 w - - 0 1', array['Route your knight to the outpost via the safest path, and consider provoking the pawn trades that create the outpost in the first place — for instance, trading on d5 to hand yourself the d5 square.']::text[], 'Protect the outpost square with a pawn if you can — it''s much harder to dislodge a defended piece.'),
  ('rook-7th', 0, 'Why the 7th Rank Matters', '6k1/R4ppp/8/8/8/8/5PPP/6K1 w - - 0 1', array['A rook on the seventh rank (second rank for Black) attacks pawns that haven''t moved and often traps the enemy king on the back rank. Two rooks doubled on the seventh — the ''pigs on the seventh'' — can be devastating.']::text[], null),
  ('rook-7th', 1, 'Cutting Off the King', '6k1/5R1p/6p1/8/8/8/5PPP/6K1 w - - 0 1', array['Beyond eating pawns, a rook on the seventh often confines the enemy king to the back rank entirely, which can be enough on its own to win an endgame by zugzwang.']::text[], 'Look for perpetual check patterns too — a rook on the seventh combined with another piece can sometimes force a draw from a losing position.')
on conflict (course_id, chapter_index) do update set
  title = excluded.title,
  fen = excluded.fen,
  body = excluded.body,
  note = excluded.note
;

insert into public.course_practice_questions (course_id, question_index, prompt, options, answer_index, explanation) values
  ('kp-vs-k', 0, 'With a pawn on e4, which squares are the key squares?', array['d4, e4, f4', 'd5, e5, f5', 'd6, e6, f6']::text[], 1, null),
  ('kp-vs-k', 1, 'You have direct opposition when the kings are:', array['Two squares apart, your move', 'One square apart, opponent to move', 'On the same rank, any distance']::text[], 1, null),
  ('rook-endgame', 0, 'In the Lucena position, the rook builds a bridge on which rank?', array['The 2nd rank', 'The 4th rank', 'The 7th rank']::text[], 1, null),
  ('rook-endgame', 1, 'The Philidor defence relies on holding which rank before the pawn passes it?', array['The 1st rank', 'The 3rd rank (6th for Black)', 'The 5th rank']::text[], 1, null),
  ('bn-mate', 0, 'Bishop & knight mate only works in a corner that matches:', array['The knight''s starting square', 'The bishop''s square colour', 'Either corner, doesn''t matter']::text[], 1, null),
  ('bn-mate', 1, 'How many moves does FIDE allow for this mate before a draw claim?', array['25', '50', '75']::text[], 1, null),
  ('pins-skewers', 0, 'A pin against the king is called:', array['Relative pin', 'Absolute pin', 'Discovered pin']::text[], 1, null),
  ('pins-skewers', 1, 'In a skewer, which piece is attacked first?', array['The less valuable piece', 'The more valuable piece', 'It doesn''t matter']::text[], 1, null),
  ('discovered-attacks', 0, 'In a discovered check, the moving piece:', array['Must also give check', 'Is free to move anywhere, even capture', 'Cannot move at all']::text[], 1, null),
  ('discovered-attacks', 1, 'A double check can only be answered by:', array['Blocking one of the checks', 'Capturing the checking piece', 'Moving the king']::text[], 2, null),
  ('interference-deflection', 0, 'Deflection works by:', array['Blocking a defensive line', 'Luring a defender away from its job', 'Trading pieces evenly']::text[], 1, null),
  ('interference-deflection', 1, 'A piece defending two things at once is called:', array['Pinned', 'Overloaded', 'Interfered']::text[], 1, null),
  ('pawn-structure', 0, 'The best piece to blockade an isolated pawn is usually:', array['A bishop', 'A knight', 'A rook']::text[], 1, null),
  ('pawn-structure', 1, 'Rooks belong _____ passed pawns.', array['In front of', 'Behind', 'Beside']::text[], 1, null),
  ('outposts', 0, 'An outpost square is one that:', array['Is defended by two pieces', 'No enemy pawn can ever attack', 'Is in the center of the board']::text[], 1, null),
  ('rook-7th', 0, 'Two rooks doubled on the seventh rank are nicknamed:', array['Twin towers', 'Pigs on the seventh', 'The double lock']::text[], 1, null)
on conflict (course_id, question_index) do update set
  prompt = excluded.prompt,
  options = excluded.options,
  answer_index = excluded.answer_index,
  explanation = excluded.explanation
;


-- --------------------------------------------------------------------------
-- Question banks
-- --------------------------------------------------------------------------

insert into public.daily_questions (id, rating_group, topic, question_type, prompt, options, answer_index, explanation, learning_note, difficulty, strength_needed, fen, is_published) values
  ('b1', 'Beginner', 'Piece Values', 'Multiple Choice', 'Which piece is generally worth the most material (excluding the king)?', array['Rook', 'Bishop', 'Queen', 'Knight']::text[], 2, 'The queen is worth approximately 9 points, the most valuable piece besides the king.', 'Standard values: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9.', 'Easy', '600+', null, true),
  ('b2', 'Beginner', 'Basic Tactics', 'Tactical Puzzle', 'White to move. Find the move that wins material with a fork.', array['Ng5', 'Bxf7+', 'Qe2', 'O-O']::text[], 1, 'Bxf7+! forks the king and wins the f7 pawn with check, disrupting Black''s structure.', 'Always check for undefended squares near the enemy king.', 'Easy', '700+', 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', true),
  ('b3', 'Beginner', 'Checkmate Patterns', 'Position Evaluation', 'True or False: A king on the back rank surrounded by its own pawns with no escape square can be checkmated by a single rook on the back rank.', array['True', 'False']::text[], 0, 'This is the ''back rank mate'' — one of the most fundamental checkmate patterns in chess.', 'Always keep a luft (escape square) for your king once your back rank is weak.', 'Easy', '500+', null, true),
  ('b4', 'Beginner', 'Opening Principles', 'Multiple Choice', 'Which of these is NOT a core opening principle?', array['Control the center', 'Develop pieces quickly', 'Move the same piece multiple times early', 'Castle for king safety']::text[], 2, 'Moving the same piece repeatedly in the opening wastes time (tempo) that could be used for development.', 'Develop a new piece each move where possible in the opening.', 'Easy', '500+', null, true),
  ('b5', 'Beginner', 'Basic Endgames', 'Best Move', 'King and pawn vs king: your king is in front of your pawn with the opposition. What should you do?', array['Push the pawn immediately', 'Advance the king first, keep the opposition', 'Move the king backward', 'Sacrifice the pawn']::text[], 1, 'In king and pawn endgames, having the opposition while advancing the king (not the pawn) is the winning technique.', 'The king should usually lead the pawn in basic king and pawn endgames.', 'Medium', '700+', null, true),
  ('n1', 'Novice', 'Forks', 'Tactical Puzzle', 'Black to move. Find the knight move that forks two pieces.', array['Nb4', 'Nxe4', 'Ng4', 'Nd4']::text[], 1, 'Nxe4! wins a central pawn and creates threats since the knight attacks both c3 and f2 simultaneously.', 'Knights on central squares often have powerful forking potential.', 'Medium', '1000+', 'r2qkb1r/ppp2ppp/2n1bn2/3pp3/4P3/2NP1N2/PPP2PPP/R1BQKB1R b KQkq - 0 6', true),
  ('n2', 'Novice', 'Pins', 'Best Move', 'You see your opponent''s knight pinned to their king by your bishop. What''s the best follow-up plan?', array['Trade the bishop immediately', 'Pile pressure on the pinned piece with more attackers', 'Ignore it and develop elsewhere', 'Move the bishop away']::text[], 1, 'Adding attackers to a pinned piece often wins material since it cannot move to defend itself.', 'A pin restricts movement — exploit it by increasing pressure.', 'Medium', '1000+', null, true),
  ('n3', 'Novice', 'Discovered Attacks', 'Multiple Choice', 'What makes discovered attacks especially dangerous?', array['They are easy to spot', 'The moving piece can deliver a second threat while revealing another', 'They only work in the endgame', 'They require a queen']::text[], 1, 'Discovered attacks are powerful because two threats happen at once — the moved piece''s threat plus the revealed piece''s threat.', 'Look for pieces that can move to reveal an attack from a piece behind them.', 'Medium', '1100+', null, true),
  ('n4', 'Novice', 'Pawn Structures', 'Position Evaluation', 'You have doubled pawns on the c-file but open lines for your rooks. Is this generally:', array['Always bad', 'Always good', 'Can be a fair trade-off depending on activity', 'Illegal in chess']::text[], 2, 'Doubled pawns are a structural weakness, but if they come with open files and piece activity, they can be worth it.', 'Evaluate pawn weaknesses against the dynamic compensation you receive.', 'Medium', '1100+', null, true),
  ('n5', 'Novice', 'Candidate Moves', 'Find the Plan', 'Before playing a move, what should you always do first?', array['Play the first move you see', 'Generate several candidate moves and compare them', 'Always capture if possible', 'Ask your opponent for hints']::text[], 1, 'Strong players generate 2–4 candidate moves and compare them before committing, rather than playing the first idea.', 'Develop the habit of considering multiple candidate moves each turn.', 'Medium', '1000+', null, true),
  ('i1', 'Intermediate', 'Forks', 'Tactical Puzzle', 'Find the tactical shot for White that wins material via a fork.', array['cxd5', 'Ne5', 'Bxh7+', 'Qb3']::text[], 2, 'Bxh7+! is the classic Greek Gift sacrifice, exploiting weaknesses around the king after Kxh7 Ng5+.', 'Watch for sacrificial bishop attacks (Bxh7+) when the enemy king''s defenders are reduced.', 'Hard', '1500+', 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 2 8', true),
  ('i2', 'Intermediate', 'Pawn Structures', 'Position Evaluation', 'In an IQP (isolated queen''s pawn) position, which side typically benefits from trading pieces?', array['The side WITH the IQP', 'The side WITHOUT the IQP', 'Neither side benefits', 'It depends only on material']::text[], 1, 'The side without the IQP usually wants to trade pieces to reach an endgame where the isolated pawn becomes a long-term weakness.', 'IQP holder wants activity and attack; the opponent wants simplification.', 'Medium', '1400+', null, true),
  ('i3', 'Intermediate', 'Candidate Moves', 'Find the Plan', 'You have a strong knight outpost on d5 supported by a pawn. What is the priority plan?', array['Trade the knight immediately', 'Keep the knight there and build around it', 'Retreat the knight to safety', 'Sacrifice the knight for activity']::text[], 1, 'A well-supported outpost is a long-term structural advantage — build your position around it rather than trading it.', 'Outposts on the 5th/6th rank that can''t be challenged by pawns are extremely valuable.', 'Medium', '1300+', null, true),
  ('i4', 'Intermediate', 'Famous Games', 'Chess History', 'In the famous ''Immortal Game'' (Anderssen vs Kieseritzky, 1851), what did White famously sacrifice to deliver checkmate?', array['Both rooks and the queen', 'Just a knight', 'Both bishops', 'The queen only']::text[], 0, 'Anderssen sacrificed both rooks and the queen, delivering checkmate with just three minor pieces.', 'Material sacrifice for mating attacks has been a chess theme since the Romantic era.', 'Medium', '1200+', null, true),
  ('i5', 'Intermediate', 'Middlegame Decision', 'Best Move', 'You''re choosing between trading into a slightly better endgame or keeping queens on for attacking chances with equal material. Generally you should:', array['Always trade queens', 'Consider your opponent''s weaknesses and your attacking potential', 'Always avoid trades', 'Trade only rooks, never queens']::text[], 1, 'The decision depends on context — king safety, piece activity, and pawn structure all matter more than a blanket rule.', 'Evaluate trades based on resulting structure and activity, not dogma.', 'Hard', '1500+', null, true),
  ('a1', 'Advanced', 'Strategic Planning', 'Find the Plan', 'You have a spatial advantage on the kingside but your opponent has counterplay on the queenside. What''s the typical strategic approach?', array['Race to attack faster than your opponent''s counterplay', 'Defend passively on both sides', 'Trade all pieces immediately', 'Ignore the queenside entirely']::text[], 0, 'In races between attacks on opposite wings, speed and precision matter — calculate who arrives first.', 'Opposite-side attacks require precise calculation of tempo.', 'Hard', '1800+', null, true),
  ('a2', 'Advanced', 'Positional Sacrifices', 'Position Evaluation', 'A piece sacrifice for long-term positional compensation (strong bishop pair, weak enemy king) is typically called:', array['A blunder', 'An exchange sacrifice', 'A positional sacrifice', 'An illegal move']::text[], 2, 'Positional sacrifices trade material for long-term structural or strategic advantages rather than immediate tactics.', 'Petrosian and Karpov were famous for positional exchange sacrifices.', 'Hard', '1700+', null, true),
  ('a3', 'Advanced', 'Transition to Endgame', 'Best Move', 'You''re slightly better in the middlegame with a strong knight vs a bad bishop. Should you trade into an endgame?', array['No, avoid endgames always', 'Yes, simplifying often increases the practical value of structural advantages', 'Only if you''re losing', 'Never trade minor pieces']::text[], 1, 'Trading down when you have a structural edge (good knight vs bad bishop) often increases your winning chances.', 'Simplification favors the side with a lasting structural or piece-quality advantage.', 'Hard', '1700+', null, true),
  ('a4', 'Advanced', 'Calculation', 'Tactical Puzzle', 'Calculate: White to move and force a winning material gain in 3 moves.', array['Bxb6', 'Re8+', 'Bb6', 'Rd1']::text[], 1, 'Re8+! Rxe8 Bb6 forks the a8-rook... wait, this forces Rxe8, then the bishop wins material via discovered tactics on the back rank.', 'Always check forcing moves (checks, captures, threats) first in calculation.', 'Hard', '1800+', '2r3k1/5ppp/p7/1p6/3B4/1P6/P4PPP/4R1K1 w - - 0 28', true),
  ('a5', 'Advanced', 'Advanced Opening Ideas', 'Multiple Choice', 'In modern opening theory, what is a key reason for delaying castling in some sharp lines?', array['It''s always wrong to delay castling', 'Keeping the king flexible can avoid becoming a target in certain attacking lines', 'Castling is illegal in some openings', 'There''s no strategic reason']::text[], 1, 'In some sharp systems, delaying castling keeps options open and avoids the king becoming a clear target for a prepared attack.', 'Modern theory treats castling as a strategic choice, not always an automatic move.', 'Hard', '1900+', null, true),
  ('e1', 'Expert', 'Complex Calculation', 'Tactical Puzzle', 'In a sharp tactical position with multiple candidate moves, what is the most reliable calculation method?', array['Guess based on intuition only', 'Calculate forcing lines first (checks, captures, threats) to a clear endpoint', 'Only calculate one move deep', 'Avoid calculation and play positionally']::text[], 1, 'At the expert level, calculating forcing sequences to a concrete, evaluable position is the gold standard.', 'Always seek a ''quiet'' or clearly evaluable position at the end of forced calculation.', 'Very Hard', '2000+', null, true),
  ('e2', 'Expert', 'GM Positions', 'Position Evaluation', 'In a position with opposite-colored bishops and extra material for one side, what is generally true about drawing chances?', array['OCB always wins for the side with more material', 'OCB endgames famously favor drawing chances even with extra pawns', 'OCB has no effect on draw likelihood', 'OCB only matters in the middlegame']::text[], 1, 'Opposite-colored bishop endgames are notoriously drawish, even with a significant material advantage, due to blockading potential.', 'Material advantage means less in OCB endgames than in same-colored bishop endgames.', 'Hard', '2000+', null, true),
  ('e3', 'Expert', 'Dynamic Imbalances', 'Find the Plan', 'You have two minor pieces for a rook and pawn in a complex middlegame. The strategic priority is usually:', array['Trade pieces to reach a simple endgame immediately', 'Use piece coordination and activity to outweigh the small material deficit', 'Resign the position', 'Always avoid such imbalances']::text[], 1, 'Two minor pieces vs rook+pawn is roughly balanced material-wise; piece coordination determines who''s better.', 'Evaluate dynamic imbalances by activity and coordination, not just point-count.', 'Very Hard', '2100+', null, true),
  ('e4', 'Expert', 'High-Level Endgames', 'Best Move', 'In a complex rook endgame with pawns on both sides, what''s the single most important factor?', array['Material count alone', 'Rook activity and king activity', 'Number of pawns only', 'Whoever has more time on the clock']::text[], 1, 'Rook activity (''rooks belong behind passed pawns'') and king activity are the dominant factors in rook endgames.', 'Tarrasch''s rule: rooks belong behind passed pawns, whether yours or your opponent''s.', 'Very Hard', '2100+', null, true),
  ('e5', 'Expert', 'Preparation Concepts', 'Chess History', 'Modern top-level opening preparation primarily relies on:', array['Pure intuition only', 'Deep engine analysis combined with practical understanding', 'Memorizing 50 moves without understanding', 'Avoiding all theoretical lines']::text[], 1, 'Modern preparation blends engine-verified lines with deep practical and strategic understanding of resulting positions.', 'Engines find the moves; understanding why they work is what separates true mastery.', 'Very Hard', '2200+', null, true),
  ('m1', 'Master', 'Complex Calculation', 'Tactical Puzzle', 'In deep calculation with multiple branches, what is the critical skill that separates masters from experts?', array['Speed alone', 'Accurate evaluation of resulting quiet positions at the end of each branch', 'Memorizing more openings', 'Playing faster blitz']::text[], 1, 'Masters excel at accurately evaluating the resulting positions after forced sequences, not just finding the moves.', 'Calculation is only as good as your evaluation of the final position.', 'Master', '2400+', null, true),
  ('m2', 'Master', 'GM Positions', 'Position Evaluation', 'In a position with mutual weaknesses and dynamic balance, top engines often disagree slightly with human evaluation because:', array['Engines are always wrong', 'Engines calculate concrete lines deeply while humans weigh long-term strategic factors differently', 'Humans are always more accurate', 'There''s no difference']::text[], 1, 'Engines excel at concrete tactical evaluation; understanding why an evaluation holds requires human-style strategic insight.', 'Combining engine accuracy with human strategic understanding is the modern approach to mastery.', 'Master', '2400+', null, true),
  ('m3', 'Master', 'High-Level Endgames', 'Find the Plan', 'In a theoretically drawn but practically difficult endgame, what should a strong player prioritize?', array['Resigning immediately', 'Setting maximum practical problems for the opponent to solve under time pressure', 'Offering a draw immediately', 'Playing randomly']::text[], 1, 'Creating maximum practical difficulty in objectively equal or slightly worse positions is a hallmark of top-level play.', 'Practical chances often matter more than theoretical evaluation in human games.', 'Master', '2500+', null, true)
on conflict (id) do update set
  rating_group = excluded.rating_group,
  topic = excluded.topic,
  question_type = excluded.question_type,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_index = excluded.answer_index,
  explanation = excluded.explanation,
  learning_note = excluded.learning_note,
  difficulty = excluded.difficulty,
  strength_needed = excluded.strength_needed,
  fen = excluded.fen,
  is_published = excluded.is_published
;

insert into public.quiz_questions (id, category, prompt, options, answer_index, explanation, is_published) values
  ('7b2016a1-dc04-4057-ae33-cd0a2c010758', 'opening', 'What does it mean to ''control the center'' in the opening?', array['Place pawns and pieces to influence d4/d5/e4/e5', 'Move your king to the center', 'Avoid developing pieces', 'Trade all central pawns immediately']::text[], 0, 'Central control restricts your opponent''s piece mobility and supports your own development.', true),
  ('31fc51f8-954f-4cc5-a180-ae9a47090ea2', 'opening', 'Which opening is known for an early kingside fianchetto by White?', array['Italian Game', 'King''s Indian Attack', 'Queen''s Gambit', 'French Defense']::text[], 1, 'The King''s Indian Attack features an early g3 and Bg2 fianchetto setup.', true),
  ('79c4d71a-187a-4633-ab3c-2c6fb82af99b', 'opening', 'True or False: It''s generally good to move your queen out very early in the opening.', array['True', 'False']::text[], 1, 'Early queen moves often waste tempo as the opponent develops with tempo by attacking the queen.', true),
  ('b87690d8-4572-4aeb-a8ed-63e463872533', 'middlegame', 'What is ''prophylaxis'' in chess strategy?', array['Attacking immediately', 'Preventing your opponent''s plans before executing your own', 'Sacrificing material for speed', 'A type of opening']::text[], 1, 'Prophylaxis means anticipating and preventing opponent''s ideas — a key Karpov/Petrosian theme.', true),
  ('9da6f1c5-f1cf-4e88-aa64-0a791f128f3e', 'middlegame', 'A ''minority attack'' typically refers to:', array['Attacking with fewer pawns against a pawn majority to create weaknesses', 'Always attacking with the queen alone', 'An illegal strategy', 'Attacking only in the endgame']::text[], 0, 'Minority attacks (e.g., b4-b5 vs a pawn majority) aim to create structural weaknesses in the opponent''s camp.', true),
  ('d67c5555-0982-4583-a803-6c8ceb01461a', 'endgame', 'What is the ''opposition'' in king and pawn endgames?', array['When kings face each other with one square between them and it''s the opponent''s move', 'A type of checkmate', 'An illegal position', 'A pawn structure']::text[], 0, 'Having the opposition forces your opponent''s king to give way, which is often key to winning king/pawn endgames.', true),
  ('d2427f1d-ef37-40e3-a77a-e3b8d6df9ed3', 'endgame', 'In rook endgames, where should a rook be placed relative to passed pawns?', array['In front of the pawn always', 'Behind the pawn (yours or the opponent''s)', 'On the side of the board', 'It doesn''t matter']::text[], 1, 'Tarrasch''s Rule: rooks belong behind passed pawns, whether they''re your own (to support) or the opponent''s (to attack).', true),
  ('a8511026-9eab-47ab-a302-b3ea8780bc79', 'tactics', 'What tactic involves attacking two pieces at once with a single piece?', array['A pin', 'A fork', 'A skewer', 'Zugzwang']::text[], 1, 'A fork attacks two or more pieces simultaneously, typically with a knight or pawn.', true),
  ('40646b9a-17fd-4ce1-a143-3955843c706c', 'tactics', 'A ''skewer'' is best described as:', array['Attacking a less valuable piece first, forcing it to move and expose a more valuable piece behind it', 'Trading pieces equally', 'A type of checkmate', 'Castling early']::text[], 0, 'A skewer is like a reverse pin — the more valuable piece is in front and forced to move.', true),
  ('d0f80979-52b2-44b0-ad43-b6977d92277e', 'strategy', 'What does ''piece activity'' generally refer to?', array['How many pieces you have', 'How effectively your pieces influence the board', 'The color of your pieces', 'How fast you move']::text[], 1, 'Piece activity measures how much influence and mobility your pieces have, often more important than material alone.', true),
  ('6a6697e8-cad8-4aa3-a5b2-578546ac538e', 'strategy', 'A ''good bishop'' is typically one that:', array['Is blocked by its own pawns', 'Has open diagonals not blocked by its own pawns', 'Is traded early', 'Stays on the back rank']::text[], 1, 'A good bishop has freedom of movement; a bad bishop is hemmed in by its own pawn structure.', true),
  ('08b32b6e-3050-4bdd-a664-992e9310d547', 'calculation', 'When calculating, which moves should you consider first?', array['Quiet developing moves', 'Forcing moves: checks, captures, and threats', 'Random moves', 'Only pawn moves']::text[], 1, 'Forcing moves narrow the opponent''s options and are easier to calculate accurately.', true),
  ('4d5604c3-958e-4efb-a7f9-5d399afa1729', 'calculation', 'What is a ''quiet move'' in calculation?', array['A move that doesn''t create immediate threats but improves the position', 'A move that always loses', 'A check', 'A capture']::text[], 0, 'Quiet moves consolidate gains after forcing sequences and are often the hardest to find.', true),
  ('cfde8d4f-3790-4169-a355-9d826822b4a0', 'general', 'Who was the first official World Chess Champion?', array['Paul Morphy', 'Wilhelm Steinitz', 'Emanuel Lasker', 'Bobby Fischer']::text[], 1, 'Wilhelm Steinitz became the first official World Champion in 1886.', true),
  ('89aa4fcc-c04d-48db-a782-0e6772aea064', 'general', 'What does ''FIDE'' stand for?', array['Federation Internationale Des Echecs', 'Federal International Defense Engine', 'French International Chess Exhibition', 'None of the above']::text[], 0, 'FIDE (Fédération Internationale des Échecs) is the international chess governing body.', true)
on conflict (id) do update set
  category = excluded.category,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_index = excluded.answer_index,
  explanation = excluded.explanation,
  is_published = excluded.is_published
;

insert into public.placement_questions (id, question_type, label, prompt, options, answer_index, explanation, sort_order) values
  ('placement-1', 'tactical', 'Tactical Awareness', 'White to move. A rook is on e1, knight on d5, enemy king on g8, enemy queen on d8. What is the winning idea?', array['Rook to e8 — back rank checkmate threat', 'Knight fork on f6 winning the queen', 'Push the f-pawn to create space', 'Trade the rook for the queen']::text[], 1, 'Nf6+ forks king and queen — a classic knight fork pattern on g8+d8.', 0),
  ('placement-2', 'positional', 'Positional Understanding', 'You have a bishop pair vs bishop and knight in an open position. Which plan is most principled?', array['Trade one bishop to simplify', 'Keep the position open — bishops thrive on open diagonals', 'Castle queenside immediately', 'Push pawns on the side where you have more space']::text[], 1, 'Bishop pairs are strongest in open positions. Keeping files and diagonals open maximises their value.', 1),
  ('placement-3', 'endgame', 'Endgame Technique', 'King and pawn endgame: your king is on e4, pawn on e5, enemy king on e7. Whose turn is it and can White win?', array['White wins easily regardless of turn', 'White wins only if it''s White''s turn (opposition)', 'It''s always a draw', 'Black wins with correct play']::text[], 1, 'White needs the opposition (e4 vs e6 or d5 vs d7). If it''s White''s turn with this position, White has the opposition and wins.', 2),
  ('placement-4', 'strategy', 'Strategic Planning', 'You have a isolated queen''s pawn (IQP) on d4. What is the main strategic idea?', array['Trade it off as quickly as possible', 'Use it as a base for piece activity and kingside attacks', 'Advance it immediately to d5', 'Block it with your own pieces']::text[], 1, 'The IQP gives space and piece activity. Use it as a launching pad for central control and dynamic play.', 3),
  ('placement-5', 'pattern', 'Pattern Recognition', 'The ''Lucena position'' is a key technique in which type of endgame?', array['King and pawn endgames', 'Rook endgames', 'Queen endgames', 'Bishop endgames']::text[], 1, 'The Lucena position is the most fundamental winning technique in rook endgames — ''building a bridge''.', 4)
on conflict (id) do update set
  question_type = excluded.question_type,
  label = excluded.label,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_index = excluded.answer_index,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order
;


-- --------------------------------------------------------------------------
-- Skill tree
-- --------------------------------------------------------------------------

insert into public.skill_tree_nodes (id, parent_id, label, icon, accent_colour, description, xp_reward, sort_order) values
  ('root', null, 'Chess Mastery', '♟', null, 'Your complete chess learning journey starts here.', 0, 0),
  ('openings', 'root', 'Openings', '📖', '#C9A84C', 'Master opening principles, repertoire, and theory.', 500, 100),
  ('op_italian', 'openings', 'Italian Game', '♙', '#C9A84C', 'Learn the classical Italian setup, plans, and traps.', 100, 200),
  ('op_sicilian', 'openings', 'Sicilian Defense', '🛡', '#C9A84C', 'Master Black''s most fighting response to 1.e4.', 150, 201),
  ('op_french', 'openings', 'French Defense', '🏰', '#C9A84C', 'Solid defense with long-term counterplay.', 120, 202),
  ('op_london', 'openings', 'London System', '🏙', '#C9A84C', 'Reliable White system requiring minimal theory.', 100, 203),
  ('op_structures', 'openings', 'Pawn Structures', '🧱', '#C9A84C', 'Understand the pawn structures arising from major openings.', 180, 204),
  ('op_orders', 'openings', 'Move Orders', '🔀', '#C9A84C', 'Learn transpositional tricks and move-order nuances.', 120, 205),
  ('tactics', 'root', 'Tactics', '⚔️', '#ef4444', 'Build sharp tactical vision through pattern training.', 500, 101),
  ('tac_forks', 'tactics', 'Forks', '🍴', '#ef4444', 'Attack two pieces simultaneously with a single move.', 80, 200),
  ('tac_pins', 'tactics', 'Pins & Skewers', '📌', '#ef4444', 'Immobilize pieces and win material through line attacks.', 90, 201),
  ('tac_discovered', 'tactics', 'Discovered Attacks', '💥', '#ef4444', 'Reveal powerful attacks by moving a piece out of the way.', 100, 202),
  ('tac_mate_patterns', 'tactics', 'Mate Patterns', '♚', '#ef4444', 'Recognize back rank mates, smothered mates, and more.', 150, 203),
  ('tac_combos', 'tactics', 'Combinations', '⚡', '#ef4444', 'Chain multiple tactical themes into winning sequences.', 200, 204),
  ('calculation', 'root', 'Calculation', '🧠', '#8b5cf6', 'Develop deep, accurate calculation ability.', 500, 102),
  ('calc_candidates', 'calculation', 'Candidate Moves', '🎯', '#8b5cf6', 'Generate and compare candidate moves systematically.', 120, 200),
  ('calc_forcing', 'calculation', 'Forcing Moves', '⚡', '#8b5cf6', 'Identify checks, captures, and threats first.', 100, 201),
  ('calc_sequences', 'calculation', 'Tactical Sequences', '🔗', '#8b5cf6', 'Calculate multi-move sequences to a clear conclusion.', 150, 202),
  ('calc_long', 'calculation', 'Long Calculation', '🔭', '#8b5cf6', 'Extend your calculation horizon to 6+ moves deep.', 200, 203),
  ('endgames', 'root', 'Endgames', '♔', '#2563EB', 'Convert advantages and defend difficult positions.', 500, 103),
  ('end_kp', 'endgames', 'King & Pawn', '♟', '#2563EB', 'Master opposition, key squares, and the square rule.', 100, 200),
  ('end_philidor', 'endgames', 'Philidor Position', '🛡', '#2563EB', 'The essential defensive technique in rook endgames.', 120, 201),
  ('end_lucena', 'endgames', 'Lucena Position', '🏆', '#2563EB', 'Bridge-building technique to win rook endgames.', 130, 202),
  ('end_rook', 'endgames', 'Rook Endgames', '♜', '#2563EB', 'Active rook, cutting off the king, passed pawns.', 180, 203),
  ('end_queen', 'endgames', 'Queen Endgames', '♛', '#2563EB', 'Perpetual checks, stalemate tricks, and technique.', 200, 204),
  ('end_minor', 'endgames', 'Minor Piece Endings', '🐴', '#2563EB', 'Good vs bad bishops, knight vs bishop endgames.', 180, 205),
  ('strategy', 'root', 'Middlegame Strategy', '🏰', '#60a5fa', 'Understand plans, structures, and positional play.', 500, 104),
  ('str_outposts', 'strategy', 'Outposts', '🎖', '#60a5fa', 'Create and exploit powerful piece outposts.', 100, 200),
  ('str_weaknesses', 'strategy', 'Weak Squares', '🔍', '#60a5fa', 'Identify and target weak squares in the opponent''s camp.', 110, 201),
  ('str_pawns', 'strategy', 'Pawn Majorities', '♙', '#60a5fa', 'Use pawn majorities to create passed pawns.', 120, 202),
  ('str_minority', 'strategy', 'Minority Attack', '⚔', '#60a5fa', 'Undermine the opponent''s pawn majority.', 150, 203),
  ('str_planning', 'strategy', 'Strategic Planning', '🗺', '#60a5fa', 'Formulate and execute multi-move strategic plans.', 200, 204),
  ('visualization', 'root', 'Visualization', '👁', '#fb7185', 'See further ahead and calculate without moving pieces.', 400, 105),
  ('vis_board', 'visualization', 'Board Awareness', '🗂', '#fb7185', 'Hold the full board position in your mind.', 100, 200),
  ('vis_ahead', 'visualization', 'Seeing Ahead', '🔮', '#fb7185', 'Visualize positions 3-5 moves in the future.', 150, 201),
  ('vis_blindfold', 'visualization', 'Blindfold Training', '🙈', '#fb7185', 'Practice calculating without looking at the board.', 200, 202),
  ('psychology', 'root', 'Chess Psychology', '💭', '#f59e0b', 'Master the mental side of chess competition.', 300, 106),
  ('psy_pressure', 'psychology', 'Handling Pressure', '💪', '#f59e0b', 'Stay calm and accurate in critical moments.', 100, 200),
  ('psy_mistakes', 'psychology', 'Recovering from Mistakes', '🔄', '#f59e0b', 'Bounce back psychologically after blunders.', 120, 201),
  ('psy_time', 'psychology', 'Time Management', '⏱', '#f59e0b', 'Allocate thinking time efficiently throughout the game.', 130, 202)
on conflict (id) do update set
  parent_id = excluded.parent_id,
  label = excluded.label,
  icon = excluded.icon,
  accent_colour = excluded.accent_colour,
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order
;

insert into public.skill_tree_prerequisites (node_id, requires_node_id) values
  ('openings', 'root'),
  ('op_italian', 'openings'),
  ('op_sicilian', 'openings'),
  ('op_french', 'openings'),
  ('op_london', 'openings'),
  ('op_structures', 'op_italian'),
  ('op_structures', 'op_london'),
  ('op_orders', 'op_structures'),
  ('tactics', 'root'),
  ('tac_forks', 'tactics'),
  ('tac_pins', 'tactics'),
  ('tac_discovered', 'tactics'),
  ('tac_mate_patterns', 'tac_forks'),
  ('tac_mate_patterns', 'tac_pins'),
  ('tac_combos', 'tac_mate_patterns'),
  ('tac_combos', 'tac_discovered'),
  ('calculation', 'root'),
  ('calc_candidates', 'calculation'),
  ('calc_forcing', 'calculation'),
  ('calc_sequences', 'calc_candidates'),
  ('calc_sequences', 'calc_forcing'),
  ('calc_long', 'calc_sequences'),
  ('endgames', 'root'),
  ('end_kp', 'endgames'),
  ('end_philidor', 'end_kp'),
  ('end_lucena', 'end_kp'),
  ('end_rook', 'end_philidor'),
  ('end_rook', 'end_lucena'),
  ('end_queen', 'end_rook'),
  ('end_minor', 'end_rook'),
  ('strategy', 'root'),
  ('str_outposts', 'strategy'),
  ('str_weaknesses', 'strategy'),
  ('str_pawns', 'str_outposts'),
  ('str_minority', 'str_pawns'),
  ('str_planning', 'str_minority'),
  ('str_planning', 'str_weaknesses'),
  ('visualization', 'calculation'),
  ('vis_board', 'visualization'),
  ('vis_ahead', 'vis_board'),
  ('vis_blindfold', 'vis_ahead'),
  ('psychology', 'root'),
  ('psy_pressure', 'psychology'),
  ('psy_mistakes', 'psychology'),
  ('psy_time', 'psy_pressure')
on conflict do nothing;


-- --------------------------------------------------------------------------
-- Economy: reward rules, achievements, store
-- --------------------------------------------------------------------------

insert into public.reward_rules (reward_type, label, coins, xp, is_enabled) values
  ('course_complete', 'Course completed', 100, 250, true),
  ('course_test', 'Test completed', 50, 100, true),
  ('course_test_bonus', '80%+ test score bonus', 25, 50, true),
  ('puzzle_solved', 'Puzzle solved', 5, 15, true),
  ('puzzle_pack', 'Puzzle pack (10 solved)', 60, 120, true),
  ('daily_questions', 'Daily Questions session', 20, 30, true),
  ('weekly_mission', 'Weekly mission complete', 200, 300, true)
on conflict (reward_type) do update set
  label = excluded.label,
  coins = excluded.coins,
  xp = excluded.xp,
  is_enabled = excluded.is_enabled
;

insert into public.reward_rules (reward_type, label, coins, xp, is_enabled) values
  ('streak_milestone', 'Streak milestone reached', 75, 150, true),
  ('store_purchase', 'Store purchase', 0, 0, true)
on conflict (reward_type) do update set
  label = excluded.label,
  coins = excluded.coins,
  xp = excluded.xp,
  is_enabled = excluded.is_enabled
;

insert into public.achievements (id, label, description, icon, criteria, sort_order) values
  ('first_course', 'Tactical Apprentice', 'Complete your first course', '🏆', '{"kind":"transaction_count","type":"course_complete","target":1}'::jsonb, 0),
  ('first_test_80', 'Sharp Mind', 'Score 80%+ on a course test', '🎯', '{"kind":"transaction_count","type":"course_test_bonus","target":1}'::jsonb, 1),
  ('streak_7', 'Consistent Learner', 'Reach a 7-day learning streak', '🔥', '{"kind":"transaction_count","type":"streak_milestone","reference":"streak:7","target":1}'::jsonb, 2),
  ('coins_1000', 'Coin Collector', 'Earn 1,000 lifetime ProphyCoins', '🪙', '{"kind":"lifetime_earned","target":1000}'::jsonb, 3),
  ('first_purchase', 'Smart Investor', 'Unlock your first premium resource', '💎', '{"kind":"unlock_count","target":1}'::jsonb, 4),
  ('five_courses', 'Well Rounded', 'Complete 5 courses', '🌟', '{"kind":"transaction_count","type":"course_complete","target":5}'::jsonb, 5)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  icon = excluded.icon,
  criteria = excluded.criteria,
  sort_order = excluded.sort_order
;

insert into public.store_items (id, title, description, icon, difficulty, target_rating, price_coins, price_real, sort_order, is_published) values
  ('store1', 'Advanced Calculation Mastery', 'Deep calculation training for sharp, forcing positions.', '🧮', 'Advanced', '1600–1900', 2000, null, 0, true),
  ('store2', '100 Tactical Positions', 'A hand-picked set of tactical puzzles across every major motif.', '🧩', 'Intermediate', '1200–1700', 500, null, 1, true),
  ('store3', 'Endgame Mastery Pack', 'Rook, minor-piece, and pawn endgames every serious player needs.', '♚', 'Advanced', '1500–2000', 1500, null, 2, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  difficulty = excluded.difficulty,
  target_rating = excluded.target_rating,
  price_coins = excluded.price_coins,
  price_real = excluded.price_real,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published
;


-- --------------------------------------------------------------------------
-- ChessWiki
-- --------------------------------------------------------------------------

insert into public.wiki_categories (id, label, icon, description, sort_order) values
  ('openings', 'Openings', '♟️', 'Opening systems, variations, ideas and famous games.', 0),
  ('tactics', 'Tactics', '🧩', 'Forks, pins, skewers, discovered attacks, sacrifices, etc.', 1),
  ('strategy', 'Strategy', '🧠', 'Pawn structures, positional concepts, planning, piece activity.', 2),
  ('endgames', 'Endgames', '🏁', 'King and pawn endings, rook endings, minor-piece endings, theoretical positions.', 3),
  ('players', 'Players', '👑', 'Chess players, their careers, playing styles, achievements and famous games.', 4),
  ('tournaments', 'Tournaments', '🏆', 'Major tournaments, championships and important historical events.', 5),
  ('history', 'History', '📜', 'Important events and developments in chess history.', 6),
  ('concepts', 'Chess Concepts', '📖', 'General chess terminology and concepts.', 7)
on conflict (id) do update set
  label = excluded.label,
  icon = excluded.icon,
  description = excluded.description,
  sort_order = excluded.sort_order
;

insert into public.wiki_articles (id, category_id, title, short_description, content, fen, move_sequence, image_url, tags, is_featured, show_puzzles_cta, show_opening_tool_cta, puzzle_theme_hint, status) values
  ('w1', 'openings', 'Sicilian Defense', 'The most popular and combative response to 1.e4, leading to sharp, asymmetrical positions.', '## Overview
The Sicilian Defense begins 1.e4 c5 and is Black''s most popular and successful response to 1.e4 at every level of play. Rather than mirroring White''s central control, Black stakes a claim on the d4 square from the side, leading to imbalanced, fighting positions.

## Main Ideas
Black accepts a slightly passive position in the center in exchange for active piece play and good attacking chances against White''s king, especially in lines where White castles queenside.

## Variations
- **Open Sicilian** (2.Nf3 and 3.d4) — the main line, leading to sharp theoretical battles
- **Najdorf Variation** (2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6) — the most popular and deeply analyzed line in modern chess
- **Dragon Variation** — Black fianchettoes the bishop to g7 for a razor-sharp opposite-side attacking game
- **Sveshnikov Variation** — an aggressive, theory-heavy line embraced at the highest level

## Famous Games
The Sicilian has produced some of the most celebrated attacking games in chess history, including many Kasparov–Karpov world championship battles fought in Najdorf and Scheveningen structures.

## Learn More
Work through ChessProphy''s Sicilian repertoire courses and drilling lines in Openings to build this into your own game.', null, 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', null, array['sicilian', 'e4', 'opening theory', 'black repertoire']::text[], true, true, true, 'sicilian', 'published'),
  ('w2', 'openings', 'Najdorf Variation', 'The most deeply studied line of the Sicilian, a favorite of Fischer and Kasparov.', '## Overview
The Najdorf Variation arises after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6. The quiet-looking 5...a6 is one of the most flexible and battle-tested moves in chess, preparing ...e5 or ...b5 while denying White''s pieces the b5 square.

## Main Ideas
Black keeps maximum flexibility, often expanding on the queenside with ...b5 while White chooses between the aggressive English Attack (Be3, f3, Qd2, O-O-O) or quieter systems.

## Variations
- **English Attack** — White''s most testing try, aiming for a kingside pawn storm
- **6.Bg5** — the classical main line, leading to razor-sharp theory
- **6.Be2** — a quieter, positional approach

## Famous Games
Bobby Fischer and Garry Kasparov both used the Najdorf as their primary weapon against 1.e4 for most of their careers, producing some of the richest opening theory in chess.

## Learn More
See the Sicilian Defense article for the broader family this variation belongs to.', null, 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', null, array['sicilian', 'najdorf', 'opening theory']::text[], false, true, true, 'sicilian', 'published'),
  ('w3', 'tactics', 'The Fork', 'A single move that attacks two or more enemy pieces at once — one of the first tactical motifs every player learns.', '## Overview
A fork occurs when one piece attacks two (or more) enemy pieces simultaneously, forcing the opponent to lose material because they can only save one. Knights are especially notorious forking pieces due to their unusual movement pattern, but every piece — including pawns and kings — can deliver a fork.

## Main Ideas
The strongest forks target the king alongside another valuable piece, since a check must be answered immediately, leaving no time to save the second attacked piece.

## Typical Positions
A classic pattern: a knight landing on a square that simultaneously attacks the enemy king and an undefended rook — often called a ''royal fork''.

## Related Articles
See Pin and Skewer for the other core pieces of tactical vision.', 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', null, null, array['tactics', 'fork', 'knight', 'beginner']::text[], true, true, false, 'fork', 'published'),
  ('w4', 'tactics', 'Pin', 'Immobilizing an enemy piece because moving it would expose a more valuable piece behind it.', '## Overview
A pin restricts an enemy piece from moving because doing so would expose a more valuable piece — often the king — to attack. A pin against the king is absolute: the pinned piece legally cannot move at all.

## Main Ideas
Pinned pieces are frequently weak points to pile pressure onto with additional attackers, since the defender can''t simply move the pinned piece away.

## Related Articles
See The Fork and Skewer for related tactical motifs.', 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/3B4/PPPP1PPP/RNBQK1NR b KQkq - 3 3', null, null, array['tactics', 'pin', 'beginner']::text[], false, true, false, 'pin', 'published'),
  ('w5', 'concepts', 'Zugzwang', 'A position where a player is at a disadvantage because they are forced to move, and every legal move worsens their position.', '## Overview
Zugzwang (German for ''compulsion to move'') describes a position where any legal move a player makes weakens their position — but since passing isn''t allowed in chess, they''re forced to move anyway. It''s most common in the endgame, where the shortage of pieces makes ''waiting'' options scarce.

## Main Ideas
Understanding zugzwang is essential for endgame technique, particularly in king and pawn endings, where a single tempo can decide the outcome.

## Typical Positions
A classic example: a king and pawn endgame where the defending king must give way and let the attacking king through, purely because it has no other legal move.

## Related Articles
See Opposition, a closely related king-and-pawn endgame concept.', '8/8/8/4k3/4P3/4K3/8/8 b - - 0 1', null, null, array['endgame', 'zugzwang', 'concept']::text[], true, false, false, null, 'published'),
  ('w6', 'endgames', 'Opposition', 'A key king-and-pawn endgame technique where the kings face each other and whoever must move is at a disadvantage.', '## Overview
Opposition occurs when two kings face each other on the same file, rank, or diagonal with exactly one square between them. Whichever side is NOT required to move ''has the opposition'' and holds the advantage, since the opponent''s king must give ground.

## Main Ideas
Mastering opposition is the foundation of virtually all king and pawn endgame technique — it determines whether a lone king can stop a passed pawn, or whether an attacking king can force its way past a defender.

## Related Articles
See Zugzwang, the broader principle opposition is built on.', '8/8/4k3/8/4K3/8/4P3/8 w - - 0 1', null, null, array['endgame', 'opposition', 'king and pawn']::text[], false, false, false, null, 'published'),
  ('w7', 'players', 'Garry Kasparov', 'World Chess Champion from 1985–2000 and one of the most dominant and influential players in chess history.', '## Overview
Garry Kasparov became the youngest World Chess Champion in history in 1985 at age 22, and held the title until 2000. Known for his aggressive, deeply-prepared attacking style, he dominated top-level chess for close to two decades.

## Playing Style
Kasparov was famous for exceptionally sharp opening preparation — particularly in the Sicilian Najdorf and King''s Indian Defense — combined with relentless calculation and attacking energy in the middlegame.

## Famous Games
His 1999 ''Kasparov''s Immortal'' against Veselin Topalov is widely considered one of the greatest attacking games ever played.

## Related Articles
See Sicilian Defense and Najdorf Variation for the openings most associated with his repertoire.', null, null, null, array['players', 'world champion', 'kasparov']::text[], false, false, false, null, 'published'),
  ('w8', 'history', 'The Immortal Game', 'Anderssen vs. Kieseritzky, London 1851 — one of the most famous games ever played, celebrated for its audacious sacrifices.', '## Overview
Played in London in 1851 during a break in the first international tournament, Adolf Anderssen''s game against Lionel Kieseritzky became known as ''The Immortal Game'' for its stunning series of sacrifices — Anderssen gave up a bishop, both rooks, and his queen before delivering checkmate with his three remaining minor pieces.

## Why It Matters
The game is a landmark of the Romantic era of chess, when bold attacking play and material sacrifice for initiative were prized above solid, positional technique.

## Related Articles
See Garry Kasparov for a look at how attacking chess evolved into the modern era.', null, 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#', null, array['history', 'famous games', 'romantic era']::text[], true, false, false, null, 'published')
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  short_description = excluded.short_description,
  content = excluded.content,
  fen = excluded.fen,
  move_sequence = excluded.move_sequence,
  image_url = excluded.image_url,
  tags = excluded.tags,
  is_featured = excluded.is_featured,
  show_puzzles_cta = excluded.show_puzzles_cta,
  show_opening_tool_cta = excluded.show_opening_tool_cta,
  puzzle_theme_hint = excluded.puzzle_theme_hint,
  status = excluded.status
;

insert into public.wiki_article_links (article_id, link_kind, target_id, sort_order) values
  ('w1', 'article', 'w2', 0),
  ('w1', 'article', 'w7', 1),
  ('w2', 'article', 'w1', 0),
  ('w3', 'article', 'w4', 0),
  ('w4', 'article', 'w3', 0),
  ('w5', 'article', 'w6', 0),
  ('w6', 'article', 'w5', 0),
  ('w7', 'article', 'w1', 0),
  ('w7', 'article', 'w2', 1),
  ('w8', 'article', 'w7', 0)
on conflict do nothing;


-- --------------------------------------------------------------------------
-- Site settings
-- --------------------------------------------------------------------------

insert into public.site_settings (id, site_name, tagline, seo_title, hero_title, hero_subtitle, hero_cta_label, primary_colour, accent_colour, discord_url, youtube_url, twitter_url, maintenance_mode, banner_active, banner_text, banner_colour, homepage) values
  (true, 'ChessProphy', 'AI-Powered Chess Learning Platform', null, 'Master Chess with AI-Powered Learning', 'Personalized training, daily puzzles, and an AI coach - all in one place.', 'Start Learning Free', '#2563EB', '#C9A84C', null, null, null, false, false, null, '#2563EB', '{"features":[{"id":"f1","icon":"🧩","title":"Daily Puzzles","desc":"Sharpen tactics with a fresh puzzle every day."},{"id":"f2","icon":"🧠","title":"AI Coach","desc":"Personalized feedback powered by ChessProphy AI."},{"id":"f3","icon":"♔","title":"Opening Trainer","desc":"Master repertoires with spaced repetition."}],"stats":[{"id":"st1","label":"Active Members","value":"4,812"},{"id":"st2","label":"Puzzles Solved","value":"1.2M"},{"id":"st3","label":"Studies","value":"340"}],"testimonials":[{"id":"t1","quote":"ChessProphy took my rating from 1200 to 1600 in six months.","author":"— PawnStorm99"},{"id":"t2","quote":"The daily puzzles and streak system actually got me to practice every day for the first time.","author":"— Marcus L."},{"id":"t3","quote":"I started at 800 and now I''m comfortably above 1200. The structured courses made the difference.","author":"— Tomás R."}]}'::jsonb)
on conflict (id) do update set
  site_name = excluded.site_name,
  tagline = excluded.tagline,
  seo_title = excluded.seo_title,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_cta_label = excluded.hero_cta_label,
  primary_colour = excluded.primary_colour,
  accent_colour = excluded.accent_colour,
  discord_url = excluded.discord_url,
  youtube_url = excluded.youtube_url,
  twitter_url = excluded.twitter_url,
  maintenance_mode = excluded.maintenance_mode,
  banner_active = excluded.banner_active,
  banner_text = excluded.banner_text,
  banner_colour = excluded.banner_colour,
  homepage = excluded.homepage
;


-- --------------------------------------------------------------------------
-- News, events and announcements
-- --------------------------------------------------------------------------

insert into public.news_posts (id, title, content, cover_url, author, tags, published_at, status) values
  ('ad29535b-565b-41ac-ae54-6c069cb7ca32', 'Welcome to ChessProphy', 'We''ve launched a brand-new learning platform — dashboards, puzzles, an AI coach, and more.', null, 'ChessProphy Team', array['announcement']::text[], now(), 'published')
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  cover_url = excluded.cover_url,
  author = excluded.author,
  tags = excluded.tags,
  published_at = excluded.published_at,
  status = excluded.status
;

insert into public.events (id, title, description, banner_url, event_type, organizer, starts_at, register_url, participant_cap, is_featured, status) values
  ('3e44bb86-d315-4871-ab85-44113a1d457c', 'Weekend Rapid Open', 'A free rapid tournament open to all rating levels.', null, 'Rapid', 'ChessProphy Team', now() + interval '7 days', null, 128, true, 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  banner_url = excluded.banner_url,
  event_type = excluded.event_type,
  organizer = excluded.organizer,
  starts_at = excluded.starts_at,
  register_url = excluded.register_url,
  participant_cap = excluded.participant_cap,
  is_featured = excluded.is_featured,
  status = excluded.status
;

insert into public.announcements (id, title, body, scope, is_active) values
  ('f405db1a-d034-4ca9-a5f5-1749a1bdf5a0', 'New Puzzle System Launched!', 'Daily puzzles, Puzzle of the Day, and ratings are now live.', 'Global', true)
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  scope = excluded.scope,
  is_active = excluded.is_active
;


commit;

-- Summary of what this file loads:
--   openings 9 | variations 12 | moves 100
--   puzzles 10 | classic games 30
--   study categories 3 | courses 9 | chapters 25
--   daily questions 28 | quiz questions 15 | placement 5
--   skill tree nodes 40 | prerequisites 45
--   achievements 6 | store items 3
--   wiki categories 8 | wiki articles 8
