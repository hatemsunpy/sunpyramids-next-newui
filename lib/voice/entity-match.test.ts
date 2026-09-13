import { describe, expect, it } from "vitest";
import { levenshteinCapped, resolveDestination } from "./entity-match";
import { lexiconFor } from "./lexicons";
import type { ApiPage } from "@/types/api";
import type { VoiceEntityMention } from "./types";

// Live-shaped fixture (slugs/titles mirror the verified production contract;
// small enough to stay deterministic and offline).
const destinations: ApiPage[] = [
  { id: 11, title: "Cairo Tours", slug: "cairo" },
  { id: 12, title: "Luxor Tours", slug: "luxor" },
  { id: 13, title: "Aswan Tours", slug: "aswan" },
  { id: 14, title: "Hurghada Tours", slug: "hurghada" },
  { id: 15, title: "Sharm El Sheikh Tours", slug: "sharm-el-sheikh" },
];

function mention(normalized: string, raw?: string): VoiceEntityMention {
  return { raw: raw ?? normalized, normalized, confidence: "unresolved" };
}

describe("resolveDestination — resolution order", () => {
  it("1. exact slug wins", () => {
    const r = resolveDestination(mention("aswan", "Aswan"), destinations, lexiconFor("en"));
    expect(r).toMatchObject({ status: "exact", slug: "aswan" });
  });

  it("2. exact live title matches", () => {
    const r = resolveDestination(mention("aswan tours", "Aswan Tours"), destinations, lexiconFor("en"));
    expect(r.status).toBe("exact");
    if (r.status === "exact") expect(r.slug).toBe("aswan");
  });

  it("3. approved alias resolves via canonical spelling (fr Louxor, de Assuan)", () => {
    const fr = resolveDestination(mention("louxor", "Louxor"), destinations, lexiconFor("fr"));
    expect(fr).toMatchObject({ status: "alias", slug: "luxor" });

    const de = resolveDestination(mention("assuan", "Assuan"), destinations, lexiconFor("de"));
    expect(de).toMatchObject({ status: "alias", slug: "aswan" });
  });

  it("3b. alias whose canonical matches nothing is rejected (no silent mapping)", () => {
    const r = resolveDestination(
      mention("louxor", "Louxor"),
      [{ id: 11, title: "Cairo Tours", slug: "cairo" }],
      lexiconFor("fr"),
    );
    expect(r.status).toBe("unresolved");
  });

  it("4. normalized token containment (mention inside live title)", () => {
    const r = resolveDestination(
      mention("luxor", "Luxor"),
      [{ id: 99, title: "Luxor Highlights", slug: "luxor-highlights" }],
      lexiconFor("en"),
    );
    expect(r.status).toBe("normalized");
    if (r.status === "normalized") expect(r.slug).toBe("luxor-highlights");
  });

  it("attraction names never silently become cities (Karnak, Giza, Abu Simbel)", () => {
    for (const name of ["karnak", "giza", "abu simbel", "valley of the kings", "pyramids"]) {
      const r = resolveDestination(mention(name), destinations, lexiconFor("en"));
      expect(r.status, name).toBe("unresolved");
    }
  });

  it("unrelated places stay unresolved (Paris)", () => {
    expect(resolveDestination(mention("paris"), destinations, lexiconFor("en")).status).toBe("unresolved");
  });

  it("empty destination list → unresolved (never fabricated)", () => {
    expect(resolveDestination(mention("aswan"), [], lexiconFor("en")).status).toBe("unresolved");
  });
});

describe("resolveDestination — fuzzy is suggestion-only", () => {
  it("single close misspelling → fuzzy with the candidate", () => {
    const r = resolveDestination(mention("aswn"), destinations, lexiconFor("en"));
    expect(r.status).toBe("fuzzy");
    if (r.status === "fuzzy") {
      expect(r.slug).toBe("aswan");
      expect(r.candidates).toEqual([{ slug: "aswan", title: "Aswan Tours" }]);
    }
  });

  it("short mentions (<4 chars) never fuzzy-match", () => {
    expect(resolveDestination(mention("lux"), destinations, lexiconFor("en")).status).toBe("unresolved");
  });

  it("ambiguous containment (matches every 'X Tours' title) → ambiguous", () => {
    const r = resolveDestination(mention("tours"), destinations, lexiconFor("en"));
    expect(r.status).toBe("ambiguous");
    if (r.status === "ambiguous") {
      expect(r.candidates.length).toBeGreaterThan(1);
    }
  });
});

describe("levenshteinCapped", () => {
  it("exact, near, and far distances with early exit", () => {
    expect(levenshteinCapped("aswan", "aswan", 2)).toBe(0);
    expect(levenshteinCapped("aswn", "aswan", 2)).toBe(1);
    expect(levenshteinCapped("cairo", "aswan", 2)).toBeGreaterThan(2);
    expect(levenshteinCapped("a", "abcdefghij", 2)).toBeGreaterThan(2);
  });
});