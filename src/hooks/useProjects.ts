import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../lib/schema/types'
import { useRepository } from '../context/RepositoryContext'

export function useProjects() {
  const repo = useRepository()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    repo
      .listProjects()
      .then((p) => {
        setProjects(p)
        setError(null)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [repo])

  useEffect(() => {
    reload()
  }, [reload])

  return { projects, loading, error, reload }
}
