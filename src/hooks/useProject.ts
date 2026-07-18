import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../lib/schema/types'
import { useRepository } from '../context/RepositoryContext'

export function useProject(id: string | undefined) {
  const repo = useRepository()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!id) {
      setProject(null)
      setLoading(false)
      return
    }
    setLoading(true)
    repo
      .getProject(id)
      .then((p) => {
        setProject(p)
        setError(null)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [repo, id])

  useEffect(() => {
    reload()
  }, [reload])

  return { project, loading, error, reload }
}
