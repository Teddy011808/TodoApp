import { useState } from 'react'

/** Owns only its own input text. The todo itself is handed up via onAdd. */
export default function AddTodo({ onAdd }) {
  const [text, setText] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  return (
    <form className="add-todo" onSubmit={handleSubmit}>
      <input
        className="input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs doing?"
        aria-label="New todo"
      />
      <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
