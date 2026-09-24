import { useState, type FormEvent } from 'react'
import type { Habit } from '../types'

interface HabitItemProps {
  habit: Habit
  busy: boolean
  onToggle: (habit: Habit) => void
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => void
}

export default function HabitItem({ habit, busy, onToggle, onRename, onDelete }: HabitItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(habit.name)
  const doneToday = habit.daily_logs.length > 0

  const startEditing = () => {
    setDraft(habit.name)
    setEditing(true)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || trimmed === habit.name) {
      setEditing(false)
      return
    }
    await onRename(habit.id, trimmed)
    setEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${habit.name}" and all of its logs?`)) onDelete(habit.id)
  }

  if (editing) {
    return (
      <li className="todo-item">
        <form className="add-todo habit-edit" onSubmit={handleSave}>
          <input
            className="input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={`Rename ${habit.name}`}
            maxLength={80}
            autoFocus
            disabled={busy}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !draft.trim()}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-sm" type="button" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
        </form>
      </li>
    )
  }

  // A queued habit has no server row yet, so there is nothing to tick or rename.
  const queued = habit.queued === true

  return (
    <li className={doneToday ? 'todo-item is-done' : 'todo-item'} aria-busy={busy}>
      <label className="todo-label">
        <input
          type="checkbox"
          checked={doneToday}
          onChange={() => onToggle(habit)}
          disabled={busy || queued}
          aria-label={`${habit.name} done today`}
        />
        <span className="todo-text">{habit.name}</span>
        {queued && (
          <span className="queued-badge" title="Saved on this device — it will sync when you reconnect">
            Queued
          </span>
        )}
      </label>
      <button type="button" className="btn btn-sm btn-ghost" onClick={startEditing} disabled={busy || queued}>
        Edit
      </button>
      <button
        type="button"
        className="btn btn-icon"
        onClick={handleDelete}
        disabled={busy}
        aria-label={`Delete ${habit.name}`}
      >
        &times;
      </button>
    </li>
  )
}
