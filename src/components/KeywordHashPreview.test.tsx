import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { KeywordHashPreview } from './KeywordHashPreview'
import { normalizeKeyword, sha256Hex } from '../lib/schema/hash'

describe('KeywordHashPreview', () => {
  test('shows the SHA-256 hash of the normalized keyword', async () => {
    const expected = await sha256Hex(normalizeKeyword('たけはら'))
    render(<KeywordHashPreview keyword="たけはら" />)
    await waitFor(() => {
      expect(screen.getByTestId('keyword-hash')).toHaveTextContent(expected)
    })
  })

  test('trims surrounding whitespace before hashing (NFKC+trim)', async () => {
    const expected = await sha256Hex(normalizeKeyword('たけはら'))
    render(<KeywordHashPreview keyword="  たけはら  " />)
    await waitFor(() => {
      expect(screen.getByTestId('keyword-hash')).toHaveTextContent(expected)
    })
  })

  test('shows a placeholder when the keyword is empty', () => {
    render(<KeywordHashPreview keyword="   " />)
    expect(screen.getByTestId('keyword-hash-empty')).toBeInTheDocument()
  })
})
