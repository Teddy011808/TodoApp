# Habits + Todos + User Directory + Shop

**Live:** https://todo-app-tau-bice-28.vercel.app · **Mobile app:** [`mobile/`](mobile/README.md)

A TypeScript React app built across several modules: lifted state, effects with cleanup and
routing (module 3), then a typed async state machine, two contexts and a cart reducer
(module 4).

## Run it

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

`.env` is git-ignored; only `.env.example` (placeholders) is committed. The database
schema lives in `supabase/schema.sql` — see [Habit tracker](#habit-tracker-supabase).

Then open the printed `http://localhost:xxxx` URL.

## Routes

| Route          | Page                                              |
| -------------- | ------------------------------------------------- |
| `/`            | redirects to `/habits`                            |
| `/habits`      | habit tracker — signed-in only (`ProtectedRoute`) |
| `/login`       | Supabase email + password sign-in                 |
| `/signup`      | create an account                                 |
| `/todos`       | todo list with filters + clear completed          |
| `/users`       | user directory (loading / error / empty / data)   |
| `/users/:id`   | user detail, driven by `useParams()`              |
| `/shop`        | product catalogue, dispatches `ADD_ITEM`          |
| `/checkout`    | cart summary read entirely from context           |
| `*`            | 404 catch-all                                     |

Navigation uses `<NavLink>` / `<Link>`, so moving between pages never reloads the document.

## Where the state lives

`TodosPage` is the **single owner** of the todo array and the active filter.
`AddTodo`, `FilterBar`, `TodoList` and `TodoItem` store no todo state at all —
they receive props down (`todos`, `filter`, `completedCount`) and report back up
through callbacks (`onAdd`, `onToggle`, `onDelete`, `onFilterChange`, `onClearCompleted`).

`AddTodo` keeps one piece of local state — the text currently typed into its own
input — which is genuinely local and never shared.

## The effects, and what each cleanup prevents

1. **Window width** — `src/components/LiveStatus.tsx`, `[]`
   `removeEventListener('resize', …)` drops the listener on unmount, which prevents the
   handler stacking up on every remount and leaking the component via the closure.

2. **Search debounce** — `src/pages/UsersPage.tsx`, `[search]`
   `clearTimeout` cancels the pending timer on every keystroke, which prevents one fetch
   per character — only a 300ms pause actually commits a query.

3. **Directory fetch** — inside `useFetch`, `[url]`
   Setting `cancelled = true` makes a late response a no-op, which prevents a slow earlier
   request from overwriting the results of a newer one (the race condition).

4. **User detail fetch** — inside `useFetch`, `[url]` derived from `:id`
   Setting `cancelled = true` makes the response for an old `:id` a no-op, which prevents
   the previous user's data from rendering on the page you just navigated to.

5. **Sign-in redirect** — `src/pages/SignInPage.tsx`, `[user, destination, navigate]`
   Nothing to clean up: it subscribes to no external system, it only redirects once the
   user in context becomes non-null.

## Seeing all four fetch states

- **Loading** — the skeleton rows shown while the request is in flight.
- **Data** — the default view of `/users`.
- **Empty** — type a name that matches nobody, e.g. `zzzzz`.
- **Error** — tick **Simulate API failure**, which points the fetch at a bad endpoint.

## Architecture (module 4)

### `useFetch<T>` — the async state machine

`src/hooks/useFetch.ts` returns `{ data: T | null; loading: boolean; error: string | null }`.

`data` is `T | null` rather than `T`, and that single choice is what forces every consumer
to prove the request finished before touching the value:

```ts
const { data: users } = useFetch<User[]>(url)
users.map(...)        // ✗ error TS18047: 'users' is possibly 'null'
users && users.map(...)  // ✓ narrows to User[]
```

`src/hooks/useFetch.typetest.ts` pins that behaviour down at compile time — uncomment the
line marked ❌ and `npm run typecheck` fails. It is instantiated twice in the app:
`useFetch<User[]>` in `UsersPage`, `useFetch<User>` in `UserDetailPage`.

**On hidden `any`:** the DOM lib types `response.json()` as `Promise<any>`, so that is the
one door `any` can walk through. It is pinned to `Promise<T>` on a single visible line, and
the `catch` binds `err` as `unknown` (not `any`), so the error has to be narrowed before use.

### `AuthContext`

`user` state plus `signIn(email)` / `signOut()`. The context defaults to `null` rather than a
stub object, so `useAuth()` can throw when a consumer sits outside the provider instead of
failing silently with a dead `signIn`. The value is memoised so consumers do not re-render
on every parent render. `NavBar` receives no auth prop — it reads context and swaps between
**Sign in** and **Hi, {user.email}**.

### `CartContext` and the reducer

`src/context/cartReducer.ts` holds every cart rule in one pure function: no fetch, no
localStorage, no console, no mutation, and a `default` branch that returns `state` untouched
behind a `const exhaustive: never = action` check that breaks the build if a new action
member is ever left unhandled.

No prop anywhere in the tree carries cart data. The three consumers — `NavBar`, `ShopPage`
and `CheckoutPage` — each call `useCart()` directly.

### How the discriminated union removes the impossible state

> Because `CartAction` is a discriminated union, each member carries only the payload its own
> branch needs — `REMOVE_ITEM` has an `id` and no `quantity` field at all — so "remove this
> line" can never be expressed as "set its quantity to −1", and the only member that may
> mention a quantity is `UPDATE_QUANTITY`, whose single branch in the reducer turns anything
> at or below zero into a removal, leaving a negative quantity no path into state.

Worth being precise about what this does and does not buy you: the union does not stop you
*typing* `{ type: 'UPDATE_QUANTITY', id, quantity: -1 }` — `quantity` is a `number`. What it
makes unrepresentable is a **stored** line with a negative quantity, because the reducer is
the only writer of state and that one branch collapses `<= 0` into a `filter`.

## Reusable hooks (module 5)

Everything in `src/hooks` starts with `use`, calls hooks only at the top level of
its own body, and is never called conditionally.

### `useLocalStorage(key, initial)`

Reads once through a lazy initialiser, writes on every change, and listens for the
`storage` event so two open tabs stay in step. Every `window.localStorage` access is
wrapped in `try/catch`: Safari private mode throws on `setItem`, the quota can be
full, and a value written by an older build may no longer parse. A storage failure
must never take the UI down with it.

It backs the cart, so the cart now survives a refresh. **Persistence lives in
`CartProvider`, never in the reducer** — the reducer stays pure, exactly as the
previous module required.

### `useDebounce(value, delay)`

Holds its timer handle in a `useRef` so the handle survives re-renders without
causing one, and clears it in the effect cleanup. `UsersPage` shows the raw and
debounced values side by side, so the 500ms lag is visible rather than asserted.

### What broke when the debounce cleanup was removed

I deleted the `clearTimeout` and ran the suite. Two tests failed:

```
FAIL  useDebounce > collapses rapid typing into a single update
      expected '' but got 'Lean'
FAIL  useDebounce > cancels the pending timer when the hook unmounts
      expected "clearTimeout" to be called at least once
```

> Without the cleanup nothing cancels the previous timer, so every keystroke's
> timer survives and fires on its own schedule — the hook stops debouncing and
> degenerates into a 500ms-delayed echo of all eight keystrokes, firing a request
> per character instead of one, and a timer left running past unmount then calls
> `setState` on a component that no longer exists.

## Habit tracker (Supabase)

### Setup

1. Create a Supabase project; copy **Project URL** and the **anon public** key from
   *Project Settings → API* into `.env`. Never put the `service_role` key in a `VITE_`
   variable — Vite bundles every `VITE_` variable into the browser.
2. Run `supabase/schema.sql` in the SQL editor (tables, then RLS, then the seed block
   after signing up once and putting your email in it).
3. For quick local testing, *Authentication → Providers → Email → Confirm email* can be
   turned off so sign-up signs you straight in.

### Schema

- `habits (id, user_id → auth.users, name, created_at)`
- `daily_logs (id, habit_id → habits ON DELETE CASCADE, user_id, log_date)`, unique per
  habit per day. Deleting a habit deletes its logs in the same statement.

### How the pieces fit

- `src/lib/supabase.ts` — the single client, built from `import.meta.env`.
- `AuthContext` — holds the Supabase session, kept current by `onAuthStateChange`
  (which also fires `INITIAL_SESSION` with the session restored from storage, so a
  refresh keeps you signed in). `loading` stays true until that first event.
- `ProtectedRoute` — waits while `loading`, then renders the page or redirects to
  `/login` with `state.from` so sign-in returns you where you were. This is UX only;
  the database enforces access.
- `useHabits(userId)` — list / add / rename / toggle-today / delete, each with loading
  and error state. Toggling today inserts or deletes a `daily_logs` row.

### Row Level Security

RLS is enabled on both tables and every policy is `to authenticated` with
`auth.uid() = user_id` — `USING` for SELECT/DELETE, `WITH CHECK` for INSERT, both for
UPDATE. A second account therefore gets `[]` back — an empty list, not an error.

## Avatars and error boundaries

### Setup

Run `supabase/avatars.sql` in the SQL editor after `schema.sql`. It creates `profiles`,
the public `avatars` bucket (1 MB, PNG/JPEG/WebP/GIF only) and the storage policies.

### Upload flow

File input → `validateAvatar` (type, then size) → preview via `URL.createObjectURL` →
**Upload** → `storage.upload('<uid>/avatar', file, { upsert: true })` → public URL saved to
`profiles.avatar_url` → rendered on mount by `useAvatar`.

- **Same path every time**, so re-uploading replaces the file instead of adding another.
  The saved URL carries `?v=<timestamp>` so browsers don't keep showing the old image.
- **Object URLs are revoked** when the preview changes or the component unmounts.
- **SVG is refused**: it can contain `<script>`.

### Client validation is UX; the policy is the security

> The browser checks only save an honest user a wasted upload and give them a clear
> message — anyone can skip them by calling the Storage API directly, so what actually
> stops a stranger writing into your folder is the storage policy that pins every write
> to `(storage.foldername(name))[1] = auth.uid()`, backed by the bucket's own size and
> type limits.

### Error boundaries

`ErrorBoundary` is a class component (`getDerivedStateFromError` + `componentDidCatch`
have no hook equivalent). Each section has its own boundary and fallback with a
**Try again** button: the nav, the avatar card, today's stats and the habit list, plus a
page-level catch-all around `<Outlet />`. The add-habit form sits outside the list's
boundary, so it keeps working even when the list crashes.

**See one fire (dev only):** add `?crash=<section>` to the URL, e.g.
`/habits?crash=stats`. Sections: `nav`, `avatar`, `stats`, `habits`. **Try again** clears the
flag, so the section genuinely recovers. Production builds ignore the parameter.

## PWA, offline and mobile

### Install

`vite-plugin-pwa` generates the manifest (name, short name, theme colour, standalone
display) and a Workbox service worker. Icons in every required size — 64, 192, 512, a
512 maskable and a 180 Apple touch icon, plus `favicon.ico` — are generated from
`public/pwa-icon.svg` by `npm run generate-pwa-assets`. Chrome reports no installability
errors on the production build; it needs HTTPS, which `localhost` and any real host provide.

### Updates

`registerType: 'prompt'`: a new service worker installs in the background and **waits**.
`UpdateToast` (via `useRegisterSW` from `virtual:pwa-register/react`) shows
**New version available → Refresh**; Refresh activates it and reloads onto the new build.

### Caching — one rule per asset type

| Asset | Strategy | Why it earns it |
| --- | --- | --- |
| App shell (hashed JS/CSS, HTML, icons) | **Precache** | Built filenames carry content hashes, so a cached copy can never be stale, and having them locally is what lets the app open with no signal at all. |
| Avatar images (Supabase Storage) | **Cache first** | Every upload gets a new `?v=` URL, so the bytes behind any one URL never change and asking the network again could only waste time and data. |
| Supabase data (`GET /rest/v1`) | **Network first**, 4 s timeout | Habits change and must be fresh whenever there is a connection, but on a train the last known list is far more useful than an error. |
| Supabase auth (`/auth/v1`) | **Network only** | Tokens and sessions must always come from the server — serving them from a cache would be a security bug. |
| Directory API (jsonplaceholder) | **Stale while revalidate** | Public, rarely-changing data, so showing the cached copy instantly and refreshing it in the background costs nothing and feels immediate. |

Writes are never cached. Signing out deletes the `supabase-api` and `avatars` caches so the
next person on a shared device can't see them.

### Offline

`useOnlineStatus` reads `navigator.onLine` through `useSyncExternalStore`, re-read on every
`online`/`offline` event; `OfflineBanner` shows under the nav while offline and briefly says
*Back online* on reconnect. A habit added offline — or whose request dies mid-flight — is
stored in `localStorage` (per user), shown with a **Queued** badge, survives reloads, and is
inserted when the `online` event fires. Server rejections are dropped with a message rather
than retried forever.

**Test offline only against a production build** — the dev server has no service worker:

```bash
npm run build && npm run preview
```

Then DevTools → Application → Service workers → **Offline**, and reload.

### Mobile

Checked at 320px, iPhone SE, Pixel 5, iPad Mini and 820px: no page scrolls horizontally.
The nav wraps onto its own row on phones; card grids use the mobile-first
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern (plain CSS utilities in `index.css`).
**Share** uses the native share sheet where there is one and falls back to copying the link.

### Lighthouse (mobile, production build)

| Category | Before | After |
| --- | --- | --- |
| Performance | 99 | 98 |
| Accessibility | 95 | 100 |
| Best Practices | 100 | 100 |
| SEO | 82 | 100 |

Fixes: a low-contrast label in the nav (accessibility), a meta description and a real
`robots.txt` (SEO). Performance varies by about a point between runs.

## Production

### Performance pass

| Chunk | Before | After |
| --- | ---: | ---: |
| Main `index-*.js` | 513.71 kB (gzip 148.20) | **403.11 kB** (gzip **117.86**) |
| `HabitsPage-*.js` (lazy) | — | 41.25 kB (gzip 11.54) |

- **Dependency replaced:** `@supabase/supabase-js` → `@supabase/auth-js` +
  `postgrest-js` + `storage-js`. supabase-js bundles Realtime, Phoenix and Functions,
  none of which this app calls, and they can't be tree-shaken (−69.9 kB). Full report:
  [`perf/dependency-audit.md`](perf/dependency-audit.md).
- **Lazy route:** only `/habits`. Lazy-loading every page to measure showed Habits at
  ~41 kB — avatar upload + Storage client, offline queue, stats — and every other page
  under 4 kB, where a split would add a request to save ~1 kB.
- **Images:** shop illustrations are `loading="lazy"` + `decoding="async"` with
  `width`/`height` (layout shift 0); the above-the-fold avatar is sized but not lazy.

### Deploy (Vercel)

Import the GitHub repo in Vercel (framework preset: Vite), then in **Settings →
Environment Variables** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and
redeploy — Vite inlines them at build time, so a deploy made before they existed has
none. `vercel.json` rewrites every path to `index.html` for client-side routes;
`.vercelignore` keeps `mobile/` out of the upload. No env var is committed.

### Expo

`mobile/` is the same tracker in React Native — see [`mobile/README.md`](mobile/README.md).

> **What I'd port next:** the offline queue — its logic (`habitQueue.ts`, the
> `online`-event sync) moves for free with AsyncStorage swapped in for localStorage and
> NetInfo for the browser events, while its rendering (the Queued badge and the banner)
> has to be rebuilt from `View`/`Text`.

