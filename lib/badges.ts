// Badge definitions for each built exercise
// Each exercise has 4 badges: Novice, Adept, Expert, Master

export type BadgeTier = 'novice' | 'adept' | 'expert' | 'master'

export interface BadgeDefinition {
  id: string
  name: string
  tier: BadgeTier
  description: string
  // Threshold is an array to support multiple metrics (e.g., [accuracy, reaction_time])
  threshold: number[]
  // For games where lower is better (e.g., reaction-time), set this to true
  lowerIsBetter?: boolean
}

export interface GameBadges {
  gameId: string
  badges: BadgeDefinition[]
}

// Badge definitions for each built exercise
export const GAME_BADGES: Record<string, BadgeDefinition[]> = {
  'aim-trainer': [
    {
      id: 'aim-trainer-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Aim Trainer',
      threshold: [0, 2000] // Any accuracy, 2000ms or slower
    },
    {
      id: 'aim-trainer-adept',
      name: 'Adept',
      tier: 'adept',
      description: '60% accuracy, 950ms reaction time',
      threshold: [60, 950] // Level 5 threshold
    },
    {
      id: 'aim-trainer-expert',
      name: 'Expert',
      tier: 'expert',
      description: '90% accuracy, 520ms reaction time',
      threshold: [90, 520] // Level 12 threshold
    },
    {
      id: 'aim-trainer-master',
      name: 'Master',
      tier: 'master',
      description: '100% accuracy, 400ms reaction time',
      threshold: [100, 400] // Level 20 threshold
    }
  ],
  'typing-test': [
    {
      id: 'typing-test-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Typing Test',
      threshold: [0] // Any WPM
    },
    {
      id: 'typing-test-adept',
      name: 'Adept',
      tier: 'adept',
      description: '45 WPM',
      threshold: [45] // Level 7 threshold
    },
    {
      id: 'typing-test-expert',
      name: 'Expert',
      tier: 'expert',
      description: '85 WPM',
      threshold: [85] // Level 14 threshold
    },
    {
      id: 'typing-test-master',
      name: 'Master',
      tier: 'master',
      description: '130 WPM',
      threshold: [130] // Level 20 threshold
    }
  ],
  'reaction-time': [
    {
      id: 'reaction-time-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Reaction Time',
      threshold: [1400],
      lowerIsBetter: true
    },
    {
      id: 'reaction-time-adept',
      name: 'Adept',
      tier: 'adept',
      description: '500ms average',
      threshold: [500],
      lowerIsBetter: true
    },
    {
      id: 'reaction-time-expert',
      name: 'Expert',
      tier: 'expert',
      description: '300ms average',
      threshold: [300],
      lowerIsBetter: true
    },
    {
      id: 'reaction-time-master',
      name: 'Master',
      tier: 'master',
      description: '200ms average',
      threshold: [200],
      lowerIsBetter: true
    }
  ],
  'memory': [
    {
      id: 'memory-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Memory Exercise',
      threshold: [1] // Level 1
    },
    {
      id: 'memory-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Reached Level 5',
      threshold: [5]
    },
    {
      id: 'memory-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Reached Level 10',
      threshold: [10]
    },
    {
      id: 'memory-master',
      name: 'Master',
      tier: 'master',
      description: 'Reached Level 15',
      threshold: [15]
    }
  ],
  'visual-memory': [
    {
      id: 'visual-memory-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Visual Memory',
      threshold: [1] // Level 1
    },
    {
      id: 'visual-memory-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Reached Level 5',
      threshold: [5]
    },
    {
      id: 'visual-memory-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Reached Level 10',
      threshold: [10]
    },
    {
      id: 'visual-memory-master',
      name: 'Master',
      tier: 'master',
      description: 'Reached Level 15',
      threshold: [15]
    }
  ],
  'sequence-memory': [
    {
      id: 'sequence-memory-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Sequence Memory',
      threshold: [1] // Level 1
    },
    {
      id: 'sequence-memory-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Reached Level 5',
      threshold: [5]
    },
    {
      id: 'sequence-memory-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Reached Level 10',
      threshold: [10]
    },
    {
      id: 'sequence-memory-master',
      name: 'Master',
      tier: 'master',
      description: 'Reached Level 15',
      threshold: [15]
    }
  ],
  'number-memory': [
    {
      id: 'number-memory-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Number Memory',
      threshold: [1] // 1 digit
    },
    {
      id: 'number-memory-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Remembered 8 digits',
      threshold: [8]
    },
    {
      id: 'number-memory-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Remembered 15 digits',
      threshold: [15]
    },
    {
      id: 'number-memory-master',
      name: 'Master',
      tier: 'master',
      description: 'Remembered 25 digits',
      threshold: [25]
    }
  ],
  'pattern-recognition': [
    {
      id: 'pattern-recognition-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Pattern Recognition',
      threshold: [1] // 1 pattern
    },
    {
      id: 'pattern-recognition-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Solved 9 patterns',
      threshold: [9]
    },
    {
      id: 'pattern-recognition-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Solved 19 patterns',
      threshold: [19]
    },
    {
      id: 'pattern-recognition-master',
      name: 'Master',
      tier: 'master',
      description: 'Solved 28 patterns',
      threshold: [28]
    }
  ],
  'stroop-test': [
    {
      id: 'stroop-test-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Stroop Test',
      threshold: [0] // Any score
    },
    {
      id: 'stroop-test-adept',
      name: 'Adept',
      tier: 'adept',
      description: '14 correct answers',
      threshold: [14] // ~55% of 25 questions
    },
    {
      id: 'stroop-test-expert',
      name: 'Expert',
      tier: 'expert',
      description: '23 correct answers',
      threshold: [23] // ~92% of 25 questions
    },
    {
      id: 'stroop-test-master',
      name: 'Master',
      tier: 'master',
      description: '25 correct answers',
      threshold: [25] // Perfect score
    }
  ],
  'chimp-test': [
    {
      id: 'chimp-test-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Chimp Test',
      threshold: [1] // 1 pattern
    },
    {
      id: 'chimp-test-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Remembered 5 patterns',
      threshold: [5]
    },
    {
      id: 'chimp-test-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Remembered 14 patterns',
      threshold: [14]
    },
    {
      id: 'chimp-test-master',
      name: 'Master',
      tier: 'master',
      description: 'Remembered 20 patterns',
      threshold: [20]
    }
  ],
  'maze': [
    {
      id: 'maze-novice',
      name: 'Novice',
      tier: 'novice',
      description: 'Completed Maze',
      threshold: [120000], // 120 seconds (2 minutes) or slower
      lowerIsBetter: true
    },
    {
      id: 'maze-adept',
      name: 'Adept',
      tier: 'adept',
      description: 'Completed in 45 seconds',
      threshold: [45000], // Level 5 threshold
      lowerIsBetter: true
    },
    {
      id: 'maze-expert',
      name: 'Expert',
      tier: 'expert',
      description: 'Completed in 18 seconds',
      threshold: [18000], // Level 12 threshold
      lowerIsBetter: true
    },
    {
      id: 'maze-master',
      name: 'Master',
      tier: 'master',
      description: 'Completed in 9 seconds',
      threshold: [9000], // Level 20 threshold
      lowerIsBetter: true
    }
  ]
}

