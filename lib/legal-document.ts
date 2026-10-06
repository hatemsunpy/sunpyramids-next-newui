import { sanitizeHtml } from "@/lib/sanitize-html";

export type LegalHeading = { id: string; labelHtml: string; level: 2 | 3 };

// The editor stores privacy headings as bold paragraphs and terms headings as h4.
// Derive navigation on every render; the API continues to own all policy text.
export function prepareLegalDocument(content: unknown) {
  const headings: LegalHeading[] = [];
  const html = sanitizeHtml(content)
    .replace(/<(h[2-6]|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag: string, attrs: string, body: string) => {
      const trimmedBody = body.replace(/(?:\s*<br\s*\/?\s*>\s*)+$/gi, "");
      const labelHtml = trimmedBody.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim();
      if (!labelHtml) return "";

      const boldOnly = /^(?:\s|<br\s*\/?\s*>|<span\b[^>]*>)*<strong\b[^>]*>[\s\S]*<\/strong>(?:\s|<br\s*\/?\s*>|<\/span>)*$/i.test(trimmedBody);
      const isContactNumber = /:\s*[+\d][\d\s()-]+$/.test(labelHtml);
      const isHeading = /^h/i.test(tag) || (boldOnly && labelHtml.length < 160 && !/^[-–—]/.test(labelHtml) && !isContactNumber);
      if (!isHeading) return `<${tag}${attrs}>${trimmedBody}</${tag}>`;

      // Underlining in the source distinguishes primary privacy sections.
      const sourceUnderlined = /text-decoration\s*:\s*underline/i.test(match);
      const level = /^h/i.test(tag) || sourceUnderlined ? 2 : 3;
      const id = `legal-heading-${headings.length + 1}`;
      headings.push({ id, labelHtml, level });
      const headingAttrs = attrs.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
      return `<h${level}${headingAttrs} id="${id}">${trimmedBody.replace(/<br\s*\/?\s*>/gi, "")}</h${level}>`;
    })
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
  return { html, headings };
}
