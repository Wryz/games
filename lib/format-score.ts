import { formatNumber } from './levels'

type ScoreLike = Record<string, any> | null | undefined

function seconds(ms: number | null | undefined): string {
  const total = ms || 0
  const s = Math.floor(total / 1000)
  const tenths = Math.floor((total % 1000) / 100)
  return `${formatNumber(s)}.${tenths}s`
}

/**
 * One place to turn a raw score row (from a table, get_game_stats_overview or
 * get_recent_activity) into display text. Used by the home grid, live feed,
 * test pages and the profile.
 */
export function formatScoreSummary(gameId: string, score: ScoreLike): string {
  if (!score) return '—'

  switch (gameId) {
    case 'aim-trainer':
      return `${formatNumber(score.reaction_time)}ms · ${formatNumber(score.accuracy)}%`
    case 'typing-test':
      return `${formatNumber(score.wpm)} WPM · ${formatNumber(score.accuracy)}%`
    case 'reaction-time':
      return `${formatNumber(score.average_time)}ms avg`
    case 'memory':
    case 'visual-memory':
    case 'color-perception':
      return `Level ${formatNumber(score.level_reached)}`
    case 'number-memory':
      return `${formatNumber(score.longest_sequence)} digits`
    case 'verbal-memory':
      return `${formatNumber(score.words_remembered)} words`
    case 'chimp-test':
      return `${formatNumber(score.patterns_remembered)} numbers`
    case 'stroop-test':
      return `${formatNumber(score.correct_answers)} correct · ${formatNumber(score.average_time)}ms`
    case 'time-estimation':
      return `±${formatNumber(score.average_accuracy)}ms avg`
    case 'maze':
    case 'sudoku':
    case 'tangrams':
      return seconds(score.time_taken)
    case 'algebra':
    case 'arithmetic':
    case 'geometry':
    case 'flanker':
    case 'mental-rotation':
      return `${formatNumber(score.correct_answers)} correct · ${formatNumber(score.average_time)}ms`
    case 'word-search':
      return `${formatNumber(score.characters_found)} letters`
    case 'object-tracking':
      return `${formatNumber(score.objects_tracked)} objects`
    default:
      return score.level_reached != null ? `Level ${formatNumber(score.level_reached)}` : '—'
  }
}

/** "Selective attention (Eriksen…)" → "selective attention (Eriksen…)" without mangling proper nouns. */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}