// List of built games (not marked as "Soon")
export const BUILT_GAMES = [
  'aim-trainer',
  'typing-test',
  'memory',
  'pattern-recognition',
  'reaction-time',
  'number-memory',
  'visual-memory',
  'stroop-test',
  'sequence-memory',
  'chimp-test',
  'maze'
]

// Check if a user has earned a badge based on their score
export function hasEarnedBadge(gameId: string, badge: BadgeDefinition, score: any): boolean {
  if (!score) return false

  switch (gameId) {
    case 'aim-trainer':
      // Check both accuracy and reaction time
      const accuracy = score.accuracy || 0
      const reactionTime = score.reaction_time || 2000
      return accuracy >= badge.threshold[0] && reactionTime <= badge.threshold[1]

    case 'typing-test':
      const wpm = score.wpm || 0
      return wpm >= badge.threshold[0]

    case 'reaction-time':
      // Lower is better
      const fastestTime = score.fastest_time || 1000
      return fastestTime <= badge.threshold[0]

    case 'memory':
    case 'visual-memory':
    case 'sequence-memory':
      const level = score.level_reached || 0
      return level >= badge.threshold[0]

    case 'number-memory':
      const digits = score.longest_sequence || 0
      return digits >= badge.threshold[0]

    case 'pattern-recognition':
      const patterns = score.patterns_solved || 0
      return patterns >= badge.threshold[0]

    case 'stroop-test':
      // Stroop test uses correct_answers count directly
      const correctAnswers = score.correct_answers || 0
      return correctAnswers >= badge.threshold[0]

    case 'chimp-test':
      const patternsRemembered = score.patterns_remembered || 0
      return patternsRemembered >= badge.threshold[0]

    case 'maze':
      // Lower is better for maze
      const timeTaken = score.time_taken || 60000
      return timeTaken <= badge.threshold[0]

    default:
      return false
  }
}

// Get all earned badges for an exercise
export function getEarnedBadges(gameId: string, score: any): BadgeDefinition[] {
  const badges = GAME_BADGES[gameId] || []
  return badges.filter(badge => hasEarnedBadge(gameId, badge, score))
}

// Get all earned badges across all games
export function getAllEarnedBadges(gameScores: Record<string, any>): Record<string, BadgeDefinition[]> {
  const earned: Record<string, BadgeDefinition[]> = {}
  
  BUILT_GAMES.forEach(gameId => {
    const score = gameScores[gameId]
    earned[gameId] = getEarnedBadges(gameId, score)
  })
  
  return earned
}

