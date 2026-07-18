import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getSupabaseClient } from '../lib/supabase/client'
import { getCurrentUserId, sendMagicLink, signOut } from '../lib/supabase/auth'

interface AuthValue {
  userId: string | null
  loading: boolean
  configured: boolean
  sendLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) {
      setLoading(false)
      return
    }
    getCurrentUserId(client).then((id) => {
      setUserId(id)
      setLoading(false)
    })
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [client])

  const value = useMemo<AuthValue>(
    () => ({
      userId,
      loading,
      configured: Boolean(client),
      sendLink: (email) =>
        client ? sendMagicLink(client, email) : Promise.resolve({ error: 'Supabase 未設定' }),
      signOut: () => (client ? signOut(client) : Promise.resolve()),
    }),
    [client, userId, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
