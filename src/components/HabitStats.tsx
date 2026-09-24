import type { Habit } from '../types'

/** Today's numbers at a glance. Its own section, with its own boundary. */
export default function HabitStats({ habits }: { habits: Habit[] }) {
  const done = habits.filter((habit) => habit.daily_logs.length > 0).length
  const percent = habits.length === 0 ? 0 : Math.round((done / habits.length) * 100)

  return (
    <dl className="stats" role="group" aria-label="Today's stats">
      <div className="stat">
        <dt>Habits</dt>
        <dd>{habits.length}</dd>
      </div>
      <div className="stat">
        <dt>Done today</dt>
        <dd>{done}</dd>
      </div>
      <div className="stat">
        <dt>Completion</dt>
        <dd>{percent}%</dd>
      </div>
    </dl>
  )
}
