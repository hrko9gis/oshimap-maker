import type { SupabaseClient } from '@supabase/supabase-js'

/** マジックリンク（パスワードレス）を送る。成功時 error=null。 */
export async function sendMagicLink(
  client: SupabaseClient,
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error ? error.message : null }
}

export async function getCurrentUserId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser()
  return data.user?.id ?? null
}

export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut()
}
