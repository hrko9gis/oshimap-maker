import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getSupabaseClient } from '../lib/supabase/client'
import { getCurrentUserId } from '../lib/supabase/auth'
import { LocalStorageRepository } from '../lib/repository/localStorageRepository'
import { SupabaseRepository } from '../lib/repository/supabaseRepository'
import type { ProjectRepository } from '../lib/repository/types'
import { useAuth } from './AuthContext'

const RepositoryContext = createContext<ProjectRepository | null>(null)

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const client = getSupabaseClient()

  const repo = useMemo<ProjectRepository>(() => {
    if (client && userId) {
      return new SupabaseRepository(client, async () => {
        const id = await getCurrentUserId(client)
        if (!id) throw new Error('未ログインです')
        return id
      })
    }
    return new LocalStorageRepository()
  }, [client, userId])

  return <RepositoryContext.Provider value={repo}>{children}</RepositoryContext.Provider>
}

export function useRepository(): ProjectRepository {
  const ctx = useContext(RepositoryContext)
  if (!ctx) throw new Error('useRepository must be used within RepositoryProvider')
  return ctx
}
