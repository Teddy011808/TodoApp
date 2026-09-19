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

1. **Clock** — `src/components/LiveStatus.jsx`, `[]`
   `clearInterval` stops the 1-second timer from firing after unmount, which prevents a
   setState on an unmounted component and a timer that ticks forever in the background.

2. **Window width** — `src/components/LiveStatus.jsx`, `[]`
   `removeEventListener('resize', …)` drops the listener on unmount, which prevents the
   handler stacking up on every remount and leaking the component via the closure.

3. **Search debounce** — `src/pages/UsersPage.jsx`, `[search]`
   `clearTimeout` cancels the pending timer on every keystroke, which prevents one fetch
   per character — only a 300ms pause actually commits a query.

4. **Directory fetch** — `src/pages/UsersPage.jsx`, `[query, breakApi]`
   Setting `cancelled = true` makes a late response a no-op, which prevents a slow earlier
   request from overwriting the results of a newer one (the race condition).

5. **User detail fetch** — `src/pages/UserDetailPage.jsx`, `[id]`
   Setting `cancelled = true` makes the response for an old `:id` a no-op, which prevents
   the previous user's data from rendering on the page you just navigated to.

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

## Scripts

```bash
npm run dev        # vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build
npm run lint       # oxlint
```

## Screenshots

Captured locally in `screenshots/` (git-ignored) and submitted separately.
