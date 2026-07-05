/** sort_order 昇順（＝モデルコース順）に並べ替える（非破壊）。 */
export function orderByCourse<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * sort_order を 1..N の連番として期待し、重複した番号と欠番を検出する。
 * エクスポート前の警告に用いる。
 */
export function courseIssues(
  spots: { id: string; sort_order: number }[],
): { duplicates: number[]; gaps: number[] } {
  const counts = new Map<number, number>()
  for (const s of spots) counts.set(s.sort_order, (counts.get(s.sort_order) ?? 0) + 1)
  const duplicates = [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([n]) => n)
    .sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i <= spots.length; i += 1) if (!counts.has(i)) gaps.push(i)
  return { duplicates, gaps }
}
