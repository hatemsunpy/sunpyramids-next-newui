import { apiFetch, apiFetchReliable, type ApiResult } from "@/lib/api";
import type {
  ApiList,
  ApiPage,
  Locale,
  PublicSiteSettings,
  SiteSetting,
  SocialLink,
  TeamMember,
  Tour,
  TripTaxonomy,
} from "@/types/api";
import { TRIP_TYPE_SLUGS } from "@/lib/trip-types";

function listData<T>(response: ApiList<T> | null | undefined): T[] {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

export async function getPage(slug: string, locale: Locale) {
  const response = await apiFetch<{ data?: ApiPage }>(
    `pages/${slug}?includes=seo,metas`,
    { locale },
  );
  return response?.data ?? null;
}

export async function getPageReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage>> {
  const apiResult = await apiFetchReliable<{ data?: ApiPage }>(
    `pages/${encodeURIComponent(slug)}?includes=seo,metas`,
    { locale },
  );
  if (!apiResult.ok) return apiResult;
  if (!apiResult.value?.data) {
    return { ok: false, reason: "invalid_response", message: "Page response did not contain data" };
  }
  return { ok: true, value: apiResult.value.data };
}

export async function getDestination(slug: string, locale: Locale) {
  const response = await apiFetch<{ data?: ApiPage }>(
    `destinations/${encodeURIComponent(slug)}?includes=seo`,
    { locale },
  );
  return response?.data ?? null;
}

export async function getDestinationReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const apiResult = await apiFetchReliable<{ data?: ApiPage }>(
    `destinations/${encodeURIComponent(slug)}?includes=seo`,
    { locale },
  );
  if (!apiResult.ok) return apiResult;
  if (!apiResult.value?.data) {
    return { ok: false, reason: "invalid_response", message: "Destination response did not contain data" };
  }
  return { ok: true, value: apiResult.value.data };
}

export async function getHome(locale: Locale) {
  const response = await apiFetch<{ data?: ApiPage }>("pages/home?includes=seo", {
    locale,
  });
  return response?.data ?? null;
}

export async function getHomeTours(endpoint: string, locale: Locale) {
  const response = await apiFetch<ApiList<Tour>>(endpoint, { locale });
  return listData(response);
}

export async function getHomeDestinations(locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>(
    "destinations/home?page_limit=200&parent.slug=egypt&order_by=display_order,asc",
    { locale },
  );
  return listData(response);
}

export async function getHomeFaqs(locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>("faqs/home?page_limit=5", { locale });
  return listData(response);
}

export async function getHomeBlogs(locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>(
    "blogs/home?page_limit=8&order_by=id,desc",
    { locale },
  );
  return listData(response);
}

export async function getTours(endpoint: string, locale: Locale, limit = 8, page = 1) {
  const sep = endpoint.includes("?") ? "&" : "?";
  const response = await apiFetch<ApiList<Tour>>(
    `${endpoint}${sep}page_limit=${limit}&page=${page}`,
    { locale },
  );
  return response ?? null;
}

export function tourListData(response: ApiList<Tour> | null | undefined): Tour[] {
  return listData(response);
}

export function tourMeta(response: ApiList<Tour> | null | undefined) {
  const data = response?.data;
  if (Array.isArray(data)) {
    return { from: 1, to: data.length, total: data.length, lastPage: 1 };
  }
  const total = data?.total ?? response?.total ?? data?.data?.length ?? 0;
  const to = data?.to ?? response?.to ?? data?.data?.length ?? 0;
  return {
    from: total === 0 ? 0 : (data?.from ?? response?.from ?? 1),
    to: total === 0 ? 0 : to,
    total,
    lastPage: data?.last_page ?? response?.last_page ?? 1,
  };
}

export async function getDestinations(endpoint: string, locale: Locale, limit = 200) {
  const response = await apiFetch<ApiList<ApiPage>>(
    `${endpoint}${endpoint.includes("?") ? "&" : "?"}page_limit=${limit}`,
    { locale },
  );
  return listData(response);
}

export async function getCategories(endpoint: string, locale: Locale, limit = 100) {
  const response = await apiFetch<ApiList<ApiPage>>(
    `${endpoint}${endpoint.includes("?") ? "&" : "?"}page_limit=${limit}`,
    { locale },
  );
  return listData(response);
}

