import Link from "next/link";

export function EmptyState({
  title = "No experiences found",
  description = "We couldn't find any tours matching your current search or filter criteria. Try clearing some filters or searching for another keyword.",
  actionLabel = "Clear all filters",
  actionHref,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="discovery-empty" role="region" aria-label="No results">
      <div className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      {actionHref ? (
        <Link href={actionHref} className="empty-action">
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className="empty-action">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
