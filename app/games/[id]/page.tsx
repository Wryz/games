import type { Metadata } from 'next'
import SiteShell from '@/components/SiteShell'
import TestPage from '@/components/TestPage'
import { lowerFirst } from '@/lib/format-score'
import { GAME_BY_ID } from '@/types/games'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params
  const game = GAME_BY_ID[id]
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

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
  return (
    <SiteShell>
      <TestPage gameId={id} />
    </SiteShell>
  )
}
