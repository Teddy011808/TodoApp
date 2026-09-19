# Module 3 — Todos + User Directory

A React app wiring together lifted state, effects with cleanup, a race-safe fetch, and client-side routing.

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

## Screenshots

Captured locally in `screenshots/` (git-ignored) and submitted separately.
