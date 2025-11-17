import { ComponentType } from 'react'
import {
  AimTrainerIcon,
  TypingTestIcon,
  MemoryIcon,
  PatternRecognitionIcon,
  ReactionTimeIcon,
  NumberMemoryIcon,
  VisualMemoryIcon,
  StroopTestIcon,
  SequenceMemoryIcon,
  ChimpTestIcon,
  AlgebraIcon,
  LinearAlgebraIcon,
  CalculusIcon,
  GeometryIcon
} from '@/components/icons/GameIcons'

export interface Game {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string; size?: number }>
  category: 'cognitive' | 'motor' | 'memory' | 'perception' | 'computation'
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
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identify and complete visual patterns',
    icon: PatternRecognitionIcon,
    category: 'perception'
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
    id: 'sequence-memory',
    name: 'Sequence Memory',
    description: 'Remember the order of highlighted squares',
    icon: SequenceMemoryIcon,
    category: 'memory'
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
    id: 'linear-algebra',
    name: 'Linear Algebra',
    description: 'Work with vectors, matrices, and linear transformations',
    icon: LinearAlgebraIcon,
    category: 'computation'
  },
  {
    id: 'calculus',
    name: 'Calculus',
    description: 'Master derivatives, integrals, and limits',
    icon: CalculusIcon,
    category: 'computation'
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: 'Explore shapes, angles, and spatial relationships',
    icon: GeometryIcon,
    category: 'computation'
  }
]
