import type { Session } from '@supabase/supabase-js'

/**
 * An in-memory stand-in for src/lib/supabase, installed for every test in
 * setup.ts. Tests never touch the network, and never need real keys in .env.
 *
 * Auth behaves like the real client: listeners get INITIAL_SESSION on
 * subscribe, then SIGNED_IN / SIGNED_OUT as the session changes.
 * Queries resolve to whatever a test queued with queueQueryResult.
 */

type AuthListener = (event: string, session: Session | null) => void

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

let accounts = new Map<string, string>()
let session: Session | null = null
let listeners = new Set<AuthListener>()
let queryResults: QueryResult[] = []

function makeSession(email: string): Session {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: `user-${email}`, email, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' },
  } as Session
}

function emit(event: string) {
  listeners.forEach((listener) => listener(event, session))
}

/** A test account that signInWithPassword will accept. */
export function addTestAccount(email: string, password: string) {
  accounts.set(email, password)
}

/** Start the test already signed in, as if a session was restored from storage. */
export function signInAs(email: string) {
  session = makeSession(email)
}

/** The next query — whatever its chain of .from().select().eq()... — resolves to this. */
export function queueQueryResult(result: QueryResult) {
  queryResults.push(result)
}

export function resetFakeSupabase() {
  accounts = new Map()
  session = null
  listeners = new Set()
  queryResults = []
}

/** Every builder method returns the builder; awaiting it pops the next queued result. */
function queryBuilder(): unknown {
  const builder: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          const result = queryResults.shift() ?? { data: [], error: null }
          return (resolve: (value: QueryResult) => unknown) => resolve(result)
        }
        return () => builder
      },
    },
  )
  return builder
}

export const supabase = {
  auth: {
    onAuthStateChange(listener: AuthListener) {
      listeners.add(listener)
      queueMicrotask(() => listener('INITIAL_SESSION', session))
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (accounts.get(email) !== password) {
        return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } }
      }
      session = makeSession(email)
      emit('SIGNED_IN')
      return { data: { session, user: session.user }, error: null }
    },
    async signUp({ email, password }: { email: string; password: string }) {
      accounts.set(email, password)
      session = makeSession(email)
      emit('SIGNED_IN')
      return { data: { session, user: session.user }, error: null }
    },
    async signOut() {
      session = null
      emit('SIGNED_OUT')
      return { error: null }
    },
  },
  from: () => queryBuilder(),
}
