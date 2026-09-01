"use client";

import { useId, useState, type ReactNode } from "react";

export function TourCollapsible({
  title,
  children,
  defaultOpen = false,
  actions,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="tour-collapsible">
      <div className="tour-collapsible-head">
        <h2>{title}</h2>
        <div className="tour-collapsible-actions">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
            className={`tour-collapsible-toggle ${open ? "is-open" : ""}`}
          >
            ▼
          </button>
        </div>
      </div>
      {open ? <div id={contentId} className="tour-collapsible-body">{children}</div> : null}
    </div>
  );
}
