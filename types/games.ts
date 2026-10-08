import { ComponentType } from 'react'
import {
  AimTrainerIcon,
  TypingTestIcon,
  MemoryIcon,
  ReactionTimeIcon,
  NumberMemoryIcon,
  VisualMemoryIcon,
  StroopTestIcon,
  ChimpTestIcon,
  AlgebraIcon,
  ArithmeticIcon,
  GeometryIcon,
  TimeEstimationIcon,
  WordSearchIcon,
  MazeIcon,
  SudokuIcon,
  TangramsIcon,
  VerbalMemoryIcon,
  MentalRotationIcon,
  ColorPerceptionIcon,
  FlankerIcon,
} from '@/components/icons/GameIcons'
import type { DomainKey } from '@/lib/domains'

export interface Game {
  id: string
  name: string
  /** Short card description */
  description: string
  icon: ComponentType<{ className?: string; size?: number }>
  /** Capability domain (see lib/domains.ts) */
  category: DomainKey
  /** The specific capability this test isolates */
  measures: string
  /** How to play, in one or two sentences */
  howTo: string
  /** Typical time to complete one run */
  duration: string
  /** What the leaderboard ranks on */
  metric: string
  /** Supabase table holding this test's scores */
  table: string
  /** Recently added — highlighted in the UI */
  isNew?: boolean
}

