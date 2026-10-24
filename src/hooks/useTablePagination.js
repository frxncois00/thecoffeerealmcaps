import { useState } from 'react'

export function useTablePagination(rows, resetKey = '', initialSize = 25) {
  const [state, setState] = useState({ page: 1, size: initialSize, resetKey })
  const pages = Math.max(1, Math.ceil(rows.length / state.size))
  const page = state.resetKey === resetKey ? Math.max(1, Math.min(state.page, pages)) : 1
  return {
    page, totalPages: pages, pageSize: state.size, total: rows.length,
    pageRows: rows.slice((page - 1) * state.size, page * state.size),
    onPageChange: (next) => setState((current) => ({ ...current, page: next, resetKey })),
    onPageSizeChange: (size) => setState({ page: 1, size, resetKey }),
  }
}
