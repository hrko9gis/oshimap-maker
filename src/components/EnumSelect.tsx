interface EnumSelectProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
}

/** enum 値のセレクト。表示名は labels で与える。 */
export function EnumSelect<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: EnumSelectProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-dusk-800">{label}</span>
      <select
        className="rounded border border-dusk-300 px-2 py-1 text-sm focus:border-dusk-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  )
}
