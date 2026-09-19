import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className={todo.done ? 'todo-item is-done' : 'todo-item'}>
      <label className="todo-label">
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
        <span className="todo-text">{todo.text}</span>
      </label>
      <button
        type="button"
        className="btn btn-icon"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.text}`}
      >
        &times;
      </button>
    </li>
  )
}
