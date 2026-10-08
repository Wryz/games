import type { Metadata } from 'next'
import Link from 'next/link'
import SiteShell from '@/components/SiteShell'
import { DOMAINS } from '@/lib/domains'
import { GAMES } from '@/types/games'

export const metadata: Metadata = {
  title: 'About & method',
  description:
    'Why Brain Benchmark exists, which classic cognitive-psychology paradigms each test is based on, and what the scores can and cannot tell you.',
}

const PARADIGMS: { domain: string; title: string; body: string; ref: string }[] = [
  {
    domain: 'motor',
    title: 'Mental chronometry',
    body: 'Reaction Time and Aim Trainer descend from the oldest measurement in psychology: how long it takes to turn a stimulus into a response. Simple reaction time is one of the most reliable individual-difference measures there is.',
    ref: 'Jensen, A. R. (2006). Clocking the Mind: Mental Chronometry and Individual Differences. Elsevier.',
  },
  {
    domain: 'memory',
    title: 'Span and recognition',
    body: 'Number Memory is a digit-span task; Visual, Sequence and Chimp tests probe visuospatial and serial-order memory. Verbal Memory uses continuous recognition — deciding, word by word, whether you have seen it before.',
    ref: 'Miller, G. A. (1956). The magical number seven, plus or minus two. Psychological Review, 63(2), 81–97. · Shepard, R. N. (1967). Recognition memory for words, sentences, and pictures. JVLVB, 6(1), 156–163. · Inoue, S., & Matsuzawa, T. (2007). Working memory of numerals in chimpanzees. Current Biology, 17(23), R1004–R1005.',
  },
  {
    domain: 'cognitive',
    title: 'Interference control',
    body: 'The Stroop and Flanker tasks measure how well you hold a goal while something else pulls at your attention — conflicting word meaning in one, conflicting neighbours in the other. Flanker reports your "interference cost" directly.',
    ref: 'MacLeod, C. M. (1991). Half a century of research on the Stroop effect. Psychological Bulletin, 109(2), 163–203. · Eriksen, B. A., & Eriksen, C. W. (1974). Effects of noise letters upon the identification of a target letter. Perception & Psychophysics, 16(1), 143–149.',
  },
  {
    domain: 'perception',
    title: 'Thresholds and timing',
    body: 'Color Perception is a staircase: the shade difference shrinks until you can no longer resolve it. Time Estimation measures interval timing — how accurately you can reproduce a duration with no clock to look at.',
    ref: 'Grondin, S. (2010). Timing and time perception. Attention, Perception, & Psychophysics, 72(3), 561–582.',
  },
  {
    domain: 'puzzles',
    title: 'Spatial reasoning',
    body: 'Mental Rotation is a 2D version of the Shepard–Metzler task, where response time grows with the angle you must rotate through — we show you that "rotation cost". Tangrams, Maze and Sudoku add planning and deduction.',
    ref: 'Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. Science, 171(3972), 701–703. · Uttal, D. H., et al. (2013). The malleability of spatial skills. Psychological Bulletin, 139(2), 352–402.',
  },
  {
    domain: 'computation',
    title: 'Numerical fluency',
    body: 'Arithmetic, Algebra and Geometry are sudden-death fluency tests: accuracy first, then speed. They lean on learned knowledge as well as raw processing, which makes them the most trainable tests on the site.',
    ref: 'Fluency-based math measures are standard in educational assessment; ours are not normed against a reference population.',
  },
  {
    domain: 'linguistic',
    title: 'Language production',
    body: 'Typing Test measures words per minute with accuracy; Word Search measures how quickly you can find and spell words in a field of letters.',
    ref: 'WPM is computed as correct characters ÷ 5 per minute, the convention used by most typing benchmarks.',
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="container-page py-14 sm:py-20">
        {/* Manifesto */}
        <div className="max-w-3xl">
          <p className="eyebrow mb-4">About</p>
          <h1 className="text-display-xl font-bold">
            The benchmark
            <br />
            for people.
          </h1>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            <p>
              Every new AI model ships with a page of benchmark scores. Humans don&apos;t get one. Brain Benchmark is our
              attempt at that page: a set of short, standardised exercises that each isolate one thing a human mind
              can do, and measure it honestly.
            </p>
            <p>
              There are {GAMES.length} tests across {DOMAINS.length} capabilities. Each takes one to a few minutes, needs no
              account, and puts your result on a live leaderboard next to everyone else&apos;s. Over time your results
              build a capability profile — a map of where you are strong and what to test next.
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-800">
            <h2 className="text-2xl font-semibold tracking-tight">What each test is based on</h2>
            <span className="eyebrow hidden sm:inline">References</span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {PARADIGMS.map(p => {
              const domain = DOMAINS.find(d => d.key === p.domain)!
              const tests = GAMES.filter(g => g.category === p.domain)
              return (
                <article key={p.domain} className="grid gap-4 py-8 lg:grid-cols-[14rem_1fr_1fr] lg:gap-10">
                  <div>
                    <p className="eyebrow mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: domain.color }} />
                      {domain.label}
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight">{p.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tests.map(t => (
                        <Link key={t.id} href={`/games/${t.id}`} className="chip hover:border-gray-400 hover:text-gray-950 dark:hover:border-gray-600 dark:hover:text-white">
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <p className="leading-relaxed text-gray-700 dark:text-gray-300">{p.body}</p>
                  <p className="font-mono text-xs leading-relaxed text-gray-500 dark:text-gray-500">{p.ref}</p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Scoring + limits */}
        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="card p-7">
            <p className="eyebrow mb-3">How scores work</p>
            <ul className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <li>Each test is ranked on one primary metric, shown on its page (e.g. average ms, highest level, correct answers).</li>
              <li>Ties on accuracy-based tests are broken by average response time.</li>
              <li>
                Your profile scores each capability 0–100 as your best result relative to the current record, averaged
                across that capability&apos;s tests. Untaken tests count as zero.
              </li>
            </ul>
          </div>
          <div className="card border-amber-300/60 p-7 dark:border-amber-500/30">
            <p className="eyebrow mb-3 text-amber-700 dark:text-amber-400">Limits — please read</p>
            <ul className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <li>These are not clinical or diagnostic instruments and are not normed against a reference population.</li>
              <li>
                Hardware matters: screen refresh, input latency, display calibration and room lighting all affect speed
                and perception results.
              </li>
              <li>
                Practice improves scores on the trained task; evidence that it transfers to broader abilities is mixed.
              </li>
            </ul>
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary px-6 py-3">
            Take a test →
          </Link>
          <a href={`mailto:wrysplays@gmail.com?subject=${encodeURIComponent('Brain Benchmark — test idea')}`} className="btn-ghost px-6 py-3">
            Suggest a test
          </a>
        </div>
      </div>
    </SiteShell>
  )
}
