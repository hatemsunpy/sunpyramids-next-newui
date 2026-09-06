import Link from "next/link";

export function Pagination({
  page,
  lastPage,
  basePath,
  query,
}: {
  page: number;
  lastPage: number;
  basePath: string;
  query: URLSearchParams;
}) {
  const maxShown = 5;
  const half = Math.floor(maxShown / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(lastPage, start + maxShown - 1);
  if (end - start + 1 < maxShown && start > 1) {
    start = Math.max(1, end - maxShown + 1);
  }

  const pageUrl = (p: number) => {
    const next = new URLSearchParams(query);
    if (p === 1) {
      next.delete("page");
    } else {
      next.set("page", String(p));
    }
    const qs = next.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav className="pagination-bar" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={pageUrl(page - 1)}
          className="paginate-button paginate-nav"
          aria-label="Previous page"
        >
          &larr; Back
        </Link>
      )}

      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => {
        const isCurrent = p === page;
        return (
          <Link
            key={p}
            href={pageUrl(p)}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`paginate-button${isCurrent ? " active-page" : ""}`}
          >
            {p}
          </Link>
        );
      })}

      {page < lastPage && (
        <Link
          href={pageUrl(page + 1)}
          className="paginate-button paginate-nav"
          aria-label="Next page"
        >
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
