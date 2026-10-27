import { sanitizeHtml } from "@/lib/sanitize-html";

const entities: Record<string, string> = {
  amp: "&", apos: "'", quot: '"', nbsp: " ", lt: "<", gt: ">",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
};

/** Card previews are text: CMS links must never nest inside the card link. */
export function journeyExcerpt(html: string) {
  return sanitizeHtml(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
      if (!key.startsWith("#")) return entities[key.toLowerCase()] ?? entity;
      const hex = key[1].toLowerCase() === "x";
      const codePoint = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      try { return String.fromCodePoint(codePoint); } catch { return entity; }
    })
    .replace(/\s+/g, " ")
    .trim();
}
