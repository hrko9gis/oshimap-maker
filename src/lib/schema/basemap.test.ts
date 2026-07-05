import { describe, expect, test } from 'vitest'
import { GSI_PALE_STYLE, GSI_PHOTO_STYLE, basemapStyle } from './basemap'

describe('basemap styles', () => {
  test('pale uses GSI pale tiles', () => {
    expect(JSON.stringify(GSI_PALE_STYLE)).toContain('cyberjapandata.gsi.go.jp/xyz/pale')
  })

  test('photo uses GSI seamlessphoto tiles', () => {
    expect(JSON.stringify(GSI_PHOTO_STYLE)).toContain('cyberjapandata.gsi.go.jp/xyz/seamlessphoto')
  })

  test('basemapStyle maps kinds', () => {
    expect(basemapStyle('gsi-photo')).toBe(GSI_PHOTO_STYLE)
    expect(basemapStyle('gsi-pale')).toBe(GSI_PALE_STYLE)
  })
})
