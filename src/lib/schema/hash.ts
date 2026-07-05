/**
 * 合言葉ハッシュ。ビューア（oshimap/src/lib/stampHash.ts）と同一アルゴリズム：
 * 入力を Unicode正規化(NFKC) + 前後空白除去してから SHA-256(hex) を計算する。
 * 配布バンドルのハッシュがビューアの照合とそのまま相互運用できることの根拠。
 */

function getSubtleCrypto(): SubtleCrypto {
  const globalCrypto = globalThis.crypto
  if (!globalCrypto?.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available in this environment')
  }
  return globalCrypto.subtle
}

/** 合言葉入力を正規化する（全角/半角ゆれ・前後空白を吸収）。 */
export function normalizeKeyword(input: string): string {
  return input.normalize('NFKC').trim()
}

/** 文字列の SHA-256 ハッシュ値を16進数文字列で返す。 */
export async function sha256Hex(input: string): Promise<string> {
  const subtle = getSubtleCrypto()
  const data = new TextEncoder().encode(input)
  const digest = await subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
