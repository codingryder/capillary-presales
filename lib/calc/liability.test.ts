import { describe, expect, it } from 'vitest'
import { pointsLiability } from './liability'

describe('pointsLiability', () => {
  it('multiplies outstandingPoints by pointValue', () => {
    // 30,000,000 outstanding × ₹0.10 per point = ₹3,000,000 liability
    const m = pointsLiability({ outstandingPoints: 30_000_000, pointValue: 0.1 })
    expect(m.value).toBe(3_000_000)
    expect(m.unit).toBe('currency')
    expect(m.inputs).toEqual({ outstandingPoints: 30_000_000, pointValue: 0.1 })
    expect(m.formula).toContain('outstandingPoints')
  })

  it('returns 0 when no outstanding points', () => {
    expect(
      pointsLiability({ outstandingPoints: 0, pointValue: 0.1 }).value,
    ).toBe(0)
  })
})
