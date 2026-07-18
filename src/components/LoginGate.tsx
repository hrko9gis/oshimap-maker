import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

/** Supabase 設定済みかつ未ログインならログイン画面。未設定（ローカル動作）ならそのまま表示。 */
export function LoginGate({ children }: { children: ReactNode }) {
  const { configured, userId, loading, sendLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!configured || userId) return <>{children}</>
  if (loading) return <div className="p-4 text-dusk-700">読み込み中…</div>

  async function submit(e: FormEvent) {
    e.preventDefault()
    const { error: err } = await sendLink(email)
    if (err) {
      setError(err)
      return
    }
    setSent(true)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-lg font-bold text-dusk-900">OshiMap Maker にログイン</h1>
      <p className="mt-1 text-sm text-dusk-600">メールアドレスにログイン用リンクを送ります。</p>
      {sent ? (
        <p className="mt-4 rounded bg-dusk-50 p-3 text-sm text-dusk-800">
          メールを送信しました。届いたリンクを開いてログインしてください。
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded border border-dusk-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600"
          >
            ログインリンクを送る
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </form>
      )}
    </div>
  )
}
