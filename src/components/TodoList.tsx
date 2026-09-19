import TodoItem from './TodoItem'
import type { Todo, TodoFilter } from '../types'

const EMPTY_COPY: Record<TodoFilter, string> = {
  all: 'No todos yet — add your first one above.',
  active: 'Nothing active. Everything is done.',
  completed: 'Nothing completed yet.',
}

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  filter: TodoFilter
}

/** Renders whatever list it is given; it never filters or stores todos itself. */
export default function TodoList({ todos, onToggle, onDelete, filter }: TodoListProps) {
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
