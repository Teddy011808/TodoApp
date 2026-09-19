const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

/** Fully controlled: the selected filter and the clear action both live upstream. */
export default function FilterBar({ filter, onFilterChange, completedCount, onClearCompleted }) {
  return (
    <div className="filter-bar">
      <div className="segmented" role="group" aria-label="Filter todos">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={value === filter ? 'segment is-active' : 'segment'}
            aria-pressed={value === filter}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
      >
        Clear completed{completedCount > 0 ? ` (${completedCount})` : ''}
      </button>
    </div>
  )
}
