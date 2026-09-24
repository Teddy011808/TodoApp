import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyLog, Habit } from '@/types'

/**
 * Ported from the web app's src/hooks/useHabits.ts. The queries, the state
 * and the RLS they rely on are identical — this is the half of the app that
 * moves between platforms for free. (The offline queue stays web-only.)
 */

/** Today as YYYY-MM-DD in the user's own timezone. */
function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const HABIT_COLUMNS = 'id, name, created_at, daily_logs(id, log_date)'

/** The list query — a plain function, so it holds no state of its own. */
function queryHabits(userId: string) {
  return supabase
    .from('habits')
    .select(HABIT_COLUMNS)
    .eq('user_id', userId)
    // Filters the EMBEDDED logs only — habits without one today still come back.
    .eq('daily_logs.log_date', todayLocal())
    .order('created_at', { ascending: true })
    .overrideTypes<Habit[], { merge: false }>()
}

export function useHabits(userId: string) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set())

  const apply = useCallback((result: Awaited<ReturnType<typeof queryHabits>>) => {
    if (result.error) setError(result.error.message)
    else {
      setError(null)
      setHabits(result.data)
    }
  }, [])

  // State is only set after the await, and not at all once the effect is
  // cleaned up — a slow response for a previous user must not land.
  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await queryHabits(userId)
      if (cancelled) return
      apply(result)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId, apply])

  /** Pull-to-refresh. */
  const refresh = useCallback(async () => {
    setRefreshing(true)
    apply(await queryHabits(userId))
    setRefreshing(false)
  }, [userId, apply])

  const withPending = useCallback(async (id: number, write: () => Promise<void>) => {
    setPendingIds((current) => new Set(current).add(id))
    setError(null)
    try {
      await write()
    } catch (err) {
      setError(typeof err === 'object' && err !== null && 'message' in err ? String(err.message) : 'Something went wrong.')
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }, [])

  /** Resolves null on success, or the error message. */
  const addHabit = useCallback(
    async (name: string): Promise<string | null> => {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert({ name, user_id: userId })
        .select(HABIT_COLUMNS)
        .single()
        .overrideTypes<Habit, { merge: false }>()
      if (insertError) return insertError.message
      setHabits((current) => [...current, { ...data, daily_logs: [] }])
      return null
    },
    [userId],
  )

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
          setHabits((current) => current.map((h) => (h.id === habit.id ? { ...h, daily_logs: [data] } : h)))
        } else {
          const { error: deleteError } = await supabase.from('daily_logs').delete().eq('id', todaysLog.id)
          if (deleteError) throw deleteError
          setHabits((current) => current.map((h) => (h.id === habit.id ? { ...h, daily_logs: [] } : h)))
        }
      }),
    [withPending, userId],
  )

  return { habits, loading, refreshing, error, pendingIds, refresh, addHabit, toggleToday }
}
