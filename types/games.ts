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
  TangramsIcon
} from '@/components/icons/GameIcons'

export interface Game {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string; size?: number }>
  category: 'cognitive' | 'motor' | 'memory' | 'perception' | 'computation' | 'attention' | 'language' | 'social' | 'creative' | 'puzzles' | 'linguistic'
}

export const GAMES: Game[] = [
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    description: 'Improve your precision and reaction time',
    icon: AimTrainerIcon,
    category: 'motor'
  },
  {
    id: 'typing-test',
    name: 'Typing Test',
    description: 'Test and improve your typing speed and accuracy',
    icon: TypingTestIcon,
    category: 'motor'
  },
  {
    id: 'memory',
    name: 'Memory Game',
    description: 'Challenge your working memory with sequences',
    icon: MemoryIcon,
    category: 'memory'
  },
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    description: 'Test how fast you can respond to stimuli',
    icon: ReactionTimeIcon,
    category: 'motor'
  },
  {
    id: 'number-memory',
    name: 'Number Memory',
    description: 'Remember and recall sequences of numbers',
    icon: NumberMemoryIcon,
    category: 'memory'
  },
  {
    id: 'visual-memory',
    name: 'Visual Memory',
    description: 'Remember positions and patterns',
    icon: VisualMemoryIcon,
    category: 'memory'
  },
  {
    id: 'stroop-test',
    name: 'Stroop Test',
    description: 'Test your cognitive flexibility and attention',
    icon: StroopTestIcon,
    category: 'cognitive'
  },
  {
    id: 'chimp-test',
    name: 'Chimp Test',
    description: 'Test your working memory like a chimpanzee',
    icon: ChimpTestIcon,
    category: 'cognitive'
  },
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Solve equations and master algebraic concepts',
    icon: AlgebraIcon,
    category: 'computation'
  },
  {
    id: 'arithmetic',
    name: 'Arithmetic',
    description: 'Master basic math operations and calculations',
    icon: ArithmeticIcon,
    category: 'computation'
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: 'Explore shapes, angles, and spatial relationships',
    icon: GeometryIcon,
    category: 'computation'
  },
  {
    id: 'time-estimation',
    name: 'Time Estimation',
    description: 'Measure your perception of time and temporal awareness',
    icon: TimeEstimationIcon,
    category: 'perception'
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Find hidden words in letter grids',
    icon: WordSearchIcon,
    category: 'linguistic'
  },
  {
    id: 'maze',
    name: 'Maze',
    description: 'Navigate through complex mazes and test your spatial awareness',
    icon: MazeIcon,
    category: 'puzzles'
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Fill the 6×6 grid so each 3×3 box contains 1–9 with no repeats in rows or columns',
    icon: SudokuIcon,
    category: 'puzzles'
  },
  {
    id: 'tangrams',
    name: 'Tangrams',
    description: 'Arrange seven shapes to match the silhouette as fast as you can',
    icon: TangramsIcon,
    category: 'puzzles'
  }
]
