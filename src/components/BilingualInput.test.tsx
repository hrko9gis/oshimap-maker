import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BilingualInput } from './BilingualInput'

describe('BilingualInput', () => {
  test('edits ja and en independently', async () => {
    const onChange = vi.fn()
    render(<BilingualInput label="概要" value={{ ja: '', en: '' }} onChange={onChange} maxLen={5} />)
    await userEvent.type(screen.getByLabelText('概要 (ja)'), 'あ')
    expect(onChange).toHaveBeenLastCalledWith({ ja: 'あ', en: '' })
  })

  test('shows warning when value exceeds maxLen', () => {
    render(
      <BilingualInput label="概要" value={{ ja: 'あいうえおか', en: '' }} onChange={() => {}} maxLen={5} />,
    )
    expect(screen.getByText(/5字以内/)).toBeInTheDocument()
  })
})
