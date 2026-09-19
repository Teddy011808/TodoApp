/**
 * Compile-time proof that the generic narrows. Nothing here runs — it exists so
 * `npm run typecheck` fails loudly if useFetch ever stops being type-safe.
 *
 * Uncomment the line marked ❌ and the build breaks with:
 *   "'state.data' is possibly 'null'"
 */
import type { FetchState } from './useFetch'
import type { User } from '../types'

declare const state: FetchState<User[]>

// ❌ TypeScript refuses this — data may still be null while loading.
// state.data.map((user) => user.name)

// ✅ Allowed only after the null check, where data narrows to User[].
export function names(): string[] {
  if (state.data === null) return []
  return state.data.map((user) => user.name)
}

// ✅ The element type is inferred as User, so unknown fields are caught too.
export function firstEmail(): string | undefined {
  if (!state.data) return undefined
  return state.data[0]?.email
}
