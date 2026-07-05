import type { Bilingual } from '../lib/schema/types'

interface BilingualInputProps {
  label: string
  value: Bilingual
  onChange: (value: Bilingual) => void
  maxLen?: number
  multiline?: boolean
}

const FIELD_CLASS =
  'w-full rounded border border-dusk-300 px-2 py-1 text-sm focus:border-dusk-500 focus:outline-none'

/** ja/en の2欄入力。maxLen 指定時、超過した言語欄に警告を表示する。 */
export function BilingualInput({ label, value, onChange, maxLen, multiline }: BilingualInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-dusk-800">{label}</span>
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
    </div>
  )
}
