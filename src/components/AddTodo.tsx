import { useState, type FormEvent } from 'react'

interface AddTodoProps {
  onAdd: (text: string) => void
}

/** Owns only its own input text. The todo itself is handed up via onAdd. */
export default function AddTodo({ onAdd }: AddTodoProps) {
  const [text, setText] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
