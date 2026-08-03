const ID_RANDOM_LENGTH = 8

function randomSegment(): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + ID_RANDOM_LENGTH)
    .padEnd(ID_RANDOM_LENGTH, '0')
}

/** 新規スポット用のIDを自動採番する。既存IDと衝突した場合は再生成する。 */
export function generateSpotId(existingIds: readonly string[]): string {
  let candidate = `spot-${randomSegment()}`
  while (existingIds.includes(candidate)) {
    candidate = `spot-${randomSegment()}`
  }
  return candidate
}
