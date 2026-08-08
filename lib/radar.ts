import { GAMES, type Game } from '@/types/games'
import type { GameCategory } from '@/lib/levels'

export interface RadarGameStat {
  id: string
  userBest: {
    value: string
    score?: Record<string, unknown> | null
  } | null
  topScore: {
    username: string
    value: string
    score?: Record<string, unknown> | null
  } | null
}

export interface CategoryRadarAxis {
  key: GameCategory
  label: string
  value: number
  color: string
  games: Game[]
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  motor: 'Motor',
  memory: 'Memory',
  perception: 'Perception',
  cognitive: 'Cognitive',
  computation: 'Computation',
  linguistic: 'Linguistic',
  attention: 'Attention',
  language: 'Language',
  social: 'Social',
  creative: 'Creative',
  puzzles: 'Puzzles',
}

export const CATEGORY_COLORS: Record<GameCategory, string> = {
  motor: '#3b82f6',
  memory: '#a855f7',
  perception: '#ec4899',
  cognitive: '#06b6d4',
  computation: '#f97316',
  linguistic: '#22c55e',
  attention: '#eab308',
  language: '#6366f1',
  social: '#f43f5e',
  creative: '#8b5cf6',
  puzzles: '#10b981',
}

function num(score: Record<string, unknown> | null | undefined, key: string): number {
  const v = score?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Higher-is-better: user / top * 100, capped at 100. */
function ratioHigher(user: number, top: number): number {
  if (top <= 0) return user > 0 ? 100 : 0
  return Math.min(100, Math.max(0, (user / top) * 100))
}

/** Lower-is-better: top / user * 100, capped at 100. */
function ratioLower(user: number, top: number): number {
  if (user <= 0) return 0
  if (top <= 0) return 0
  return Math.min(100, Math.max(0, (top / user) * 100))
}

/**
 * Per-game strength 0–100 vs the current top score for that game.
 * Uses the same primary metrics as get_game_stats_overview leaderboard ordering.
 * Unplayed games are 0.
 */
export function getGameStrength(
  gameId: string,
  userScore: Record<string, unknown> | null | undefined,
  topScore: Record<string, unknown> | null | undefined
): number {
  if (!userScore) return 0
  // No global top yet but user has a score — they define the top
  if (!topScore) return 100

  switch (gameId) {
    case 'aim-trainer': {
      const accuracy = ratioHigher(num(userScore, 'accuracy'), num(topScore, 'accuracy'))
      const reaction = ratioLower(num(userScore, 'reaction_time'), num(topScore, 'reaction_time'))
      return (accuracy + reaction) / 2
    }
    case 'typing-test':
      return ratioHigher(num(userScore, 'wpm'), num(topScore, 'wpm'))
    case 'memory':
    case 'visual-memory':
      return ratioHigher(num(userScore, 'level_reached'), num(topScore, 'level_reached'))
    case 'reaction-time':
      // Leaderboard sorts by average_time ASC
      return ratioLower(num(userScore, 'average_time'), num(topScore, 'average_time'))
    case 'number-memory':
      return ratioHigher(num(userScore, 'longest_sequence'), num(topScore, 'longest_sequence'))
    case 'stroop-test':
      return ratioHigher(num(userScore, 'correct_answers'), num(topScore, 'correct_answers'))
    case 'chimp-test':
      return ratioHigher(num(userScore, 'patterns_remembered'), num(topScore, 'patterns_remembered'))
    case 'time-estimation':
      // Leaderboard sorts by average_accuracy ASC (lower error is better)
      return ratioLower(num(userScore, 'average_accuracy'), num(topScore, 'average_accuracy'))
    case 'maze':
    case 'sudoku':
    case 'tangrams':
      return ratioLower(num(userScore, 'time_taken'), num(topScore, 'time_taken'))
    case 'algebra':
    case 'arithmetic':
    case 'geometry': {
      const correct = ratioHigher(num(userScore, 'correct_answers'), num(topScore, 'correct_answers'))
      const time = ratioLower(num(userScore, 'average_time'), num(topScore, 'average_time'))
      return (correct + time) / 2
    }
    case 'word-search':
      return ratioHigher(num(userScore, 'characters_found'), num(topScore, 'characters_found'))
    default:
      return 0
  }
}

/**
 * Build radar axes for categories that have at least one game.
 * Value = average of per-game strength vs top scorers (0 if unplayed).
 */
export function getCategoryRadarAxes(gameStats: RadarGameStat[]): CategoryRadarAxis[] {
  const categories = Array.from(new Set(GAMES.map(g => g.category))) as GameCategory[]

  return categories
    .map(category => {
      const games = GAMES.filter(g => g.category === category)
      if (games.length === 0) return null

      const strengths = games.map(game => {
        const stat = gameStats.find(gs => gs.id === game.id)
        return getGameStrength(
          game.id,
          stat?.userBest?.score as Record<string, unknown> | null | undefined,
          stat?.topScore?.score as Record<string, unknown> | null | undefined
        )
      })

      const value =
        strengths.length > 0
          ? Math.round((strengths.reduce((sum, s) => sum + s, 0) / strengths.length) * 10) / 10
          : 0

      return {
        key: category,
        label: CATEGORY_LABELS[category],
        value,
        color: CATEGORY_COLORS[category],
        games,
      }
    })
    .filter((axis): axis is CategoryRadarAxis => axis !== null)
}
