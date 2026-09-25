import { StorageClient } from '@supabase/storage-js'
import { authedFetch, SUPABASE_URL } from './supabase'

/**
 * Supabase Storage, kept out of the main bundle: only the avatar uploader
 * imports this, so it ships in the lazily-loaded Habits chunk.
 */
export const storage = new StorageClient(`${SUPABASE_URL}/storage/v1`, {}, authedFetch)