async function getListReliable<T>(endpoint: string, locale: Locale): Promise<ApiResult<T[]>> {
  const result = await apiFetchReliable<ApiList<T>>(endpoint, { locale });
  if (!result.ok) return result;
  return { ok: true, value: listData(result.value) };
}

export async function getTripTaxonomy(locale: Locale): Promise<TripTaxonomy> {
  const [categoriesResult, countsResult, destinationsResult] = await Promise.all([
    getListReliable<ApiPage>("categories?page_limit=200&order_by=display_order,asc", locale),
    apiFetchReliable<{ data?: Record<string, number> }>("categories/count", { locale }),
    getListReliable<ApiPage>("destinations?page_limit=200&parent.slug=egypt&order_by=display_order,asc", locale),
  ]);

  const categories = categoriesResult.ok ? (categoriesResult.value ?? []) : [];
  const hasReportedCounts = countsResult.ok && Boolean(countsResult.value?.data);
  const reportedCounts = hasReportedCounts ? countsResult.value?.data ?? {} : {};
  const missingCountCategories = hasReportedCounts ? categories.filter(
    (category) =>
      category.id &&
      category.slug &&
      TRIP_TYPE_SLUGS.some((slug) => slug === category.slug) &&
      reportedCounts[category.slug] === undefined,
  ) : [];
  const missingCountResults = await Promise.all(
    missingCountCategories.map((category) =>
      apiFetchReliable<ApiList<Tour>>(
        `tours?categories.id%5B%5D=${encodeURIComponent(String(category.id))}&page_limit=1&page=1`,
        { locale },
      ),
    ),
  );
  const counts = { ...reportedCounts };
  missingCountResults.forEach((countResult, index) => {
    const slug = missingCountCategories[index]?.slug;
    if (slug && countResult.ok) counts[slug] = tourMeta(countResult.value).total;
  });
  const countSlugs = new Set(Object.keys(counts));
  const rootCategories = categories.filter(
    (category) => category.parent_id == null && category.slug && countSlugs.has(category.slug),
  );
  const rootIds = new Set(rootCategories.map((category) => category.id).filter(Boolean));
  const childCategories = categories.filter((category) => rootIds.has(category.parent_id as number));
  const destinations = destinationsResult.ok ? (destinationsResult.value ?? []) : [];

  return {
    allCategories: categories,
    rootCategories,
    childCategories,
    destinations,
    counts,
    available: rootCategories.length > 0 || childCategories.length > 0 || destinations.length > 0,
  };
}

export async function getSettingValueReliable<T>(
  optionKey: string,
  locale: Locale,
): Promise<ApiResult<T | null>> {
  const result = await apiFetchReliable<{ data?: SiteSetting[] }>(
    `settings?option_key=${encodeURIComponent(optionKey)}`,
    { locale },
  );
  if (!result.ok) return result;
  const setting = result.value?.data?.find((item) => item.option_key === optionKey);
  return { ok: true, value: (setting?.option_value as T | undefined) ?? null };
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
}

function firstString(value: unknown): string | null {
  return stringList(value)[0] ?? null;
}

function socialList(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SocialLink =>
      !!item &&
      typeof item === "object" &&
      typeof (item as SocialLink).type === "string" &&
      typeof (item as SocialLink).url === "string",
  );
}

export async function getPublicSiteSettings(locale: Locale): Promise<PublicSiteSettings> {
  // Request only public presentation keys. The unfiltered endpoint also contains
  // operational settings that must never be copied into the browser payload.
  const [title, emails, socials, location] = await Promise.all([
    getSettingValueReliable<unknown>("site_title", locale),
    getSettingValueReliable<unknown>("notification_emails", locale),
    getSettingValueReliable<unknown>("social_links", locale),
    getSettingValueReliable<unknown>("company_location_url", locale),
  ]);

  return {
    siteTitle: title.ok ? firstString(title.value) : null,
    notificationEmails: emails.ok ? stringList(emails.value) : [],
    socialLinks: socials.ok ? socialList(socials.value) : [],
    locationUrl: location.ok ? firstString(location.value) : null,
  };
}

export async function getCompanyTeam(locale: Locale): Promise<TeamMember[]> {
  const result = await getSettingValueReliable<unknown>("company_team", locale);
  if (!result.ok || !Array.isArray(result.value)) return [];
  return result.value.filter(
    (item): item is TeamMember =>
      !!item &&
      typeof item === "object" &&
      typeof (item as TeamMember).name === "string" &&
      typeof (item as TeamMember).position === "string" &&
      typeof (item as TeamMember).image === "string",
  );
}

