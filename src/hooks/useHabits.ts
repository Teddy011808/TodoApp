import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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
      if (queryError) {
        setError(queryError.message)
      } else {
        setHabits(data)
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

  /** Resolves true when the habit was saved, so the form knows to clear itself. */
  const addHabit = useCallback(
    async (name: string): Promise<boolean> => {
      setAdding(true)
      setError(null)
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert({ name, user_id: userId })
        .select(HABIT_COLUMNS)
        .single()
        .overrideTypes<Habit, { merge: false }>()
      setAdding(false)

      if (insertError) {
        setError(insertError.message)
        return false
      }
      setHabits((current) => [...current, { ...data, daily_logs: [] }])
      return true
    },
    [userId],
  )

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
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('id', id)
        if (deleteError) throw deleteError
        setHabits((current) => current.filter((habit) => habit.id !== id))
      }),
    [withPending],
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
    dismissError: () => setError(null),
  }
}
