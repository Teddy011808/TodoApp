import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { dequeue, enqueue, isNetworkError, queuedToHabit, readQueue } from '../lib/habitQueue'
import type { DailyLog, Habit } from '../types'

/** Today as YYYY-MM-DD in the user's own timezone (toISOString would give UTC). */
export function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** The columns every habit query asks for, with today's log embedded. */
const HABIT_COLUMNS = 'id, name, created_at, daily_logs(id, log_date)'

function messageOf(err: unknown): string {
  if (isNetworkError(err)) return 'You’re offline — try that again once you reconnect.'
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) return String(err.message)
  return 'Something went wrong.'
}


export function useHabits(userId: string) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  /** Habit ids with a write in flight, so their controls can be disabled. */
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set())

  useEffect(() => {
    // Same guard as useFetch: a response for a previous user must not land.
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: queryError } = await supabase
        .from('habits')
        .select(HABIT_COLUMNS)
        .eq('user_id', userId)
        // Filters the EMBEDDED logs only — habits without one today still come back.
        .eq('daily_logs.log_date', todayLocal())
        .order('created_at', { ascending: true })
        .overrideTypes<Habit[], { merge: false }>()

      if (cancelled) return
      // Habits queued offline are shown after the saved ones, even when the
      // fetch itself failed — they live on this device, not on the server.
      const queued = readQueue(userId).map(queuedToHabit)
      if (queryError) {
        setError(
          isNetworkError(queryError)
            ? 'You’re offline and this list hasn’t been saved on this device yet.'
            : queryError.message,
        )
        setHabits(queued)
      } else {
        setHabits([...data, ...queued])
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  /** Marks a habit busy, runs one write, and turns any failure into `error`. */
  const withPending = useCallback(async (id: number, write: () => Promise<void>) => {
    setPendingIds((current) => new Set(current).add(id))
    setError(null)
    try {
      await write()
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }, [])

  const replaceHabit = (updated: Habit) =>
    setHabits((current) => current.map((habit) => (habit.id === updated.id ? updated : habit)))

  const insertHabit = useCallback(
    (name: string) =>
      supabase
        .from('habits')
        .insert({ name, user_id: userId })
        .select(HABIT_COLUMNS)
        .single()
        .overrideTypes<Habit, { merge: false }>(),
    [userId],
  )

  /** Keep it on this device and show it as queued until it can be sent. */
  const queueHabit = useCallback(
    (name: string) => {
      const item = enqueue(userId, name)
      setHabits((current) => [...current, queuedToHabit(item)])
    },
    [userId],
  )

  /**
   * Resolves true when the habit was saved — or queued — so the form knows to
   * clear itself.
   */
  const addHabit = useCallback(
    async (name: string): Promise<boolean> => {
      setError(null)

      // No connection: don't even try, queue it straight away.
      if (!navigator.onLine) {
        queueHabit(name)
        return true
      }

      setAdding(true)
      const { data, error: insertError } = await insertHabit(name)
      setAdding(false)

      if (insertError) {
        // "Online" but the request never arrived (a dead signal): queue it.
        if (isNetworkError(insertError)) {
          queueHabit(name)
          return true
        }
        setError(insertError.message)
        return false
      }
      setHabits((current) => [...current, { ...data, daily_logs: [] }])
      return true
    },
    [insertHabit, queueHabit],
  )

  /** Only one sync at a time, or a quick offline→online→offline flap could send twice. */
  const syncing = useRef(false)

  /** Sends queued habits one by one, oldest first, replacing each placeholder as it lands. */
  const syncQueue = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return
    syncing.current = true
    try {
      for (const item of readQueue(userId)) {
        const { data, error: insertError } = await insertHabit(item.name)
        if (insertError) {
          // Lost the connection again: stop, keep the rest queued for next time.
          if (isNetworkError(insertError)) break
          // The server rejected it; retrying would only fail again.
          dequeue(userId, item.tempId)
          setHabits((current) => current.filter((habit) => habit.id !== item.tempId))
          setError(`Couldn’t sync “${item.name}”: ${insertError.message}`)
          continue
        }
        dequeue(userId, item.tempId)
        setHabits((current) =>
          current.map((habit) => (habit.id === item.tempId ? { ...data, daily_logs: [] } : habit)),
        )
      }
    } finally {
      syncing.current = false
    }
  }, [userId, insertHabit])

  // Flush on reconnect, and once after the first load in case the app was
  // reopened with a connection and a queue left over from last time.
  useEffect(() => {
    if (loading) return
    void syncQueue()
    const onOnline = () => void syncQueue()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [loading, syncQueue])

  const renameHabit = useCallback(
    (id: number, name: string) =>
      withPending(id, async () => {
        const { data, error: updateError } = await supabase
          .from('habits')
          .update({ name })
          .eq('id', id)
          .select('id, name')
          .single()
          .overrideTypes<Pick<Habit, 'id' | 'name'>, { merge: false }>()
        if (updateError) throw updateError
        // Keep the embedded logs we already have; only the name changed.
        setHabits((current) =>
          current.map((habit) => (habit.id === data.id ? { ...habit, name: data.name } : habit)),
        )
      }),
    [withPending],
  )

  /** Done today ⇄ not done today: inserts or deletes today's daily_logs row. */
  const toggleToday = useCallback(
    (habit: Habit) =>
      withPending(habit.id, async () => {
        const todaysLog = habit.daily_logs[0]

        if (todaysLog === undefined) {
          const { data, error: insertError } = await supabase
            .from('daily_logs')
            .insert({ habit_id: habit.id, user_id: userId, log_date: todayLocal() })
            .select('id, log_date')
            .single()
            .overrideTypes<DailyLog, { merge: false }>()
          if (insertError) throw insertError
          replaceHabit({ ...habit, daily_logs: [data] })
        } else {
          const { error: deleteError } = await supabase
            .from('daily_logs')
            .delete()
            .eq('id', todaysLog.id)
          if (deleteError) throw deleteError
          replaceHabit({ ...habit, daily_logs: [] })
        }
      }),
    [withPending, userId],
  )

  /** Deleting the habit removes its logs too — ON DELETE CASCADE in the schema. */
  const deleteHabit = useCallback(
    (id: number) =>
      withPending(id, async () => {
        // A queued habit only exists on this device: drop it without the network.
        if (id < 0) {
          dequeue(userId, id)
          setHabits((current) => current.filter((habit) => habit.id !== id))
          return
        }

        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('id', id)
        if (deleteError) throw deleteError
        setHabits((current) => current.filter((habit) => habit.id !== id))
      }),
    [withPending, userId],
  )

  return {
    habits,
    loading,
    error,
    adding,
    pendingIds,
    addHabit,
    renameHabit,
    toggleToday,
    deleteHabit,
    queuedCount: habits.filter((habit) => habit.queued).length,
    dismissError: () => setError(null),
  }
}