## Tests

```bash
npm test          # vitest run
npm run test:watch
```

62 tests across thirteen files, each next to the code it covers. None of them talk to a real
Supabase project: `src/test/setup.ts` swaps `src/lib/supabase` for the in-memory fake in
`src/test/fakeSupabase.ts`.

| File | Covers |
| --- | --- |
| `src/pages/LoginPage.test.tsx` | render by label, validation errors, Supabase's wrong-password error, sign-in redirect |
| `src/components/ProtectedRoute.test.tsx` | waits for the session, redirects signed-out visitors, keeps a restored session |
| `src/pages/HabitsPage.test.tsx` | list + stats, empty list, query error, add success/failure, crashed stats, offline queue + sync on reconnect |
| `src/lib/avatar.test.ts` | 5 MB refused, exact 1 MB boundary, non-images, SVG, empty file |
| `src/components/AvatarUploader.test.tsx` | avatar on mount, inline rejection, preview, upsert into own folder, replace not duplicate |
| `src/components/ErrorBoundary.test.tsx` | siblings survive, custom fallback, Try again, logging |
| `src/components/OfflineBanner.test.tsx` | hidden online, shown on `offline`, *Back online* then gone |
| `src/components/UpdateToast.test.tsx` | hidden by default, Refresh activates the waiting worker, Later dismisses |
| `src/components/ShareButton.test.tsx` | clipboard fallback, native share, cancelling isn't an error |
| `src/pages/UsersPage.test.tsx` | async data with `findByText`, loading/empty/error states, debounce behaviour |
| `src/pages/CheckoutPage.test.tsx` | cart line disappearing at quantity 0, cart restored from storage |
| `src/hooks/useDebounce.test.ts` | delay, collapsing rapid typing, unmount cleanup |
| `src/hooks/useLocalStorage.test.ts` | defaults, write-through, remount, corrupt JSON, blocked storage |

Queries mirror what a user perceives — labels, roles and visible text. There is not
a single `getByTestId` in the suite. Where four Add-to-cart buttons shared one
accessible name, the fix was to give each a distinct `aria-label` rather than reach
for a test id, which also fixes them for screen reader users.

**Note on the environment:** jsdom 29 under Vitest 4 exposes `window.localStorage`
as a bare object with no `Storage` methods, so `src/test/setup.ts` installs a real
in-memory `Storage` when it finds one missing.

## Scripts

```bash
npm run dev        # vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build
npm run lint       # oxlint
npm test           # vitest run
```

## Screenshots

Captured locally in `screenshots/` (git-ignored) and submitted separately.
