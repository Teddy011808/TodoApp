import type { Session } from '@supabase/auth-js'

/**
 * An in-memory stand-in for src/lib/supabase, installed for every test in
 * setup.ts. Tests never touch the network, and never need real keys in .env.
 *
 * Auth behaves like the real client: listeners get INITIAL_SESSION on
 * subscribe, then SIGNED_IN / SIGNED_OUT as the session changes.
 * Queries resolve to whatever a test queued for that table with
 * queueQueryResult. Storage uploads are recorded, not sent anywhere.
 */

type AuthListener = (event: string, session: Session | null) => void

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

let accounts = new Map<string, string>()
let session: Session | null = null
let listeners = new Set<AuthListener>()
let queryResults = new Map<string, QueryResult[]>()
let uploads: Upload[] = []
let uploadResults: QueryResult[] = []

interface Upload {
  bucket: string
  path: string
  file: File
  options: { upsert?: boolean; contentType?: string } | undefined
}

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

/** The next query on `table` — whatever its chain of .select().eq()... — resolves to this. */
export function queueQueryResult(result: QueryResult, table = 'habits') {
  queryResults.set(table, [...(queryResults.get(table) ?? []), result])
}

/** The next storage upload resolves to this instead of succeeding. */
export function queueUploadResult(result: QueryResult) {
  uploadResults.push(result)
}

/** Every upload made so far, in order. */
export function getUploads(): readonly Upload[] {
  return uploads
}

export function resetFakeSupabase() {
  accounts = new Map()
  session = null
  listeners = new Set()
  queryResults = new Map()
  uploads = []
  uploadResults = []
}

/** Every builder method returns the builder; awaiting it pops the next queued result. */
function queryBuilder(table: string): unknown {
  const builder: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          const result = queryResults.get(table)?.shift() ?? { data: [], error: null }
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
  from: (table: string) => queryBuilder(table),
  storage: {
    from: (bucket: string) => ({
      async upload(path: string, file: File, options?: Upload['options']) {
        uploads.push({ bucket, path, file, options })
        return uploadResults.shift() ?? { data: { path }, error: null }
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` },
      }),
    }),
  },
}

/** The avatar feature imports storage from its own module; same fake. */
export const storage = supabase.storage
