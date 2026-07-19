import { useState } from 'react'
import type { Bilingual } from '../lib/schema/types'
import { isTranslateAvailable, translateJaToEn } from '../lib/translate'

interface BilingualInputProps {
  label: string
  value: Bilingual
  onChange: (value: Bilingual) => void
  maxLen?: number
  multiline?: boolean
}

const FIELD_CLASS =
  'w-full rounded border border-dusk-300 px-2 py-1 text-sm focus:border-dusk-500 focus:outline-none'

/** ja/en の2欄入力。maxLen 指定時、超過した言語欄に警告を表示する。
 *  ブラウザ内蔵翻訳が使える環境では「日本語→英語に翻訳」ボタン（下書き）を表示する。 */
export function BilingualInput({ label, value, onChange, maxLen, multiline }: BilingualInputProps) {
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const canTranslate = isTranslateAvailable() && (value.ja ?? '').trim().length > 0

  async function translate() {
    setTranslating(true)
    setTranslateError(null)
    try {
      const en = await translateJaToEn(value.ja)
      onChange({ ...value, en })
    } catch (e: unknown) {
      setTranslateError(e instanceof Error ? e.message : '翻訳に失敗しました')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-dusk-800">{label}</span>
        {canTranslate && (
          <button
            type="button"
            onClick={translate}
            disabled={translating}
            className="shrink-0 rounded-full border border-dusk-300 px-2 py-0.5 text-xs text-dusk-700 hover:bg-dusk-100 disabled:opacity-40"
          >
            {translating ? '翻訳中…' : '日本語→英語に翻訳（下書き）'}
          </button>
        )}
      </div>
      {(['ja', 'en'] as const).map((locale) => {
        const text = value[locale] ?? ''
        const over = maxLen != null && text.length > maxLen
        const aria = `${label} (${locale})`
        return (
          <div key={locale} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="w-6 shrink-0 text-xs text-dusk-500">{locale}</span>
              {multiline ? (
                <textarea
                  aria-label={aria}
                  className={FIELD_CLASS}
                  rows={2}
                  value={text}
                  onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
                />
              ) : (
                <input
                  aria-label={aria}
                  className={FIELD_CLASS}
                  value={text}
                  onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
                />
              )}
            </div>
            {over && (
              <span className="pl-7 text-xs text-red-600">{maxLen}字以内にしてください</span>
            )}
          </div>
        )
      })}
      {translateError && <span className="text-xs text-red-600">{translateError}</span>}
    </div>
  )
}
