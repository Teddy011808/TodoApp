/** Shape returned by jsonplaceholder's /users endpoints. */
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  company: { name: string; catchPhrase: string }
  address: { suite: string; street: string; city: string; zipcode: string }
}

export interface Todo {
  id: number
  text: string
  done: boolean
}

export type TodoFilter = 'all' | 'active' | 'completed'

/** A product in the shop catalogue — no quantity, that only exists inside the cart. */
export interface Product {
  id: number
  title: string
  price: number
  blurb: string
  /** Illustration path under /public; rendered lazily below the fold. */
  image: string
}

/** One check-in: the habit was done on log_date (YYYY-MM-DD). */
export interface DailyLog {
  id: number
  log_date: string
}

/** A row of `habits`, with today's log embedded (empty array = not done today). */
export interface Habit {
  id: number
  name: string
  created_at: string
  daily_logs: DailyLog[]
  /** Added while offline and not yet saved to the server (id is a negative temp id). */
  queued?: boolean
}
