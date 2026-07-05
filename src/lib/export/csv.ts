import type { Bilingual, Locale, Project, SpotDraft } from '../schema/types'

const CSV_COLUMNS = [
  'id',
  'title',
  'category',
  'summary',
  'source_url',
  'source_name',
  'address',
  'location_accuracy',
  'lat',
  'lng',
] as const

function pick(value: Bilingual | undefined, locale: Locale): string {
  return value ? value[locale] : ''
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

/** プロジェクトの published スポットを指定ロケールの CSV に変換する（先頭に UTF-8 BOM）。 */
export function spotsToCSV(project: Project, locale: Locale): string {
  const published: SpotDraft[] = project.spots.filter((s) => s.status === 'published')
  const header = CSV_COLUMNS.join(',')
  const rows = published.map((spot) => {
    const fields: Record<(typeof CSV_COLUMNS)[number], string> = {
      id: spot.id,
      title: pick(spot.title, locale),
      category: spot.category,
      summary: pick(spot.summary, locale),
      source_url: spot.source_url,
      source_name: pick(spot.source_name, locale),
      address: pick(spot.address, locale),
      location_accuracy: spot.location_accuracy,
      lat: String(spot.lat),
      lng: String(spot.lng),
    }
    return CSV_COLUMNS.map((col) => escapeCsvField(fields[col])).join(',')
  })

  const BOM = '﻿'
  return BOM + [header, ...rows].join('\n')
}
