import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import Page from "@/app/page";
import LocalizedPage from "@/app/[locale]/page";
import { HomePage } from "@/components/HomePage";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const requests: { url: URL; options: RequestInit & { next?: { revalidate?: number } } }[] = [];
beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (input: string, options: RequestInit) => {
    const url = new URL(input); requests.push({ url, options });
    const endpoint = url.pathname.replace(/^.*\/api\//, "");
    let payload: unknown = { data: [] };
    if (endpoint === "categories" && !url.searchParams.has("parent_id")) payload = { data: [
      { id: 501, slug: "nile-cruises", title: "Localized root", name: "Root", parent_id: null, description: "Do not send", seo: { meta_title: "Do not send" } },
      { id: 502, slug: "child-cruise", parent_id: 501 },
    ] };
    if (endpoint === "categories/count") payload = { data: { "nile-cruises": 4 } };
    if (endpoint === "destinations/home") payload = { data: [{ slug: "cairo", title: "Live destination" }] };
    return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("homepage Smart Voice server taxonomy plumbing", () => {
  it.each(["en", "fr"])("%s passes only live root labels and slugs and preserves fetch options", async (locale) => {
    const shell = (locale === "en" ? await Page() : await LocalizedPage({ params: Promise.resolve({ locale }) })) as ReactElement<{ children: ReactElement[] }>;
    const homepage = shell.props.children.find((child) => child.type === HomePage) as ReactElement<{ rootCategories: unknown; highlights: unknown }>;
    expect(homepage.props.rootCategories).toEqual([{ slug: "nile-cruises", title: "Localized root", name: "Root" }]);
    expect(homepage.props.highlights).toEqual([{ slug: "cairo", title: "Live destination" }]);
    // Twelve existing homepage calls plus the three existing taxonomy calls.
    expect(requests).toHaveLength(15);
    const destinations = requests.filter(({ url }) => /\/destinations(?:\/home)?$/.test(url.pathname));
    expect(destinations).toHaveLength(2);
    expect(new Set(destinations.map(({ url }) => url.href)).size).toBe(2);
    for (const { options } of requests) {
      expect(options.cache).toBe("force-cache"); expect(options.next?.revalidate).toBe(300);
      expect(options.headers).toMatchObject({ "X-Localize": locale });
    }
  });
});