export async function getCategory(slug: string, locale: Locale) {
  const response = await apiFetch<{ data?: ApiPage }>(
    `categories/${encodeURIComponent(slug)}?includes=seo,children`,
    { locale },
  );
  return response?.data ?? null;
}

export async function getCategoryReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const apiResult = await apiFetchReliable<{ data?: ApiPage }>(
    `categories/${encodeURIComponent(slug)}?includes=seo,children`,
    { locale },
  );
  if (!apiResult.ok) {
    if (apiResult.reason === "not_found" && /[&?#]/.test(slug)) {
      const summaryResult = await apiFetchReliable<ApiList<ApiPage>>(
        "categories?page_limit=200&order_by=display_order,asc",
        { locale },
      );
      if (!summaryResult.ok) return summaryResult;

      const summary = listData(summaryResult.value).find((category) => category.slug === slug);
      if (!summary) return { ok: false, reason: "not_found" };
      if (summary.id == null) return { ok: true, value: summary };

      const detailResult = await apiFetchReliable<ApiList<ApiPage>>(
        `categories?id=${encodeURIComponent(String(summary.id))}&page_limit=1&includes=seo,children`,
        { locale },
      );
      if (!detailResult.ok) return detailResult;

      const detail = listData(detailResult.value).find((category) => category.slug === slug);
      return detail
        ? { ok: true, value: detail }
        : { ok: false, reason: "invalid_response", message: "Category list detail did not contain the matched entity" };
    }
    return apiResult;
  }
  if (!apiResult.value?.data) {
    return { ok: false, reason: "invalid_response", message: "Category response did not contain data" };
  }
  return { ok: true, value: apiResult.value.data };
}

export async function getBlogCategories(locale: Locale, parentId: number | null = null) {
  const parent = parentId === null ? "%5Bnull%5D" : String(parentId);
  const response = await apiFetch<ApiList<ApiPage>>(
    `blog-categories?page=1&parent_id=${parent}`,
    { locale },
  );
  return listData(response);
}

export async function getBlogCategory(slugOrId: string | number, locale: Locale) {
  if (typeof slugOrId === "number" || /^\d+$/.test(String(slugOrId))) {
    const response = await apiFetch<{ data?: ApiPage }>(
      `blog-categories/${encodeURIComponent(String(slugOrId))}?page=1`,
      { locale },
    );
    return response?.data ?? null;
  }
  const response = await apiFetch<ApiList<ApiPage>>(
    `blog-categories?slug%5B%5D=${encodeURIComponent(String(slugOrId))}&includes=seo&exists=children&page_limit=100`,
    { locale },
  );
  return listData(response)[0] ?? null;
}

export async function getFaqs(locale: Locale, limit = 200) {
  const response = await apiFetch<ApiList<ApiPage>>(`faqs?page_limit=${limit}`, {
    locale,
  });
  return listData(response);
}

export async function getTour(slug: string, locale: Locale) {
  const includes = "seo,destinations,categories,options,days,seasons";
  const response = await apiFetch<{ data?: Tour }>(
    `tours/${encodeURIComponent(slug)}?includes=${includes}`,
    { locale, next: { revalidate: 180 } },
  );

  if (response?.data) return response.data;

  const fallback = await apiFetch<ApiList<Tour>>(
    `tours?slug=${encodeURIComponent(slug)}&includes=${includes}`,
    { locale, next: { revalidate: 180 } },
  );
  return listData(fallback)[0] ?? null;
}

function tourSlugNeedsListFallback(slug: string) {
  return /[&?#]/.test(slug);
}

async function findTourByExactSlug(
  slug: string,
  locale: Locale,
  includes: string,
): Promise<ApiResult<Tour>> {
  const endpoint = "tours?page_limit=50";
  const firstResult = await apiFetchReliable<ApiList<Tour>>(`${endpoint}&page=1`, {
    locale,
    next: { revalidate: 180 },
  });
  if (!firstResult.ok) return firstResult;

  let summary = listData(firstResult.value).find((tour) => tour.slug === slug);

  const lastPage = apiListLastPage(firstResult.value);
  if (!summary && lastPage > 1) {
    const remainingResults = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, index) =>
        apiFetchReliable<ApiList<Tour>>(`${endpoint}&page=${index + 2}`, {
          locale,
          next: { revalidate: 180 },
        }),
      ),
    );

    for (const pageResult of remainingResults) {
      if (!pageResult.ok) return pageResult;
      summary = listData(pageResult.value).find((tour) => tour.slug === slug);
      if (summary) break;
    }
  }

  if (!summary) return { ok: false, reason: "not_found" };
  if (summary.id == null) return { ok: true, value: summary };

  const detailResult = await apiFetchReliable<ApiList<Tour>>(
    `tours?id=${encodeURIComponent(String(summary.id))}&page_limit=1&includes=${includes}`,
    { locale, next: { revalidate: 180 } },
  );
  if (!detailResult.ok) return detailResult;

  const detail = listData(detailResult.value).find((tour) => tour.slug === slug);
  return detail
    ? { ok: true, value: detail }
    : { ok: false, reason: "invalid_response", message: "Tour list detail did not contain the matched entity" };
}

