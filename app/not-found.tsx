import Link from 'next/link'
import SiteShell from '@/components/SiteShell'

export default function NotFound() {
  return (
    <SiteShell>
      <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="text-display-xl font-bold">
          Signal lost.
        </h1>
        <p className="mt-6 max-w-md text-lg text-gray-600 dark:text-gray-400">
          There&apos;s nothing to measure at this address. The test you&apos;re after may have moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary px-6 py-3">
            Browse all tests
          </Link>
          <Link href="/games/reaction-time" className="btn-ghost px-6 py-3">
            Take the reaction test
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
