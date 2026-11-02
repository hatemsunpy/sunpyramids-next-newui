import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BlogExplorer } from "@/components/BlogExplorer";
import type { ApiList, ApiPage, Locale } from "@/types/api";

// Redesign contract for /blogs/all-blogs:
// - every listing request (default, search, filter, reset, load-more) asks the
//   API for created_at desc, and title sorts map to the title field;
// - the grouped block shows only the newest five listing records, the grid
//   shows the remaining loaded results, and nothing is duplicated or omitted;
// - any search, category filter or explicit sort hides the grouped block and
//   shows all matching loaded results in the grid.

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/client-api", () => ({ apiGet }));

const replaceSpy = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/blogs/all-blogs",
  useRouter: () => ({ push: vi.fn(), replace: replaceSpy }),
}));

const TAGS: ApiPage[] = [
  { id: 21, title: "Egypt History", slug: "history", name: "Egypt History" },
  { id: 22, title: "Nile Cruises", slug: "nile-cruises", name: "Nile Cruises" },
];

function blog(id: number): ApiPage {
  return {
    id,
    title: `Article ${id}`,
    slug: `article-${id}`,
    image: `https://cdn.example.com/article-${id}.webp`,
    created_at: `2026-10-${((id * 3) % 28) + 1}T10:00:00.000000Z`,
    categories: [{ id: 3, title: "Culture", name: "Culture", slug: "culture" }],
  };
}

function ids(range: [number, number]): number[] {
  return Array.from({ length: range[1] - range[0] + 1 }, (_, offset) => range[0] + offset);
}

function pager(page: number, pageIds: number[], lastPage = 3): ApiList<ApiPage> {
  return { data: { data: pageIds.map(blog), current_page: page, last_page: lastPage } };
}

function listing(count: number, lastPage = 3) {
  return {
    initialListing: { blogs: Array.from({ length: count }, (_, index) => blog(index + 1)), currentPage: 1, lastPage },
    categories: TAGS,
    locale: "en" as Locale,
    initialTitle: "",
  };
}

function requestParams(endpoint: string) {
  return new URLSearchParams(endpoint.split("?")[1]);
}

function gridTitles(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".blogs-grid .blog-card h3"), (heading) => heading.textContent);
}

function blockTitles(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".blog-highlights-card h3"), (heading) => heading.textContent);
}

async function chooseSort(label: string) {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Sort by" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("menuitem", { name: label }));
}

// SearchSelectDropdown dispatches both the radix onSelect and a synced native
// change event (pre-existing shared behavior), so a sort may load twice.
// Find the request whose params match the contract instead of call counts.
async function requestWith(expected: Record<string, string | boolean>) {
  await waitFor(() => expect(apiGet).toHaveBeenCalled());
  const calls = apiGet.mock.calls
    .map((call) => requestParams(call[0] as string))
    .filter((params) => Object.entries(expected).every(([key, value]) => (
      // false asserts the parameter is absent from the request.
      value === false ? !params.has(key) : params.get(key) === value
    )));
  expect(calls.length).toBeGreaterThan(0);
  return calls[0];
}

beforeEach(() => {
  replaceSpy.mockClear();
  apiGet.mockReset();
  apiGet.mockImplementation((endpoint: string) => {
    const params = requestParams(endpoint);
    const page = Number(params.get("page") || "1");
    if (params.get("title")) return pager(page, ids([41, 45]));
    if (params.get("categories.slug")) return pager(page, ids([51, 54]));
    return pager(page, page === 1 ? ids([1, 10]) : ids([11, 20]));
  });
});

afterEach(() => {
  cleanup();
});

