import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup rather than with a confusing network error later.
if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

/**
 * The one Supabase client for the whole app.
 *
 * The anon key is public by design — it identifies the project, it does not
 * grant access. Every row is protected by the RLS policies in
 * supabase/schema.sql, and the session (persisted to localStorage by the
 * client) is what makes auth.uid() resolve to the signed-in user.
 */
export const supabase = createClient(url, anonKey)
