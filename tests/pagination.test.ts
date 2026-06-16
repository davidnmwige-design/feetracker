import { describe, it, expect } from 'vitest'
import { parsePagination, paginatedResponse } from '../lib/pagination'

const sp = (qs: string) => new URLSearchParams(qs)

describe('parsePagination', () => {
  it('is not paginated when no page/limit params are present', () => {
    const p = parsePagination(sp(''))
    expect(p.paginated).toBe(false)
  })

  it('is not paginated even when other params (e.g. q) are present', () => {
    expect(parsePagination(sp('q=jane')).paginated).toBe(false)
  })

  it('paginates when page is present, with default limit 50', () => {
    const p = parsePagination(sp('page=3'))
    expect(p).toMatchObject({ paginated: true, page: 3, limit: 50, skip: 100, take: 50 })
  })

  it('paginates when only limit is present', () => {
    const p = parsePagination(sp('limit=25'))
    expect(p).toMatchObject({ paginated: true, page: 1, limit: 25, skip: 0 })
  })

  it('clamps limit to the 1..200 range and floors page to >= 1', () => {
    expect(parsePagination(sp('page=0&limit=9999')).limit).toBe(200) // over-max -> 200
    expect(parsePagination(sp('page=-5')).page).toBe(1)              // negative page -> 1
    expect(parsePagination(sp('limit=1')).limit).toBe(1)             // smallest valid limit
    expect(parsePagination(sp('limit=0')).limit).toBe(50)           // invalid (falsy) -> default
  })

  it('ignores non-numeric values (falls back to defaults)', () => {
    const p = parsePagination(sp('page=abc&limit=xyz'))
    expect(p).toMatchObject({ page: 1, limit: 50 })
  })
})

describe('paginatedResponse', () => {
  it('wraps data with total/page/limit/totalPages', () => {
    const p = parsePagination(sp('page=2&limit=10'))
    expect(paginatedResponse([{ id: 1 }], 95, p)).toEqual({
      data: [{ id: 1 }], total: 95, page: 2, limit: 10, totalPages: 10,
    })
  })
})
