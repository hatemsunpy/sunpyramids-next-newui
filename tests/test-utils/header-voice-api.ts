import { POST } from "@/app/api/voice/resolve/route";

export function createHeaderVoiceApiFixture() {
  const upstreamRequests: { url: string; options?: RequestInit & { next?: { revalidate?: number } } }[] = [];
  const applicationRequests: RequestInit[] = [];
  const destinations = [{ slug: "cairo", title: "Cairo" }, { slug: "luxor", title: "Luxor" }, { slug: "aswan", title: "Aswan" }];
  const categories = [{ id: 901, slug: "nile-cruises", title: "Live cruise label", parent_id: null }, { id: 902, slug: "multi-days-tours", title: "Live multi-day label", parent_id: null }];
  let unavailable = false;
  return {
    applicationRequests,
    upstreamRequests,
    setUnavailable: () => { unavailable = true; },
    fetch: async (input: string | URL | Request, options?: RequestInit) => {
      const url = String(input);
      if (url === "/api/voice/resolve") {
        applicationRequests.push(options ?? {});
        if (unavailable) return Response.json({ error: "resolution-unavailable" }, { status: 503 });
        return POST(new Request("https://fixture.test/api/voice/resolve", options));
      }
      upstreamRequests.push({ url, options });
      const parsed = new URL(url);
      if (/\/categories\/count$/.test(parsed.pathname)) return Response.json({ data: { "nile-cruises": 8, "multi-days-tours": 4 } });
      if (/\/categories$/.test(parsed.pathname)) return Response.json({ data: categories });
      if (/\/destinations$/.test(parsed.pathname)) return Response.json({ data: destinations });
      throw new Error("Unexpected network request in offline Voice test");
    },
  };
}
