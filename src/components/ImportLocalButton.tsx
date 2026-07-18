import { useState } from 'react'
import { loadProjects } from '../lib/storage/projectStore'
import { importLocalProjects } from '../lib/repository/importLocal'
import { useRepository } from '../context/RepositoryContext'
import { useAuth } from '../context/AuthContext'

/** Supabase ログイン中のときだけ、このブラウザのローカルデータを取り込むボタンを出す。 */
export function ImportLocalButton({ onDone }: { onDone: () => void }) {
  const repo = useRepository()
  const { configured, userId } = useAuth()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (!configured || !userId) return null
  const localCount = loadProjects().length
  if (localCount === 0) return null

  async function run() {
    setBusy(true)
    try {
      const { imported } = await importLocalProjects(repo)
      setMsg(`${imported}件のローカルプロジェクトを取り込みました。`)
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded border border-dusk-200 bg-dusk-50 p-3 text-sm">
      <p className="text-dusk-700">
        このブラウザに保存されたローカルデータ（{localCount}件）をアカウントに取り込めます。
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-2 rounded-full border border-dusk-400 px-3 py-1.5 text-sm font-semibold text-dusk-800 hover:bg-dusk-100 disabled:opacity-40"
      >
        {busy ? '取り込み中…' : 'ローカルデータを取り込む'}
      </button>
      {msg && <p className="mt-2 text-dusk-800">{msg}</p>}
    </div>
  )
}
