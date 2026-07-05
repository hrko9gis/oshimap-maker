import { describe, expect, test } from 'vitest'
import { courseIssues, orderByCourse } from './course'

describe('orderByCourse', () => {
  test('sorts ascending by sort_order without mutating input', () => {
    const input = [{ sort_order: 3 }, { sort_order: 1 }, { sort_order: 2 }]
    const out = orderByCourse(input)
    expect(out.map((x) => x.sort_order)).toEqual([1, 2, 3])
    expect(input.map((x) => x.sort_order)).toEqual([3, 1, 2])
  })
})

describe('courseIssues', () => {
  test('detects duplicates and gaps against 1..N', () => {
    const issues = courseIssues([
      { id: 'a', sort_order: 1 },
      { id: 'b', sort_order: 1 },
      { id: 'c', sort_order: 3 },
    ])
    expect(issues.duplicates).toEqual([1])
    expect(issues.gaps).toEqual([2])
  })

  test('sequential 1..N has no issues', () => {
    const issues = courseIssues([
      { id: 'a', sort_order: 1 },
      { id: 'b', sort_order: 2 },
      { id: 'c', sort_order: 3 },
    ])
    expect(issues).toEqual({ duplicates: [], gaps: [] })
  })
})
