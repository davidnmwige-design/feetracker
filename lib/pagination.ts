// Backward-compatible list pagination.
//
// When a request includes no `page`/`limit` query params, callers keep their current
// "return everything" behaviour (so existing front-end code is unaffected). When either
// param is present, the endpoint switches to a paginated `{ data, total, page, limit,
// totalPages }` response.

export interface Pagination {
  paginated: boolean
  page: number
  limit: number
  skip: number
  take: number
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export function parsePagination(searchParams: URLSearchParams): Pagination {
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')
  const paginated = pageParam !== null || limitParam !== null

  const page = Math.max(1, Math.floor(Number(pageParam)) || 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(limitParam)) || DEFAULT_LIMIT))

  return { paginated, page, limit, skip: (page - 1) * limit, take: limit }
}

export function paginatedResponse<T>(data: T[], total: number, p: Pagination) {
  return { data, total, page: p.page, limit: p.limit, totalPages: Math.ceil(total / p.limit) }
}
