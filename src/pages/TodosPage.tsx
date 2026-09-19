import { useMemo, useState } from 'react'
import AddTodo from '../components/AddTodo'
import FilterBar from '../components/FilterBar'
import TodoList from '../components/TodoList'
import type { Todo, TodoFilter } from '../types'

const INITIAL_TODOS: Todo[] = [
  { id: 1, text: 'Lift state into one owner', done: true },
  { id: 2, text: 'Give every effect a cleanup', done: false },
  { id: 3, text: 'Guard the fetch with a cancelled flag', done: false },
]

let nextId = INITIAL_TODOS.length + 1

/**
 * The ONE owner of the todo array.
 * AddTodo, FilterBar and TodoList hold no todo state — they receive
 * props down and report back up through callbacks.
 */
export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS)
  const [filter, setFilter] = useState<TodoFilter>('all')

  const addTodo = (text: string) => {
    setTodos((current) => [...current, { id: nextId++, text, done: false }])
  }

  const toggleTodo = (id: number) => {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    )
  }

  const deleteTodo = (id: number) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const clearCompleted = () => {
    setTodos((current) => current.filter((todo) => !todo.done))
  }

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((todo) => !todo.done)
    if (filter === 'completed') return todos.filter((todo) => todo.done)
    return todos
  }, [todos, filter])

  const remainingCount = todos.filter((todo) => !todo.done).length
  const completedCount = todos.length - remainingCount

  return (
    <section className="page">
      <header className="page-head">
        <h1>Todos</h1>
        <p className="page-sub">
          {remainingCount} left &middot; {completedCount} done &middot; {todos.length} total
        </p>
      </header>

      <div className="card">
        <AddTodo onAdd={addTodo} />

        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          completedCount={completedCount}
          onClearCompleted={clearCompleted}
        />

        <TodoList todos={visibleTodos} onToggle={toggleTodo} onDelete={deleteTodo} filter={filter} />
      </div>
    </section>
  )
}
