# Brain Benchmark

**The benchmark for human capability.** We benchmark AI models on everything; this is the benchmark for people — short, honest tests that each isolate one thing a human mind can do, ranked live against everyone else and rolled up into a personal capability profile.

Live at [brain-benchmark.com](https://brain-benchmark.com).

## The tests

20 tests across 7 capabilities. The taxonomy lives in [`lib/domains.ts`](lib/domains.ts); every test is registered in [`types/games.ts`](types/games.ts).

| Capability | Tests |
| --- | --- |
| **Speed** | Reaction Time, Aim Trainer |
| **Memory** | Number Memory, Verbal Memory ✦, Visual Memory, Chimp Test, Sequence Memory |
| **Attention** | Stroop Test, Flanker ✦ |
| **Perception** | Color Perception ✦, Time Estimation |
| **Reasoning** | Mental Rotation ✦, Tangrams, Maze, Sudoku |
| **Numeracy** | Arithmetic, Algebra, Geometry |
| **Language** | Typing Test, Word Search |

✦ = added in the 2026 revamp. Each new test fills a gap so every capability has at least two tests, and each is a classic cognitive-psychology paradigm (continuous recognition, Eriksen flanker, colour-discrimination staircase, Shepard–Metzler rotation). Sources are listed on the [About page](app/about/page.tsx).

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres + RPC + Realtime) for scores and leaderboards
- PostHog for product analytics

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Environment (`.env`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_POSTHOG_KEY=...      # optional
NEXT_PUBLIC_SITE_URL=https://brain-benchmark.com
```

## Database

SQL lives in [`database/`](database). Nothing is applied automatically: run it in the Supabase SQL editor (project ref `snzsigjseoduyjhqxbwn`, see the `types` script in `package.json`). Every file is safe to re-run.

1. `new_tests.sql` — tables, RLS (read-only), realtime and submit functions for the four new tests.
2. **Then** `game_stats.sql` and `recent_activity.sql` — the overview and live-feed RPCs. These reference the new tables, so apply step 1 first or the RPCs will error.
3. **`lockdown.sql` — must be run once on the existing database.** Older versions of `rls-policies.sql` added a public UPDATE policy and `GRANT ALL` to `anon` on the original 16 tables, which let anyone with the public anon key edit leaderboard rows through the REST API. This script leaves clients with SELECT only on every `*_scores` table; scores are written only through the `submit_*_score` RPCs. The query at the end of the script confirms the result.

Other files: `game_submitting.sql` (submit RPCs for the original 16 tests), `rls-policies.sql` (RLS and grants for the original 16 tables), and `proposed-score-checks.sql` (optional plausibility CHECK constraints, e.g. reaction times > 50 ms — review the ranges before running).

The anon key is public, so never add INSERT, UPDATE or DELETE policies or grants for `anon`/`authenticated` on score tables; add a `SECURITY DEFINER` submit RPC instead. Supabase grants `ALL` on new tables by default, so new score tables need an explicit `REVOKE ALL` followed by `GRANT SELECT`.

`npm run types` regenerates `types/database.types.ts` from the live project.

## Project structure

```
app/
  page.tsx                Home: hero, live results, capability sections
  games/[id]/page.tsx     Test page (server: per-test metadata) → components/TestPage
  [username]/page.tsx     Public capability profile (radar)
  about/page.tsx          Positioning, method and references
components/
  SiteShell, SiteHeader, SiteFooter, UserMenu   Site chrome
  TestPage.tsx            Test header, record / your best / runs strip, related tests
  GameRenderer.tsx        Code-split map of test id → component
  GameWrapper.tsx, Leaderboard.tsx              Shared leaderboard under each test
  games/*.tsx             One component per test
lib/
  domains.ts              The 7 capabilities (labels, taglines, colours)
  format-score.ts         One formatter for every score shape
  radar.ts                Per-test strength vs record → profile radar
  scores.ts               Supabase submit/fetch per test
types/games.ts            Test registry (name, capability, how-to, metric, table)
```

## Adding a test

1. **SQL** — create `<test>_scores`, RLS (select only), a `SECURITY DEFINER` `submit_<test>_score` function, and add the table to the `supabase_realtime` publication. Add a block to `game_stats.sql` and `recent_activity.sql`. `database/new_tests.sql` is a template.
2. **Types & API** — add the table to `types/database.types.ts` (or run `npm run types`), and `submit…`/`get…` functions to `lib/scores.ts`.
3. **Registry** — add an entry to `GAMES` in `types/games.ts` and an icon in `components/icons/GameIcons.tsx`.
4. **Scoring** — add a case to `formatScoreSummary` (`lib/format-score.ts`) and `getGameStrength` (`lib/radar.ts`).
5. **Component** — create `components/games/<Test>.tsx` following `Flanker.tsx` (status row → stage → result → `GameWrapper` leaderboard) and register it in `components/GameRenderer.tsx`.

## Design system

The brand is "instrument, not toy": ink on paper, one accent, monospaced numbers.

- **Colour** — `gray-*` is a warm ink/paper scale; `blue-*` / `signal-*` is the single cobalt accent; `volt` (#d4ff3f) is a sparing highlight for records and "you". Each capability has its own colour in `lib/domains.ts`, used only for small markers.
- **Type** — Space Grotesk (UI/display) + JetBrains Mono (numbers, labels).
- **Components** — `.card`, `.btn-primary`, `.btn-ink`, `.btn-ghost`, `.chip`, `.chip-volt`, `.eyebrow`, `.num`, `.input` in `app/tailwind.css`.

## License

MIT — see [LICENSE](LICENSE).