export async function getTourReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<Tour>> {
  const includes = "seo,destinations,categories,options,days,seasons";
  const apiResult = await apiFetchReliable<{ data?: Tour }>(
    `tours/${encodeURIComponent(slug)}?includes=${includes}`,
    { locale, next: { revalidate: 180 } },
  );
  if (!apiResult.ok) {
    if (apiResult.reason === "not_found" && tourSlugNeedsListFallback(slug)) {
      return findTourByExactSlug(slug, locale, includes);
    }
    return apiResult;
  }
  if (!apiResult.value?.data) {
    return { ok: false, reason: "invalid_response", message: "Tour response did not contain data" };
  }
  return { ok: true, value: apiResult.value.data };
}

export async function getRelatedTours(tour: Tour | null, locale: Locale, limit = 12) {
  if (!tour?.id) return [];
  const categoryIds = (tour.categories ?? []).map((c) => c.id).filter(Boolean);
  if (!categoryIds.length) return [];
  const params = new URLSearchParams();
  params.set("page_limit", String(limit + 1));
  params.set("order_by", "display_order,asc");
  params.set("exists", "wishlisted");
  categoryIds.forEach((id) => params.append("categories.id[]", String(id)));
  const response = await apiFetch<ApiList<Tour>>(`tours?${params.toString()}`, { locale });
  return listData(response).filter((item) => item.id !== tour.id).slice(0, limit);
}

export async function getCategoryBlogs(categorySlug: string, locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>(
    `blogs?page=1&order_by=display_order,asc&includes=%26categories.slug=${encodeURIComponent(categorySlug)}`,
    { locale },
  );
  return listData(response);
}

export async function getBlogCategoryReliable(
  slugOrId: string | number,
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const isId = typeof slugOrId === "number" || /^\d+$/.test(String(slugOrId));

  if (isId) {
    const detailResult = await apiFetchReliable<{ data?: ApiPage }>(
      `blog-categories/${encodeURIComponent(String(slugOrId))}?page=1`,
      { locale },
    );
    if (!detailResult.ok) return detailResult;
    return { ok: true, value: detailResult.value?.data ?? null };
  }

  const summaryResult = await apiFetchReliable<ApiList<ApiPage>>(
    `blog-categories?slug%5B%5D=${encodeURIComponent(String(slugOrId))}&includes=seo&exists=children&page_limit=100`,
    { locale },
  );
  if (!summaryResult.ok) return summaryResult;

  const summary = listData(summaryResult.value)[0] ?? null;
  return { ok: true, value: summary };
}

export async function getBlogCategoryDetailReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const summaryResult = await getBlogCategoryReliable(slug, locale);
  if (!summaryResult.ok) return summaryResult;

  const summary = summaryResult.value;
  if (!summary || summary.id == null) return summaryResult;

  const detailResult = await getBlogCategoryReliable(summary.id, locale);
  if (!detailResult.ok) return detailResult;

  const detail = detailResult.value;
  if (!detail) {
    return {
      ok: false,
      reason: "invalid_response",
      message: "Blog category detail response did not contain data",
    };
  }

  return {
    ok: true,
    value: {
      ...summary,
      ...detail,
      seo: summary.seo ?? detail.seo,
    },
  };
}

function apiListLastPage(response: ApiList<unknown> | null): number {
  const pagination = Array.isArray(response?.data) ? response : response?.data;
  return pagination?.last_page ?? response?.last_page ?? 1;
}

