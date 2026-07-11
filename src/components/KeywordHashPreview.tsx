import { useEffect, useState } from 'react'
import { normalizeKeyword, sha256Hex } from '../lib/schema/hash'

interface KeywordHashPreviewProps {
  keyword: string
}

/** 合言葉の答えから、エクスポートされる SHA-256 ハッシュ（NFKC+trim後）をライブ表示する。 */
export function KeywordHashPreview({ keyword }: KeywordHashPreviewProps) {
  const [hash, setHash] = useState('')

  useEffect(() => {
    const normalized = normalizeKeyword(keyword)
    if (!normalized) {
      setHash('')
      return
    }
    let active = true
    sha256Hex(normalized).then((h) => {
      if (active) setHash(h)
    })
    return () => {
      active = false
    }
  }, [keyword])

  return (
    <p className="text-xs text-dusk-600">
      <span className="font-medium">エクスポートされるハッシュ（SHA-256）：</span>{' '}
      {hash ? (
        <code data-testid="keyword-hash" className="break-all font-mono">
          {hash}
        </code>
      ) : (
        <span data-testid="keyword-hash-empty">合言葉を入力すると表示されます</span>
      )}
    </p>
  )
}
