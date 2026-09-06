import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";

export function BlogCard({ blog, locale = "en", variant = "default", className = "" }: { blog: ApiPage; locale?: Locale; variant?: "default" | "listing"; className?: string }) {
  const slug = blog.slug || String(blog.id || "");
  const title = blog.title || blog.name || "Egypt Travel Guide";
  const image = blog.featured_image || blog.image || blog.banner || "/images/blogsHero.png";

  return (
    <article className={`blog-card${variant === "listing" ? " blog-card-listing" : ""}${className ? ` ${className}` : ""}`}>
      <Link href={withLocale(`/blog/${slug}`, locale)}>
        <div className="blog-card-media">
          <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
        <div className="blog-card-body">
          {variant === "listing" && blog.categories?.length ? (
            <div className="blog-card-categories">
              <span>{blog.categories[0].title || blog.categories[0].name}</span>
              {blog.categories.length > 1 ? <span>+{blog.categories.length - 1} more</span> : null}
            </div>
          ) : <p>Travel Guide</p>}
          <h3 className="line-clamp-2">{title}</h3>
        </div>
      </Link>
    </article>
  );
}
