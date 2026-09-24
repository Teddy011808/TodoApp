import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Short name for this section, used by the default fallback: "Your habits". */
  label: string
  /** A section-specific fallback. Gets the error and a reset function. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode
  /** Called on "Try again", before re-rendering — the place to clear the cause. */
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches a render crash anywhere below it and shows a fallback for THIS
 * section only, so one broken part never blanks the whole page.
 *
 * It has to be a class: getDerivedStateFromError and componentDidCatch have
 * no hook equivalent. It does not catch errors in event handlers or async
 * code (a failed fetch) — those are handled where they happen, with state.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  /** Render phase: switch to the fallback. Must be pure — no side effects here. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  /** Commit phase: the place for side effects such as logging. */
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}] crashed:`, error, info.componentStack)
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  override render() {
    const { error } = this.state
    if (error === null) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset })
    }

    return (
      <div className="boundary-fallback" role="alert">
        <strong>{this.props.label} couldn’t be displayed.</strong>
        <p>The rest of the page still works.</p>
        <button type="button" className="btn btn-sm" onClick={this.reset}>
          Try again
        </button>
      </div>
    )
  }
}
