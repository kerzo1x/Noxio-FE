export interface PaginationMeta {
  totalCount: number
  currentPage: number
  totalPages: number
  pageSize: number
}

export interface ApiSuccess<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}
