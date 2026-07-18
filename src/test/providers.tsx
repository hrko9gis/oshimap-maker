import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { RepositoryProvider } from '../context/RepositoryContext'

/** テスト用：env 未設定のため AuthProvider は未ログイン、RepositoryProvider は
 *  LocalStorageRepository を選ぶ（＝window.localStorage を読む）。 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RepositoryProvider>{children}</RepositoryProvider>
    </AuthProvider>
  )
}
