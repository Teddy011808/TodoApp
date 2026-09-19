import { useEffect, useState } from 'react'

/**
 * The async state machine, expressed once.
 *
 * `data` is `T | null` rather than `T`, which is what forces every consumer
 * to prove the request finished before touching the value. There is no
 * `data!` escape hatch anywhere in this file.
 */
export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(url: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
        // `response.json()` is typed `Promise<any>` by the DOM lib — this is the one
        // place `any` can enter. Naming T here confines it to a single, visible line
        // instead of letting it leak untyped through the rest of the app.
        return response.json() as Promise<T>
      })
      .then((json) => {
        if (cancelled) return
        setData(json)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // `err` is `unknown`, not `any`, so it has to be narrowed before use.
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}