export const GAMES: Game[] = [
  // ── Speed ────────────────────────────────────────────────
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    description: 'Click the instant the screen turns green.',
    icon: ReactionTimeIcon,
    category: 'motor',
    measures: 'Simple visual reaction time',
    howTo: 'Wait for red to turn green, then click as fast as you can. Five trials; clicking early restarts the trial.',
    duration: '~1 min',
    metric: 'Average ms · lower is better',
    table: 'reaction_time_scores',
  },
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    description: 'Hit targets as quickly and accurately as you can.',
    icon: AimTrainerIcon,
    category: 'motor',
    measures: 'Visuomotor speed and precision',
    howTo: 'Thirty targets appear one at a time on an 8×8 grid. Click each as fast as you can; clicking the wrong cell lowers your accuracy.',
    duration: '~1 min',
    metric: 'Accuracy, then ms per target',
    table: 'aim_trainer_scores',
  },

  // ── Memory ───────────────────────────────────────────────
  {
    id: 'number-memory',
    name: 'Number Memory',
    description: 'Recall ever-longer strings of digits.',
    icon: NumberMemoryIcon,
    category: 'memory',
    measures: 'Verbal working-memory span (digit span)',
    howTo: 'A number appears for a moment. Type it back from memory and press Enter; each round adds a digit, and one mistake ends the run.',
    duration: '2–4 min',
    metric: 'Longest sequence recalled',
    table: 'number_memory_scores',
  },
  {
    id: 'verbal-memory',
    name: 'Verbal Memory',
    description: 'Seen it, or new? Keep as many words in mind as you can.',
    icon: VerbalMemoryIcon,
    category: 'memory',
    measures: 'Recognition memory for words',
    howTo: 'Words appear one at a time. Mark each as SEEN if it appeared before in this run, or NEW if not. Three mistakes and you are out.',
    duration: '2–5 min',
    metric: 'Words scored',
    table: 'verbal_memory_scores',
    isNew: true,
  },
  {
    id: 'visual-memory',
    name: 'Visual Memory',
    description: 'Remember which tiles lit up — one more every level.',
    icon: VisualMemoryIcon,
    category: 'memory',
    measures: 'Visuospatial working memory',
    howTo: 'Tiles on a 5×5 grid flash briefly. Select the same tiles and submit; each level adds one tile, and one wrong answer ends the run.',
    duration: '2–4 min',
    metric: 'Highest level',
    table: 'visual_memory_scores',
  },
  {
    id: 'chimp-test',
    name: 'Chimp Test',
    description: 'The test chimpanzees famously beat humans at.',
    icon: ChimpTestIcon,
    category: 'memory',
    measures: 'Spatial working memory under time pressure',
    howTo: 'Numbered tiles show for 3 seconds, then hide. Click their spots in order from 1; each level adds a number, and one wrong click ends the run.',
    duration: '2–4 min',
    metric: 'Total numbers clicked correctly',
    table: 'chimp_test_scores',
  },
  {
    id: 'memory',
    name: 'Sequence Memory',
    description: 'Repeat a growing sequence of flashes.',
    icon: MemoryIcon,
    category: 'memory',
    measures: 'Serial-order memory',
    howTo: 'Watch the tiles light up, then repeat the pattern in the same order. One step is added each level, and one wrong tap ends the run.',
    duration: '2–4 min',
    metric: 'Highest level',
    table: 'memory_scores',
  },

  // ── Attention ────────────────────────────────────────────
  {
    id: 'stroop-test',
    name: 'Stroop Test',
    description: 'Name the ink color, not the word.',
    icon: StroopTestIcon,
    category: 'cognitive',
    measures: 'Interference control (Stroop effect)',
    howTo: 'A color word appears in a colored ink. Click the ink color, not the word, as fast as you can; one wrong answer ends the run.',
    duration: '1–3 min',
    metric: 'Correct answers',
    table: 'stroop_test_scores',
  },
  {
    id: 'flanker',
    name: 'Flanker',
    description: 'Which way does the middle arrow point?',
    icon: FlankerIcon,
    category: 'cognitive',
    measures: 'Selective attention (Eriksen flanker task)',
    howTo: 'Five arrows appear. Respond to the direction of the centre arrow only, ignoring the arrows around it. Use ← / → or tap.',
    duration: '~1 min',
    metric: 'Correct, then average ms',
    table: 'flanker_scores',
    isNew: true,
  },

  // ── Perception ───────────────────────────────────────────
  {
    id: 'color-perception',
    name: 'Color Perception',
    description: 'Spot the tile that is a slightly different shade.',
    icon: ColorPerceptionIcon,
    category: 'perception',
    measures: 'Color discrimination threshold',
    howTo: 'One tile in the grid is a different shade. Tap it. The difference shrinks every level; three misses ends the run.',
    duration: '1–3 min',
    metric: 'Highest level',
    table: 'color_perception_scores',
    isNew: true,
  },
  {
    id: 'time-estimation',
    name: 'Time Estimation',
    description: 'Stop the clock exactly on target — without seeing it.',
    icon: TimeEstimationIcon,
    category: 'perception',
    measures: 'Interval timing',
    howTo: 'You see a target of 3–10 seconds, then a countdown starts a hidden timer. Click when you think the target has passed. Three rounds, scored on average error.',
    duration: '~1 min',
    metric: 'Average error ms · lower is better',
    table: 'time_estimation_scores',
  },

  // ── Reasoning ────────────────────────────────────────────
  {
    id: 'mental-rotation',
    name: 'Mental Rotation',
    description: 'Same shape rotated, or its mirror image?',
    icon: MentalRotationIcon,
    category: 'puzzles',
    measures: 'Spatial visualisation (Shepard–Metzler)',
    howTo: 'Two shapes are shown. Decide whether the right one is the left one rotated (SAME) or a mirror image (MIRROR).',
    duration: '~2 min',
    metric: 'Correct, then average ms',
    table: 'mental_rotation_scores',
    isNew: true,
  },
  {
    id: 'tangrams',
    name: 'Tangrams',
    description: 'Drag seven pieces to fill the silhouette.',
    icon: TangramsIcon,
    category: 'puzzles',
    measures: 'Spatial problem solving',
    howTo: 'Drag the seven pieces onto the silhouette — they are already oriented and snap into place. Press Submit when it is covered; only a correct solve is scored.',
    duration: '2–6 min',
    metric: 'Time · lower is better',
    table: 'tangrams_scores',
  },
  {
    id: 'maze',
    name: 'Maze',
    description: 'Find the way out as fast as you can.',
    icon: MazeIcon,
    category: 'puzzles',
    measures: 'Route planning',
    howTo: 'Guide the ball from Start to Exit through a 20×20 maze with the arrow keys or the on-screen arrows. The clock starts on your first move.',
    duration: '1–3 min',
    metric: 'Time · lower is better',
    table: 'maze_scores',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Complete the 9×9 grid with no repeats.',
    icon: SudokuIcon,
    category: 'puzzles',
    measures: 'Logical deduction',
    howTo: 'Fill every row, column and 3×3 box with 1–9, each exactly once, then press Submit. Only a fully correct grid counts.',
    duration: '3–8 min',
    metric: 'Time · lower is better',
    table: 'sudoku_scores',
  },

  // ── Numeracy ─────────────────────────────────────────────
  {
    id: 'arithmetic',
    name: 'Arithmetic',
    description: "Twenty problems. One mistake and you're out.",
    icon: ArithmeticIcon,
    category: 'computation',
    measures: 'Arithmetic fluency',
    howTo: 'Type the answer to each problem and press Enter. Get all 20 right to finish; one wrong answer ends the run, and speed breaks ties.',
    duration: '1–2 min',
    metric: 'Correct, then average ms',
    table: 'arithmetic_scores',
  },
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Solve for x — quickly.',
    icon: AlgebraIcon,
    category: 'computation',
    measures: 'Symbolic reasoning',
    howTo: 'Solve each equation for x, type it and press Enter. Get all 20 right to finish; one wrong answer ends the run.',
    duration: '1–3 min',
    metric: 'Correct, then average ms',
    table: 'algebra_scores',
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: 'Angles, areas and shapes at speed.',
    icon: GeometryIcon,
    category: 'computation',
    measures: 'Geometric reasoning',
    howTo: 'Pick the right answer from four choices for each geometry question. Get all 10 right to finish; one wrong answer ends the run.',
    duration: '~1 min',
    metric: 'Correct, then average ms',
    table: 'geometry_scores',
  },

  // ── Language ─────────────────────────────────────────────
  {
    id: 'typing-test',
    name: 'Typing Test',
    description: 'Words per minute, measured honestly.',
    icon: TypingTestIcon,
    category: 'linguistic',
    measures: 'Typing speed and accuracy',
    howTo: 'Type the words shown as quickly and accurately as you can. You have 60 seconds, starting with your first keystroke.',
    duration: '~1 min',
    metric: 'Words per minute',
    table: 'typing_test_scores',
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Spell as many words as you can in 60 seconds.',
    icon: WordSearchIcon,
    category: 'linguistic',
    measures: 'Visual word recognition',
    howTo: 'Drag in a straight line across the 8×8 grid to spell words of three or more letters. The 60-second clock starts on your first drag; you score one point per letter found.',
    duration: '~1 min',
    metric: 'Letters found',
    table: 'word_search_scores',
  },
]

export const GAME_BY_ID: Record<string, Game> = GAMES.reduce(
  (acc, g) => {
    acc[g.id] = g
    return acc
  },
  {} as Record<string, Game>
)
