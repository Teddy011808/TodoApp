/** Same shapes as the web app's src/types.ts. */
export interface DailyLog {
  id: number
  log_date: string
}

export interface Habit {
  id: number
  name: string
  created_at: string
  daily_logs: DailyLog[]
}
