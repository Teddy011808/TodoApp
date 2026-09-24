import { useState, type FormEvent } from 'react'
import AvatarUploader from '../components/AvatarUploader'
import CrashTest, { useClearCrash } from '../components/CrashTest'
import ErrorBoundary from '../components/ErrorBoundary'
import HabitItem from '../components/HabitItem'
import HabitStats from '../components/HabitStats'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'

export default function HabitsPage() {
  // ProtectedRoute guarantees a user by the time this renders.
  const { user } = useAuth()
  const clearCrash = useClearCrash()
  if (user === null) return null

  return (
    <section className="page">
      <header className="page-head">
        <h1>Habits</h1>
        <p className="page-sub">Small things, every day.</p>
      </header>

      <div className="card section-card">
        <h2 className="section-title">Your avatar</h2>
        <ErrorBoundary label="Your avatar" onReset={clearCrash}>
          <CrashTest section="avatar" />
          <AvatarUploader userId={user.id} email={user.email ?? ''} />
        </ErrorBoundary>
      </div>

      <HabitTracker userId={user.id} onResetCrash={clearCrash} />
    </section>
  )
}

function HabitTracker({ userId, onResetCrash }: { userId: string; onResetCrash: () => void }) {
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

  return (
    <>
      <div className="card section-card">
        <h2 className="section-title">Today</h2>
        <ErrorBoundary
          label="Today's stats"
          onReset={onResetCrash}
          fallback={({ reset }) => (
            <div className="boundary-fallback boundary-inline" role="alert">
              <span>Stats are unavailable right now — your habits below are unaffected.</span>
              <button type="button" className="btn btn-sm" onClick={reset}>
                Try again
              </button>
            </div>
          )}
        >
          <CrashTest section="stats" />
          {loading ? <p className="page-sub">Loading…</p> : <HabitStats habits={habits} />}
        </ErrorBoundary>
      </div>

      <div className="card section-card">
        <h2 className="section-title">Your habits</h2>
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

        <ErrorBoundary label="Your habit list" onReset={onResetCrash}>
          <CrashTest section="habits" />
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
        </ErrorBoundary>
      </div>
    </>
  )
}
