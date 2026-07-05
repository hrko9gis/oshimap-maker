import { BilingualInput } from './BilingualInput'
import { EnumSelect } from './EnumSelect'
import { MapPicker } from './MapPicker'
import {
  CATEGORY_ORDER,
  LOCATION_ACCURACY_VALUES,
  SPOT_STATUS_VALUES,
  SUMMARY_MAX_LEN,
  VISIT_DIFFICULTY_VALUES,
} from '../lib/schema/constants'
import type {
  Bilingual,
  FieldError,
  LocationAccuracy,
  SpotCategory,
  SpotDraft,
  SpotStatus,
  VisitDifficulty,
} from '../lib/schema/types'

const CATEGORY_LABELS: Record<SpotCategory, string> = {
  anime_spot: '作品ゆかり',
  townscape: '町歩き',
  transport: '交通',
  rest: '休憩',
  shopping: '買い物',
  viewpoint: '展望',
}
const ACCURACY_LABELS: Record<LocationAccuracy, string> = {
  exact: '正確',
  approximate: '概算',
  area: 'エリア代表点',
}
const DIFFICULTY_LABELS: Record<VisitDifficulty, string> = {
  near_station: '駅近',
  walk: '徒歩',
  bus: 'バス',
  car: '車',
}
const STATUS_LABELS: Record<SpotStatus, string> = {
  draft: '下書き',
  review: 'レビュー中',
  published: '公開',
}
const EMPTY: Bilingual = { ja: '', en: '' }

interface SpotFormProps {
  value: SpotDraft
  onChange: (value: SpotDraft) => void
  onSubmit: (value: SpotDraft) => void
  errors: FieldError[]
}

function ErrorText({ errors, field }: { errors: FieldError[]; field: string }) {
  const found = errors.filter((e) => e.field === field)
  if (found.length === 0) return null
  return <span className="text-xs text-red-600">{found.map((e) => e.message).join(' / ')}</span>
}

export function SpotForm({ value, onChange, onSubmit, errors }: SpotFormProps) {
  const set = <K extends keyof SpotDraft>(key: K, v: SpotDraft[K]) => onChange({ ...value, [key]: v })
  const coords = Number.isFinite(value.lng) && Number.isFinite(value.lat)
    ? { lng: value.lng, lat: value.lat }
    : null

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">ID（kebab-case）</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.id}
          onChange={(e) => set('id', e.target.value)}
        />
        <ErrorText errors={errors} field="id" />
      </label>

      <BilingualInput label="名称" value={value.title} onChange={(v) => set('title', v)} />
      <ErrorText errors={errors} field="title.ja" />

      <EnumSelect
        label="カテゴリ"
        value={value.category}
        options={CATEGORY_ORDER}
        labels={CATEGORY_LABELS}
        onChange={(v) => set('category', v)}
      />

      <BilingualInput
        label="概要（各120字以内）"
        value={value.summary}
        onChange={(v) => set('summary', v)}
        maxLen={SUMMARY_MAX_LEN}
        multiline
      />
      <ErrorText errors={errors} field="summary.ja" />
      <ErrorText errors={errors} field="summary.en" />

      <BilingualInput
        label="作品名（任意）"
        value={value.work_title ?? EMPTY}
        onChange={(v) => set('work_title', v)}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">公式・観光リンク（http(s)://）</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.source_url}
          onChange={(e) => set('source_url', e.target.value)}
        />
        <ErrorText errors={errors} field="source_url" />
      </label>

      <BilingualInput label="出典名" value={value.source_name} onChange={(v) => set('source_name', v)} />

      <BilingualInput
        label="住所（任意）"
        value={value.address ?? EMPTY}
        onChange={(v) => set('address', v)}
      />

      <MapPicker value={coords} onChange={(c) => onChange({ ...value, lng: c.lng, lat: c.lat })} />
      <ErrorText errors={errors} field="lat" />
      <ErrorText errors={errors} field="lng" />

      <EnumSelect
        label="位置精度"
        value={value.location_accuracy}
        options={LOCATION_ACCURACY_VALUES}
        labels={ACCURACY_LABELS}
        onChange={(v) => set('location_accuracy', v)}
      />
      <EnumSelect
        label="訪問難易度"
        value={value.visit_difficulty}
        options={VISIT_DIFFICULTY_VALUES}
        labels={DIFFICULTY_LABELS}
        onChange={(v) => set('visit_difficulty', v)}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">モデルコース順（sort_order）</span>
        <input
          type="number"
          min={1}
          className="w-24 rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.sort_order}
          onChange={(e) => set('sort_order', Number(e.target.value))}
        />
        <ErrorText errors={errors} field="sort_order" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">滞在目安（分・任意）</span>
        <input
          type="number"
          min={0}
          className="w-24 rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.estimated_stay_min ?? ''}
          onChange={(e) =>
            set('estimated_stay_min', e.target.value === '' ? undefined : Number(e.target.value))
          }
        />
      </label>

      <BilingualInput
        label="注意事項（任意）"
        value={value.notes ?? EMPTY}
        onChange={(v) => set('notes', v)}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-dusk-800">
        <input
          type="checkbox"
          checked={value.stamp_enabled}
          onChange={(e) => set('stamp_enabled', e.target.checked)}
        />
        スタンプ対象にする
      </label>

      {value.stamp_enabled && (
        <div className="flex flex-col gap-3 rounded border border-dusk-200 bg-dusk-50 p-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-dusk-800">
              合言葉（答え・平文はエクスポートされません）
            </span>
            <input
              aria-label="合言葉（答え）"
              className="rounded border border-dusk-300 px-2 py-1 text-sm"
              value={value.stamp_keyword_answer ?? ''}
              onChange={(e) => set('stamp_keyword_answer', e.target.value)}
            />
            <ErrorText errors={errors} field="stamp_keyword_answer" />
          </label>
          <BilingualInput
            label="合言葉のヒント"
            value={value.stamp_keyword_hint ?? EMPTY}
            onChange={(v) => set('stamp_keyword_hint', v)}
          />
          <ErrorText errors={errors} field="stamp_keyword_hint.ja" />
        </div>
      )}

      <EnumSelect
        label="公開ステータス"
        value={value.status}
        options={SPOT_STATUS_VALUES}
        labels={STATUS_LABELS}
        onChange={(v) => set('status', v)}
      />

      <button
        type="submit"
        className="self-start rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600"
      >
        保存
      </button>
    </form>
  )
}
