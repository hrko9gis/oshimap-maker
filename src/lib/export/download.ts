import { zipSync, strToU8 } from 'fflate'
import type { Project } from '../schema/types'
import { buildProjectJson, buildSpotsGeoJSON, buildStampAnswers } from './bundle'

/** 配布バンドル3ファイルをZIP化して Uint8Array を返す（合言葉平文は含まない）。 */
export async function buildBundleZip(project: Project): Promise<Uint8Array> {
  const spots = buildSpotsGeoJSON(project)
  const answers = await buildStampAnswers(project)
  const projectJson = buildProjectJson(project)
  return zipSync({
    'spots.geojson': strToU8(JSON.stringify(spots, null, 2)),
    'stamp_answers.json': strToU8(JSON.stringify(answers, null, 2)),
    'project.json': strToU8(JSON.stringify(projectJson, null, 2)),
  })
}

/** ブラウザで文字列/バイナリをファイルとしてダウンロードさせる（副作用のため単体テスト対象外）。 */
export function triggerDownload(filename: string, data: Uint8Array | string, mime: string): void {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