function uniqueBlogs(blogPages: ApiPage[][]): ApiPage[] {
  const seen = new Set<string>();
  return blogPages.flat().filter((blog) => {
    const key = blog.id != null ? `id:${blog.id}` : blog.slug ? `slug:${blog.slug}` : null;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function blogCategoryExists(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const result = await apiFetchReliable<ApiList<ApiPage>>(
    `blog-categories?slug%5B%5D=${encodeURIComponent(slug)}&exists=children&page_limit=1`,
    { locale },
  );

  if (!result.ok) return result;
  return { ok: true, value: listData(result.value)[0] ?? null };
}

export async function getCategoryBlogsReliable(
  categorySlug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage[]>> {
  const endpoint =
    `blogs?order_by=display_order,asc&includes=%26categories.slug=${encodeURIComponent(categorySlug)}&page_limit=100`;
  const firstResult = await apiFetchReliable<ApiList<ApiPage>>(
    `${endpoint}&page=1`,
    { locale },
  );

  if (!firstResult.ok) return firstResult;

  const firstResponse = firstResult.value;
  const lastPage = apiListLastPage(firstResponse);
  const pages = [listData(firstResponse)];

  if (lastPage > 1) {
    const remainingResults = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, index) =>
        apiFetchReliable<ApiList<ApiPage>>(`${endpoint}&page=${index + 2}`, { locale }),
      ),
    );

    for (const pageResult of remainingResults) {
      if (!pageResult.ok) return pageResult;
      pages.push(listData(pageResult.value));
    }
  }

  return { ok: true, value: uniqueBlogs(pages) };
}

export async function getBlogs(locale: Locale, limit = 9) {
  const response = await apiFetch<ApiList<ApiPage>>(
    `blogs?page_limit=${limit}&order_by=id,desc`,
    { locale },
  );
  return listData(response);
}

export type BlogListing = {
  blogs: ApiPage[];
  currentPage: number;
  lastPage: number;
};

function blogListingData(response: ApiList<ApiPage> | null | undefined): BlogListing {
  const pagination = Array.isArray(response?.data) ? response : response?.data;
  return {
    blogs: listData(response),
    currentPage: pagination?.current_page ?? 1,
    lastPage: pagination?.last_page ?? 1,
  };
}

export async function getBlogListing(
  locale: Locale,
  title = "",
) {
  const params = new URLSearchParams({
    includes: "categories,seo",
    page_limit: "10",
    order_by: "display_order,asc",
    page: "1",
  });
  if (title.trim()) params.set("title", `*${title.trim()}*`);
  const response = await apiFetch<ApiList<ApiPage>>(`blogs?${params.toString()}`, { locale });
  return blogListingData(response);
}

export async function getAllBlogCategories(locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>("blog-categories?page_limit=100", { locale });
  const livePageExcludedCategoryId = "36";
  return listData(response).filter((category) => String(category.id ?? "").trim() !== livePageExcludedCategoryId);
}

export async function getBlogFaqs(locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>(
    "faqs?page_limit=5&tag%5B%5D=pages.general&tag%5B%5D=pages.blog",
    { locale },
  );
  return listData(response);
}

export async function getBlog(slug: string, locale: Locale) {
  const response = await apiFetch<{ data?: ApiPage }>(
    `blogs/${encodeURIComponent(slug)}?includes=seo,category,related`,
    { locale },
  );
  return response?.data ?? null;
}

export async function getBlogReliable(
  slug: string,
  locale: Locale,
): Promise<ApiResult<ApiPage>> {
  const apiResult = await apiFetchReliable<{ data?: ApiPage }>(
    `blogs/${encodeURIComponent(slug)}?includes=seo,categories,relatedTours`,
    { locale },
  );
  if (!apiResult.ok) return apiResult;
  if (!apiResult.value?.data) {
    return { ok: false, reason: "invalid_response", message: "Blog response did not contain data" };
  }
  return { ok: true, value: apiResult.value.data };
}

export async function getBlogPostFaqs(slug: string, locale: Locale) {
  const response = await apiFetch<ApiList<ApiPage>>(
    `faqs?page_limit=5&tag%5B%5D=blogs.general&tag%5B%5D=blogs.${encodeURIComponent(slug)}`,
    { locale },
  );
  return listData(response);
}

export async function getRelatedBlogs(slug: string, locale: Locale) {
  const params = new URLSearchParams({
    page_limit: "5",
    order_by: "display_order,asc",
    slug: `!eq::${slug}`,
  });
  const response = await apiFetch<ApiList<ApiPage>>(`blogs?${params.toString()}`, { locale });
  return listData(response);
}
