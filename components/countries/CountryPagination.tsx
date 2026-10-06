import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/Pagination"

import { pageList } from "./helpers/page-list"

export function CountryPagination({
  page,
  totalPages,
  params,
}: {
  page: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v)
    if (p > 1) search.set("page", String(p))
    const query = search.toString()
    return `/countries${query ? `?${query}` : ""}`
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={href(Math.max(1, page - 1))}
            text=""
            aria-disabled={page === 1}
            className={page === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href={href(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href={href(Math.min(totalPages, page + 1))}
            text=""
            aria-disabled={page === totalPages}
            className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
