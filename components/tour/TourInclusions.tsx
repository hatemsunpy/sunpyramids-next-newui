import { TourCollapsible } from "@/components/tour/TourCollapsible";

function TourBulletGlyph({ icon }: { icon: "check" | "cross" }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {icon === "check" ? <path d="m5.5 12.6 4.2 4.2 8.8-9.6" /> : <path d="m6.6 6.6 10.8 10.8M17.4 6.6 6.6 17.4" />}
    </svg>
  );
}

export function TourInclusions({ title, items, icon }: { title: string; items: string; icon: "check" | "cross" }) {
  const list = items.split(",").map((item) => item.trim()).filter(Boolean);
  return (
    <section className="tour-included-excluded">
      <TourCollapsible title={title} defaultOpen>
        <ul className="tour-bullet-list">
          {list.map((item, index) => (
            <li key={index}>
              <span className={`tour-bullet-icon ${icon}`} aria-hidden="true"><TourBulletGlyph icon={icon} /></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </TourCollapsible>
    </section>
  );
}
