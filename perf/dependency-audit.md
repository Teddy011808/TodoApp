# Dependency audit

Measured on the production build with `vite build --sourcemap` + `source-map-explorer`,
before any changes. Minified bytes shipped in the single JS chunk (501.7 KB):

| Package | Minified | Share | Used by the app? |
| --- | ---: | ---: | --- |
| `react-dom` | 203.4 KB | 40.5% | Yes — every page |
| `@supabase/auth-js` | 97.1 KB | 19.4% | Yes — sign-in, session |
| `react-router` | 38.2 KB | 7.6% | Yes — every page |
| our code (`src/`) | 37.9 KB | 7.5% | — |
| `@supabase/realtime-js` | 30.0 KB | 6.0% | **No** — no subscriptions anywhere |
| `@supabase/phoenix` | 25.1 KB | 5.0% | **No** — Realtime's socket library |
| `@supabase/storage-js` | 22.0 KB | 4.4% | Only the avatar uploader (one route) |
| `@supabase/postgrest-js` | 16.0 KB | 3.2% | Yes — every query |
| `@supabase/supabase-js` | 10.4 KB | 2.1% | Wrapper only |
| `react` | 8.0 KB | 1.6% | Yes |
| `iceberg-js` | 5.2 KB | 1.0% | **No** — Storage analytics buckets |
| `scheduler` | 3.4 KB | 0.7% | Yes (React) |
| `@supabase/functions-js` | 2.8 KB | 0.6% | **No** — no Edge Functions |

## Finding

`@supabase/supabase-js` constructs every sub-client in its constructor — Realtime is
created eagerly, Storage and Functions are class members — so a bundler cannot tree-shake
the parts an app never calls. This app uses exactly three: auth, the database (PostgREST)
and Storage (one feature).

## Decision: replace `@supabase/supabase-js` with its sub-packages

`src/lib/supabase.ts` now builds the client from `@supabase/auth-js` and
`@supabase/postgrest-js`, wired the way supabase-js wires them internally: the same
`sb-<ref>-auth-token` storage key (existing sessions carry over) and a `fetch` that sends
the anon key plus the signed-in user's access token. `@supabase/storage-js` moved to
`src/lib/storage.ts`, imported only by the avatar hook, so it ships in the lazy Habits
chunk.

**Trade-off:** three packages to keep on matching versions instead of one, and new
supabase-js features don't arrive automatically. Acceptable for an app whose surface is
fixed at auth + queries + one upload.

## Also considered

| Candidate | Verdict |
| --- | --- |
| `react-router-dom` (38 KB) → hand-rolled router | Keep. Nested layouts, `Navigate`, `useSearchParams` and route state are all in use; re-implementing them saves bytes and costs correctness. |
| `workbox-window` (5.7 KB, own chunk) | Keep. Needed for the update prompt; already loaded separately. |
| `react-dom` → Preact compat | Out of scope. Biggest single win (~190 KB) but swaps the renderer under React 19 features in use. |

## Result

| Chunk | Before | After |
| --- | ---: | ---: |
| Main `index-*.js` | 513.71 kB (gzip 148.20) | 403.11 kB (gzip 117.86) |
| `HabitsPage-*.js` (lazy) | — | 41.25 kB (gzip 11.54) |
| `workbox-window` | 5.65 kB | 5.65 kB |

−110.6 kB (−21.5%) on the main chunk: −69.9 kB from the dependency swap, −40.7 kB from
the Habits split. Raw output: `build-before.txt`, `build-after.txt`.
