import type { Metadata } from 'next'
import SiteShell from '@/components/SiteShell'
import TestPage from '@/components/TestPage'
import { lowerFirst } from '@/lib/format-score'
import { GAME_BY_ID } from '@/types/games'

interface GamePageProps {
  params: { id: string }
}

export function generateMetadata({ params }: GamePageProps): Metadata {
  const game = GAME_BY_ID[params.id]
  if (!game) return { title: 'Test not found' }
  const description = `${game.description} A free ${game.duration} test of ${lowerFirst(game.measures)} — ranked against everyone on Brain Benchmark.`
  return {
    title: `${game.name} test`,
    description,
    alternates: { canonical: `/games/${game.id}` },
    openGraph: { title: `${game.name} — Brain Benchmark`, description },
    twitter: { title: `${game.name} — Brain Benchmark`, description },
  }
}

export default function GamePage({ params }: GamePageProps) {
  return (
    <SiteShell>
      <TestPage gameId={params.id} />
    </SiteShell>
  )
}
