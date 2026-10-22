import { BlogCard } from "@/components/BlogCard";
import { apiFetch } from "@/lib/api";
import type { ApiList, ApiPage, Locale } from "@/types/api";

export async function EventRelatedBlogs({ locale }: { locale: Locale }) {
  // Restore the legacy event page query; the backend owns this selection.
  const response = await apiFetch<ApiList<ApiPage>>(
    "blogs?page_limit=5&order_by=display_order,asc&categories.slug=disabled",
    { locale },
  );
  const blogs = Array.isArray(response?.data) ? response.data : response?.data?.data ?? [];
  if (!blogs.length) return null;

  return (
    <section className="editorial-related-section">
      <div className="editorial-container">
        <div className="section-header"><h2>Related Blogs</h2></div>
        <div className="discovery-grid">
          {blogs.map((blog) => <BlogCard key={blog.id || blog.slug} blog={blog} locale={locale} />)}
        </div>
      </div>
    </section>
  );
}
