import type { Habit } from '../types'

/** A habit added while offline, waiting to be inserted. */
export interface QueuedHabit {
  /** Negative, so it can never collide with a real database id. */
  tempId: number
  name: string
  queuedAt: string
}

const keyFor = (userId: string) => `habits:queue:${userId}`

/**
 * The queue lives in localStorage, per user, so a queued habit survives a
 * reload or the app being closed on the train. Storage can throw (private
 * mode, quota) or hold junk from an older build — neither may break the page.
 */
export function readQueue(userId: string): QueuedHabit[] {
  try {
    const raw = window.localStorage.getItem(keyFor(userId))
    const parsed: unknown = raw === null ? [] : JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedHabit[]) : []
  } catch {
    return []
  }
}

export function writeQueue(userId: string, queue: QueuedHabit[]) {
  try {
    if (queue.length === 0) window.localStorage.removeItem(keyFor(userId))
    else window.localStorage.setItem(keyFor(userId), JSON.stringify(queue))
  } catch {
    // Storage unavailable: the item still shows for this session, it just
    // won't survive a reload.
  }
}

export function enqueue(userId: string, name: string): QueuedHabit {
  const item: QueuedHabit = {
    tempId: -(Date.now() + Math.floor(Math.random() * 1000)),
    name,
    queuedAt: new Date().toISOString(),
  }
  writeQueue(userId, [...readQueue(userId), item])
  return item
}

export function dequeue(userId: string, tempId: number) {
  writeQueue(
    userId,
    readQueue(userId).filter((item) => item.tempId !== tempId),
  )
}

export function queuedToHabit(item: QueuedHabit): Habit {
  return { id: item.tempId, name: item.name, created_at: item.queuedAt, daily_logs: [], queued: true }
}

/**
 * True when a failure means "no connection" rather than "the server said no".
 * Only the first kind should be queued and retried; an RLS or validation
 * error would fail again on every retry.
 */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const message = typeof err === 'object' && err !== null && 'message' in err ? String(err.message) : ''
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
}
