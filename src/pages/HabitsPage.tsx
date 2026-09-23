import { useState, type FormEvent } from 'react'
import HabitItem from '../components/HabitItem'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'

export default function HabitsPage() {
  // ProtectedRoute guarantees a user by the time this renders.
  const { user } = useAuth()
  if (user === null) return null
  return <HabitTracker userId={user.id} />
}

function HabitTracker({ userId }: { userId: string }) {
  const {
    habits,
    loading,
    error,
    adding,
    pendingIds,
    addHabit,
    renameHabit,
    toggleToday,
    deleteHabit,
    dismissError,
  } = useHabits(userId)
  const [name, setName] = useState('')

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (await addHabit(trimmed)) setName('')
  }

  const doneCount = habits.filter((habit) => habit.daily_logs.length > 0).length

  return (
    <section className="page">
      <header className="page-head">
        <h1>Habits</h1>
        <p className="page-sub">
          {loading ? 'Loading…' : `${doneCount} of ${habits.length} done today`}
        </p>
      </header>

      <div className="card">
        <form className="add-todo" onSubmit={handleAdd}>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="A habit to build, e.g. Read 20 pages"
            aria-label="New habit"
            maxLength={80}
            disabled={adding}
          />
          <button className="btn btn-primary" type="submit" disabled={adding || !name.trim()}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>

        {error !== null && (
          <div className="form-error habit-error" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-icon" onClick={dismissError} aria-label="Dismiss error">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <ul className="todo-list habit-list" aria-label="Loading habits">
            {[0, 1, 2].map((row) => (
              <li key={row} className="skeleton-row">
                <div className="skeleton skeleton-line" />
              </li>
            ))}
          </ul>
        ) : habits.length === 0 ? (
          <p className="empty habit-list">No habits yet — add your first one above.</p>
        ) : (
          <ul className="todo-list habit-list">
            {habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                busy={pendingIds.has(habit.id)}
                onToggle={toggleToday}
                onRename={renameHabit}
                onDelete={deleteHabit}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
