import { describe, expect, test } from 'vitest'
import { sendMagicLink, getCurrentUserId } from './auth'

function fakeClient(opts: { otpError?: string; userId?: string | null }) {
  return {
    auth: {
      signInWithOtp: async () => ({ error: opts.otpError ? { message: opts.otpError } : null }),
      getUser: async () => ({ data: { user: opts.userId ? { id: opts.userId } : null }, error: null }),
    },
  } as never
}

describe('sendMagicLink', () => {
  test('returns null error on success', async () => {
    expect(await sendMagicLink(fakeClient({}), 'a@example.com')).toEqual({ error: null })
  })
  test('returns the error message on failure', async () => {
    expect(await sendMagicLink(fakeClient({ otpError: 'rate limit' }), 'a@example.com')).toEqual({ error: 'rate limit' })
  })
})

describe('getCurrentUserId', () => {
  test('returns the user id when logged in', async () => {
    expect(await getCurrentUserId(fakeClient({ userId: 'u1' }))).toBe('u1')
  })
  test('returns null when logged out', async () => {
    expect(await getCurrentUserId(fakeClient({ userId: null }))).toBeNull()
  })
})
