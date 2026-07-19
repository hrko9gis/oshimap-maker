// ブラウザ内蔵のオンデバイス翻訳（Translator API, Chrome 138+/Edge 148+ のデスクトップ）。
// 非対応環境（Firefox/Safari/モバイル等）では isTranslateAvailable() が false になり、UI 側で
// 翻訳ボタンを出さない（progressive enhancement）。APIキー・ネットワーク・秘密情報は不要。

interface TranslatorInstance {
  translate(input: string): Promise<string>
}
interface TranslatorStatic {
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>
}

function getTranslator(): TranslatorStatic | undefined {
  return (globalThis as unknown as { Translator?: TranslatorStatic }).Translator
}

/** この環境でブラウザ内蔵翻訳が使えるか。 */
export function isTranslateAvailable(): boolean {
  return typeof getTranslator() !== 'undefined'
}

/** 日本語テキストを英語に翻訳する（下書き用途・要確認）。 */
export async function translateJaToEn(text: string): Promise<string> {
  const T = getTranslator()
  if (!T) throw new Error('この環境では翻訳を利用できません')
  const translator = await T.create({ sourceLanguage: 'ja', targetLanguage: 'en' })
  return translator.translate(text)
}
