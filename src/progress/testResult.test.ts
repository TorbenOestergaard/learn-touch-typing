import { describe, expect, it } from 'vitest'
import type { TestPoint } from './series'
import { testHeadline, threeInARow } from './testResult'

const pt = (kpm: number, accuracy = 0.97, stars = 1): TestPoint => ({ at: kpm, kpm, accuracy, stars })
const r = (kpm: number, accuracy: number, stars: number, finishedModule = false) => ({ kpm, accuracy, stars, finishedModule })
const h = (res: ReturnType<typeof r>, earlier: TestPoint[]) => testHeadline(res, earlier, 0.95, 60)

describe('testHeadline', () => {
  it('celebrates finishing the module only when it happens', () => {
    expect(h(r(70, 0.97, 1, true), [])).toEqual({ kind: 'moduleDone' })
  })

  it('names the first test a starting point', () => {
    expect(h(r(70, 0.97, 1), [])).toEqual({ kind: 'firstTest', valid: true })
    expect(h(r(70, 0.9, 0), [])).toEqual({ kind: 'firstTest', valid: false })
  })

  it('separates fast-but-sloppy from not there yet', () => {
    expect(h(r(80, 0.94, 0), [pt(70)])).toEqual({ kind: 'fastButSloppy' })
    expect(h(r(50, 0.97, 0), [pt(70)])).toEqual({ kind: 'notYet' })
  })

  it('prefers a new star over a new record', () => {
    expect(h(r(75, 0.97, 2), [pt(70, 0.97, 1)])).toEqual({ kind: 'newStar', stars: 2 })
    expect(h(r(80, 0.97, 2), [pt(75, 0.97, 2)])).toEqual({ kind: 'newRecord', gain: 5 })
  })

  it('ignores invalid earlier attempts for the record', () => {
    expect(h(r(80, 0.97, 2), [pt(75, 0.97, 2), pt(90, 0.9, 0)])).toEqual({ kind: 'newRecord', gain: 5 })
  })

  it('holds, dips below, or drops a tier without losing the best', () => {
    expect(h(r(84, 0.97, 2), [pt(86, 0.97, 2)])).toEqual({ kind: 'holds' })
    expect(h(r(78, 0.97, 2), [pt(86, 0.97, 2)])).toEqual({ kind: 'belowRecord', best: 86 })
    expect(h(r(70, 0.97, 1), [pt(86, 0.97, 2)])).toEqual({ kind: 'lowerTier', bestStars: 2 })
  })
})

describe('threeInARow', () => {
  it('needs three valid tests, each faster', () => {
    expect(threeInARow({ kpm: 80, accuracy: 0.97 }, [pt(60), pt(70)], 0.95)).toBe(true)
    expect(threeInARow({ kpm: 80, accuracy: 0.97 }, [pt(70), pt(60)], 0.95)).toBe(false)
    expect(threeInARow({ kpm: 80, accuracy: 0.97 }, [pt(60), pt(99, 0.9), pt(70)], 0.95)).toBe(true)
    expect(threeInARow({ kpm: 80, accuracy: 0.9 }, [pt(60), pt(70)], 0.95)).toBe(false)
  })
})
