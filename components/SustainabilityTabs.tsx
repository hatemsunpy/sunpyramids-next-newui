"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type SustainabilitySection = { title: string; html: string };

export function SustainabilityTabs({ sections }: {
  sections: SustainabilitySection[];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ pointerId: number; x: number; y: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    // Touch scrolling stays native, including vertical scrolling and momentum.
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const rail = event.currentTarget;
    if (rail.scrollWidth <= rail.clientWidth) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: rail.scrollLeft, moved: false };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.buttons !== 1) return finishDrag(event);
    const distanceX = event.clientX - current.x;
    const distanceY = event.clientY - current.y;
    if (!current.moved && Math.abs(distanceX) < 6) return;
    if (!current.moved && Math.abs(distanceY) > Math.abs(distanceX)) {
      drag.current = null;
      return;
    }
    const rail = event.currentTarget;
    if (!current.moved) {
      current.moved = true;
      suppressClick.current = true;
      rail.setPointerCapture(event.pointerId);
      rail.classList.add("is-dragging");
    }
    event.preventDefault();
    rail.scrollLeft = current.scrollLeft - distanceX;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    const rail = event.currentTarget;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + (isRtl ? -1 : 1) + sections.length) % sections.length; break;
      case "ArrowLeft": next = (index + (isRtl ? 1 : -1) + sections.length) % sections.length; break;
      case "Home": next = 0; break;
      case "End": next = sections.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="sustainability-tabs">
      <div
        className="sustainability-tab-list"
        role="tablist"
        aria-label="Sustainability"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {sections.map((section, index) => (
          <button
            key={section.title}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {section.title}
          </button>
        ))}
      </div>
      {sections.map((section, index) => (
        <section
          key={section.title}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={selected !== index}
          className="sustainability-tab-panel"
        >
          <div className="editorial-prose" dangerouslySetInnerHTML={{ __html: section.html }} />
        </section>
      ))}
    </div>
  );
}
