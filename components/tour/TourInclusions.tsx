import { TourCollapsible } from "@/components/tour/TourCollapsible";

export function TourInclusions({ title, items, icon }: { title: string; items: string; icon: "check" | "cross" }) {
  const list = items.split(",").map((item) => item.trim()).filter(Boolean);
  return (
    <section className="tour-included-excluded">
      <TourCollapsible title={title} defaultOpen>
        <ul className="tour-bullet-list">
          {list.map((item, index) => (
            <li key={index}>
              <span className={`tour-bullet-icon ${icon}`} aria-hidden="true">{icon === "check" ? "✓" : "−"}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </TourCollapsible>
    </section>
  );
}
