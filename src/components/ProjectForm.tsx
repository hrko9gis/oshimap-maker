import { BilingualInput } from './BilingualInput'
import { EnumSelect } from './EnumSelect'
import type { FieldError, Locale, Project, ProjectVisibility } from '../lib/schema/types'

export type ProjectDraft = Omit<Project, 'id' | 'spots' | 'createdAt' | 'updatedAt'>

const LANGUAGE_LABELS: Record<Locale, string> = { ja: '日本語', en: 'English' }
const VISIBILITY_LABELS: Record<ProjectVisibility, string> = {
  private: '非公開',
  unlisted: '限定公開',
  public: '公開',
}
const FIELD_LABELS: Record<string, string> = {
  'title.ja': 'マップ名（日本語）',
  'title.en': 'マップ名（英語）',
  'disclaimer.ja': '注意書き（日本語）',
  'disclaimer.en': '注意書き（英語）',
  license: 'ライセンス',
}

interface ProjectFormProps {
  value: ProjectDraft
  onChange: (value: ProjectDraft) => void
  onSubmit: (value: ProjectDraft) => void
  errors: FieldError[]
  showVisibility?: boolean
  submitLabel: string
}

function ErrorText({ errors, field }: { errors: FieldError[]; field: string }) {
  const found = errors.filter((e) => e.field === field)
  if (found.length === 0) return null
  return <span className="text-xs text-red-600">{found.map((e) => e.message).join(' / ')}</span>
}

export function ProjectForm({
  value,
  onChange,
  onSubmit,
  errors,
  showVisibility,
  submitLabel,
}: ProjectFormProps) {
  const set = <K extends keyof ProjectDraft>(key: K, v: ProjectDraft[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
    >
      {errors.length > 0 && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-700">
          <p className="font-semibold">未入力の必須項目があります：</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e.field}>
                {FIELD_LABELS[e.field] ?? e.field}：{e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BilingualInput label="マップ名" value={value.title} onChange={(v) => set('title', v)} />
      <ErrorText errors={errors} field="title.ja" />

      <BilingualInput label="対象地域" value={value.area_name} onChange={(v) => set('area_name', v)} />
      <BilingualInput
        label="説明文"
        value={value.description}
        onChange={(v) => set('description', v)}
        multiline
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">対象作品・ジャンル</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.theme_type}
          onChange={(e) => set('theme_type', e.target.value)}
        />
      </label>

      <EnumSelect
        label="対応言語（既定）"
        value={value.default_language}
        options={['ja', 'en']}
        labels={LANGUAGE_LABELS}
        onChange={(v) => set('default_language', v)}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">ライセンス</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.license}
          onChange={(e) => set('license', e.target.value)}
        />
        <ErrorText errors={errors} field="license" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">公式サイトURL（任意）</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.official_url ?? ''}
          onChange={(e) => set('official_url', e.target.value || undefined)}
        />
      </label>

      <BilingualInput
        label="注意書き（非公式ファンプロジェクト表明を含める）"
        value={value.disclaimer}
        onChange={(v) => set('disclaimer', v)}
        multiline
      />
      <ErrorText errors={errors} field="disclaimer.ja" />

      {showVisibility && (
        <EnumSelect
          label="公開範囲"
          value={value.visibility}
          options={['private', 'unlisted', 'public']}
          labels={VISIBILITY_LABELS}
          onChange={(v) => set('visibility', v)}
        />
      )}

      <button
        type="submit"
        className="self-start rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600"
      >
        {submitLabel}
      </button>
    </form>
  )
}

export function blankProjectDraft(): ProjectDraft {
  return {
    title: { ja: '', en: '' },
    area_name: { ja: '', en: '' },
    description: { ja: '', en: '' },
    theme_type: '',
    default_language: 'ja',
    visibility: 'private',
    license: 'CC BY 4.0',
    disclaimer: {
      ja: '本サイトは非公式のファンプロジェクトです。制作元・関係団体とは一切関係ありません。',
      en: 'This is an unofficial fan project, not affiliated with the production committee or any related organizations.',
    },
  }
}
