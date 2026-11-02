import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BlogHighlights } from "@/components/BlogHighlights";
import type { ApiPage, Locale } from "@/types/api";

// The grouped block renders exactly the five newest listing records passed to
// it: one large lead article on the left and compact cards beside it. No data
// may be invented, and links must stay native Next links with locale prefixes.

function blog(id: number, overrides: Partial<ApiPage> = {}): ApiPage {
  return {
    id,
    title: `Newest article ${id}`,
    slug: `newest-article-${id}`,
    image: `https://cdn.example.com/article-${id}.webp`,
    created_at: `2026-11-0${Math.min(9, 10 - id)}T09:30:00.000000Z`,
    categories: [{ id: 7, title: "Culture", name: "Culture", slug: "culture" }],
    ...overrides,
  };
}

function articles(count: number, locale: Locale = "en"): ApiPage[] {
  return Array.from({ length: count }, (_, index) => blog(index + 1));
}

function cardTitles(container: HTMLElement) {
  return Array.from(container.querySelectorAll("h3"), (heading) => heading.textContent);
}

describe("BlogHighlights grouped block", () => {
  afterEach(() => {
    cleanup();
  });

  it("presents the newest five as one lead plus four compact side cards", () => {
    const { container } = render(
      <BlogHighlights articles={articles(5)} locale="en" heading="Newest articles" />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Newest articles" })).toBeInTheDocument();
    expect(container.querySelectorAll(".blog-highlights-lead")).toHaveLength(1);
    expect(container.querySelectorAll(".blog-highlights-card")).toHaveLength(5);
    expect(container.querySelectorAll(".blog-highlights-grid .blog-highlights-card")).toHaveLength(4);

    // Every card is a native link to its own article slug.
    const hrefs = Array.from(container.querySelectorAll("a"), (link) => link.getAttribute("href"));
    expect(hrefs).toHaveLength(5);
    expect(new Set(hrefs).size).toBe(5);
    expect(hrefs.every((href) => href?.startsWith("/blog/"))).toBe(true);
  });

  it("shows API-created_at as localized time elements without duplicating records", () => {
    const { container } = render(
      <BlogHighlights articles={articles(5)} locale="en" heading="Newest articles" />,
    );

    const times = Array.from(container.querySelectorAll("time"));
    expect(times).toHaveLength(5);
    expect(new Set(times.map((time) => time.getAttribute("dateTime"))).size).toBe(5);
    expect(times[0]).toContainHTML("Nov");

    expect(new Set(cardTitles(container)).size).toBe(5);
  });

  it("localizes links for prefix locales", () => {
    const { container } = render(
      <BlogHighlights articles={articles(1)} locale="fr" heading="Articles récents" />,
    );

    const href = container.querySelector("a")?.getAttribute("href");
    expect(href).toBe("/fr/blog/newest-article-1");
  });

  it("stays balanced when fewer than five articles exist", () => {
    const { container } = render(
      <BlogHighlights articles={articles(3)} locale="en" heading="Newest articles" />,
    );

    expect(container.querySelectorAll(".blog-highlights-lead")).toHaveLength(1);
    expect(container.querySelectorAll(".blog-highlights-grid .blog-highlights-card")).toHaveLength(2);
    expect(new Set(cardTitles(container)).size).toBe(3);
  });

  it("renders nothing for an empty listing", () => {
    const { container } = render(
      <BlogHighlights articles={[]} locale="en" heading="Newest articles" />,
    );

    expect(container.innerHTML).toBe("");
  });
});