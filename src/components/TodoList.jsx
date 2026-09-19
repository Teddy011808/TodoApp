import TodoItem from './TodoItem.jsx'

const EMPTY_COPY = {
  all: 'No todos yet — add your first one above.',
  active: 'Nothing active. Everything is done.',
  completed: 'Nothing completed yet.',
}

/** Renders whatever list it is given; it never filters or stores todos itself. */
export default function TodoList({ todos, onToggle, onDelete, filter }) {
  if (todos.length === 0) {
    return <p className="empty">{EMPTY_COPY[filter]}</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
