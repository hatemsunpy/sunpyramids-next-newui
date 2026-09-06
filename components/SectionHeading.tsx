import Link from "next/link";

export function SectionHeading({
  title,
  description,
  href,
  linkLabel,
  align = "split",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "split" | "center";
}) {
  return (
    <div className={`section-heading-v2 section-heading-v2--${align}`}>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href && linkLabel ? <Link className="section-heading-link" href={href}>{linkLabel}<span aria-hidden="true">↗</span></Link> : null}
    </div>
  );
}
