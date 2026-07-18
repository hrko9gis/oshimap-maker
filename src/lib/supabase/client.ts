import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

/** env が設定されていれば Supabase クライアントを返す。未設定なら null（localStorage 動作にフォールバック）。 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client
  if (!url || !anonKey) return null
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}

/** Supabase の接続情報が揃っているか。 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}
