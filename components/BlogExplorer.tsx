"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import { EmptyState } from "@/components/EmptyState";
import { apiGet } from "@/lib/client-api";
import { blogCopy } from "@/lib/blog-copy";
import type { BlogListing } from "@/lib/data";
import type { ApiList, ApiPage, Locale } from "@/types/api";

type SortOrder = "asc" | "desc";
type BlogRequest = { page: number; title: string; category: string; order: SortOrder; append?: boolean };

function listingFromResponse(response: ApiList<ApiPage>): BlogListing {
  const pagination = Array.isArray(response.data) ? response : response.data;
  const blogs = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data) ? response.data.data : [];
  return {
    blogs,
    currentPage: pagination?.current_page ?? 1,
    lastPage: pagination?.last_page ?? 1,
  };
}

function blogEndpoint(request: BlogRequest) {
  const params = new URLSearchParams({
    includes: "categories,seo",
    page_limit: "10",
    order_by: `display_order,${request.order}`,
    page: String(request.page),
  });
  if (request.category) params.set("categories.slug", request.category);
  if (request.title.trim()) params.set("title", `*${request.title.trim()}*`);
  return `blogs?${params.toString()}`;
}

function appendUniqueBlogs(currentBlogs: ApiPage[], nextBlogs: ApiPage[]) {
  return [...currentBlogs, ...nextBlogs.filter((nextBlog) => !currentBlogs.some((currentBlog) => currentBlog.id === nextBlog.id))];
}

export function BlogExplorer({
  initialListing,
  categories,
  locale = "en",
  initialTitle = "",
}: {
  initialListing: BlogListing;
  categories: ApiPage[];
  locale?: Locale;
  initialTitle?: string;
}) {
  const labels = blogCopy(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [blogs, setBlogs] = useState(initialListing.blogs);
  const [currentPage, setCurrentPage] = useState(initialListing.currentPage);
  const [lastPage, setLastPage] = useState(initialListing.lastPage);
  const [searchInput, setSearchInput] = useState(initialTitle);
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState<"" | SortOrder>("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadBlogs(request: BlogRequest) {
    setPending(true);
    setFailed(false);
    try {
      const response = await apiGet<ApiList<ApiPage>>(blogEndpoint(request), locale, false);
      const listing = listingFromResponse(response);
      setBlogs((currentBlogs) => request.append
        ? appendUniqueBlogs(currentBlogs, listing.blogs)
        : listing.blogs);
      setCurrentPage(listing.currentPage);
      setLastPage(listing.lastPage);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  function updateTitleQuery(nextTitle: string) {
    const query = new URLSearchParams();
    if (nextTitle) query.set("title", nextTitle);
    router.replace(query.size ? `${pathname}?${query.toString()}` : pathname, { scroll: false });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = searchInput.trim();
    setTitle(nextTitle);
    updateTitleQuery(nextTitle);
    void loadBlogs({ page: 1, title: nextTitle, category, order: order || "asc" });
  }

  function selectCategory(nextSlug: string) {
    const nextCategory = category === nextSlug ? "" : nextSlug;
    setCategory(nextCategory);
    void loadBlogs({ page: 1, title, category: nextCategory, order: order || "asc" });
  }

  function selectOrder(nextOrder: SortOrder) {
    setOrder(nextOrder);
    void loadBlogs({ page: 1, title, category, order: nextOrder });
  }

  return (
    <>
      <section className="blogs-controls">
        <form className="blogs-search-panel" role="search" onSubmit={submitSearch}>
          <label className="blogs-search-field">
            <span className="sr-only">{labels.placeholder}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={labels.placeholder} />
          </label>
          <button className="btn-primary blogs-search-button" type="submit" aria-label={labels.search}>
            <span>{labels.search}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>
          </button>
        </form>

        <div className="blogs-filter-row">
          <div className="blogs-tags" role="group" aria-label={labels.popularTags}>
            <span className="blogs-tags-label">{labels.popularTags}</span>
            {categories.map((categoryTag) => {
              const slug = categoryTag.slug || String(categoryTag.id || "");
              const selected = category === slug;
              return (
                <button className={selected ? "is-selected" : ""} type="button" key={categoryTag.id || slug} aria-pressed={selected} onClick={() => selectCategory(slug)}>
                  {categoryTag.title || categoryTag.name}
                  {selected ? <span aria-hidden="true">×</span> : null}
                </button>
              );
            })}
          </div>
          <label className="blogs-sort">
            <span className="sr-only">{labels.sortBy}</span>
            <select value={order} onChange={(event) => selectOrder(event.target.value as SortOrder)}>
              <option value="" disabled>{labels.sortBy}</option>
              <option value="asc">{labels.asc}</option>
              <option value="desc">{labels.desc}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="blogs-results" aria-busy={pending}>
        <h2 className="blogs-results-title">Latest travel stories</h2>
        <div className="blogs-grid">
          {blogs.map((blog) => <BlogCard key={blog.id || blog.slug} blog={blog} locale={locale} variant="listing" />)}
        </div>
        {!blogs.length && !pending ? (
          <EmptyState
            title="No articles found"
            description={labels.empty}
            actionLabel="Reset search & filters"
            onAction={() => {
              setSearchInput("");
              setTitle("");
              setCategory("");
              setOrder("");
              updateTitleQuery("");
              void loadBlogs({ page: 1, title: "", category: "", order: "asc" });
            }}
          />
        ) : null}

        {failed ? <p className="blogs-error" role="alert">Something went wrong. Please try again.</p> : null}
        {currentPage < lastPage ? (
          <div className="blogs-see-more">
            <span />
            <button className="btn-primary" type="button" disabled={pending} onClick={() => loadBlogs({ page: currentPage + 1, title, category, order: order || "asc", append: true })}>
              {pending ? "…" : labels.seeMore}
              <span aria-hidden="true">⌄</span>
            </button>
            <span />
          </div>
        ) : null}
      </section>
    </>
  );
}
