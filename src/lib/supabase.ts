import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup rather than with a confusing network error later.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

/**
 * The Supabase client, assembled from only the parts this app uses.
 *
 * `@supabase/supabase-js` bundles every client — including Realtime and Edge
 * Functions, which this app never calls — and they can't be tree-shaken out
 * (~58 KB minified). This wires auth + database the same way supabase-js
 * does internally; storage lives in ./storage so only the avatar feature
 * loads it.
 *
 * The anon key is public by design — RLS in supabase/schema.sql protects the
 * data; the signed-in user's JWT is what makes auth.uid() resolve.
 */

const auth = new AuthClient({
  url: `${SUPABASE_URL}/auth/v1`,
  headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  // Same key supabase-js uses, so sessions saved by the old client still work.
  storageKey: `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
})

/**
 * fetch for every data/storage request: sends the anon key, plus the user's
 * access token when signed in (falling back to the anon key, which RLS
 * treats as signed out). getSession() refreshes an expired token first.
 */
export async function authedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data } = await auth.getSession()
  const headers = new Headers(init?.headers)
  if (!headers.has('apikey')) headers.set('apikey', SUPABASE_ANON_KEY)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? SUPABASE_ANON_KEY}`)
  }
  return fetch(input, { ...init, headers })
}

const rest = new PostgrestClient(`${SUPABASE_URL}/rest/v1`, { fetch: authedFetch })

export const supabase = {
  auth,
  from: (table: string) => rest.from(table),
}
