import Link from "next/link";

export function SectionEyebrow({ children }: { children: string }) {
  return <span aria-hidden="true" className="section-heading-eyebrow">{children}</span>;
}

export function SectionHeading({
  title,
  description,
  href,
  linkLabel,
  align = "split",
  eyebrow,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "split" | "center";
  eyebrow?: string;
}) {
  return (
    <div className={`section-heading-v2 section-heading-v2--${align}`}>
      <div>
        {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href && linkLabel ? <Link className="section-heading-link" href={href}>{linkLabel}<span aria-hidden="true">↗</span></Link> : null}
    </div>
  );
}