describe("BlogExplorer listing redesign", () => {
  it("serves the grouped newest block and the grid from the initial listing without extra requests", () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    expect(apiGet).not.toHaveBeenCalled();
    expect(container.querySelectorAll(".blog-highlights-lead")).toHaveLength(1);
    expect(container.querySelectorAll(".blog-highlights-card")).toHaveLength(5);
    expect(blockTitles(container)).toEqual(["Article 1", "Article 2", "Article 3", "Article 4", "Article 5"]);
    expect(gridTitles(container)).toEqual(["Article 6", "Article 7", "Article 8", "Article 9", "Article 10"]);
    expect(new Set([...blockTitles(container), ...gridTitles(container)]).size).toBe(10);
  });

  it("keeps the grouped block and pagination available for the resting view", () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    expect(container.querySelector(".blog-highlights")).not.toBeNull();
    expect(screen.getByRole("button", { name: /See more/ })).toBeInTheDocument();
  });

  it("searches with created_at desc and shows every matching loaded result in the grid", async () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    fireEvent.change(screen.getByPlaceholderText("What article are you looking for"), { target: { value: "easter" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    const params = requestParams(apiGet.mock.calls[0][0] as string);
    expect(params.get("order_by")).toBe("created_at,desc");
    expect(params.get("page")).toBe("1");
    expect(params.get("page_limit")).toBe("10");
    expect(params.get("title")).toBe("*easter*");

    await waitFor(() => expect(container.querySelectorAll(".blogs-grid .blog-card")).toHaveLength(5));
    expect(container.querySelector(".blog-highlights")).toBeNull();
    expect(gridTitles(container)).toEqual(["Article 41", "Article 42", "Article 43", "Article 44", "Article 45"]);
  });

  it("category filtering keeps the created_at desc request and reveals all matching results", async () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    fireEvent.click(screen.getByRole("button", { name: "Egypt History" }));

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    const params = requestParams(apiGet.mock.calls[0][0] as string);
    expect(params.get("order_by")).toBe("created_at,desc");
    expect(params.get("categories.slug")).toBe("history");
    expect(params.get("page")).toBe("1");

    await waitFor(() => expect(container.querySelectorAll(".blogs-grid .blog-card")).toHaveLength(4));
    expect(container.querySelector(".blog-highlights")).toBeNull();
    expect(gridTitles(container)).toEqual(["Article 51", "Article 52", "Article 53", "Article 54"]);
  });

  it("selecting Newest keeps the created_at desc request", async () => {
    render(<BlogExplorer {...listing(10)} />);

    await chooseSort("Newest");

    const params = await requestWith({ order_by: "created_at,desc", page: "1" });
    expect(params.get("page_limit")).toBe("10");
  });

  it("selecting Oldest requests created_at asc and shows all loaded results in the grid", async () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    await chooseSort("Oldest");

    const params = await requestWith({ order_by: "created_at,asc", page: "1" });
    expect(params.get("page")).toBe("1");

    await waitFor(() => expect(container.querySelectorAll(".blogs-grid .blog-card")).toHaveLength(10));
    expect(container.querySelector(".blog-highlights")).toBeNull();
    expect(new Set(Array.from(container.querySelectorAll("h3"), (heading) => heading.textContent)).size).toBe(10);
  });

  it("maps the A to Z option to the title field, not the legacy display_order", async () => {
    render(<BlogExplorer {...listing(10)} />);

    await chooseSort("A to Z");

    await requestWith({ order_by: "title,asc", page: "1" });
  });

  it("load more continues newest-first and appends without duplication", async () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    fireEvent.click(screen.getByRole("button", { name: /See more/ }));

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    const params = requestParams(apiGet.mock.calls[0][0] as string);
    expect(params.get("order_by")).toBe("created_at,desc");
    expect(params.get("page")).toBe("2");

    await waitFor(() => expect(container.querySelectorAll(".blogs-grid .blog-card")).toHaveLength(15));
    const allTitles = [...blockTitles(container), ...gridTitles(container)];
    expect(allTitles).toHaveLength(20);
    expect(new Set(allTitles).size).toBe(20);
  });

  it("keeps the explicit sort applied on load more", async () => {
    const { container } = render(<BlogExplorer {...listing(10)} />);

    await chooseSort("Oldest");

    await requestWith({ order_by: "created_at,asc", page: "1" });
    await waitFor(() => expect(container.querySelector(".blogs-results")?.getAttribute("aria-busy")).toBe("false"));
    fireEvent.click(screen.getByRole("button", { name: /See more/ }));

    await requestWith({ order_by: "created_at,asc", page: "2" });
  });

  it("hides the empty state and grid when the grouped block covers all loaded articles", () => {
    const { container } = render(<BlogExplorer {...listing(3, 1)} />);

    expect(container.querySelectorAll(".blog-highlights-card")).toHaveLength(3);
    expect(container.querySelectorAll(".blogs-grid .blog-card")).toHaveLength(0);
    expect(screen.queryByRole("region", { name: "No results" })).toBeNull();
    expect(screen.queryByRole("button", { name: /See more/ })).toBeNull();
  });

  it("shows the empty state for an empty listing and resets to the newest-first request", async () => {
    render(<BlogExplorer {...{ ...listing(0), initialListing: { blogs: [], currentPage: 1, lastPage: 1 } }} />);

    expect(screen.getByRole("region", { name: "No results" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset search & filters" }));

    await requestWith({ order_by: "created_at,desc", page: "1", title: false, "categories.slug": false });
  });

  it("keeps the grouped block hidden at mount for URL-provided search titles", () => {
    const props = {
      initialListing: { blogs: ids([41, 45]).map(blog), currentPage: 1, lastPage: 1 },
      categories: TAGS,
      locale: "en" as Locale,
      initialTitle: "easter",
    };
    const { container } = render(<BlogExplorer {...props} />);

    expect(apiGet).not.toHaveBeenCalled();
    expect(container.querySelector(".blog-highlights")).toBeNull();
    expect(gridTitles(container)).toHaveLength(5);
  });
});