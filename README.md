# Todos + User Directory + Shop

A TypeScript React app built across two modules: lifted state, effects with cleanup and
routing (module 3), then a typed async state machine, two contexts and a cart reducer
(module 4).

## Run it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:xxxx` URL.

## Routes

| Route          | Page                                              |
| -------------- | ------------------------------------------------- |
| `/`            | redirects to `/todos`                             |
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

## Tests

```bash
npm test          # vitest run
npm run test:watch
```

27 tests across five files, each next to the code it covers:

| File | Covers |
| --- | --- |
| `src/pages/SignInPage.test.tsx` | render by label, type + submit via userEvent, validation errors, absence via `queryByRole` |
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
