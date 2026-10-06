import { describe, expect, it } from "vitest";
import { prepareLegalDocument } from "@/lib/legal-document";

function rendered(html: string) {
  return new DOMParser().parseFromString(html, "text/html").body;
}

describe("legal document navigation", () => {
  it.each([
    ['<h4><span style="text-decoration: underline; font-size: 14pt">Booking &amp; payment</span></h4><p>All payment rules remain here.</p>', "Booking & payment"],
    ['<p><span style="text-decoration: underline"><strong>Privacy policy</strong></span></p><p>All privacy rules remain here.</p>', "Privacy policy"],
  ])("derives a section from editor markup while preserving its text and links", (source, heading) => {
    const html = `${source}<p>Contact <a href="mailto:help@example.com">our team</a>.</p>`;
    const result = prepareLegalDocument(html);
    const body = rendered(result.html);
    expect(body.textContent).toBe(rendered(html).textContent);
    expect(body.querySelector("h2")?.textContent).toBe(heading);
    expect(result.headings).toHaveLength(1);
    expect(body.querySelector(`#${result.headings[0].id}`)?.textContent).toBe(heading);
    expect(body.querySelector("a")?.getAttribute("href")).toBe("mailto:help@example.com");
    expect(body.querySelector("[style]")).toBeNull();
  });

  it("keeps emphasized rules in the list and creates unique targets for repeated headings", () => {
    const result = prepareLegalDocument('<h4>Policy</h4><ul><li><p><strong>- Keep this emphasized rule.</strong></p></li></ul><p><strong>Phone: +123456789</strong></p><h4>Policy</h4><h4><strong>&nbsp;</strong></h4>');
    const body = rendered(result.html);
    expect(result.headings).toHaveLength(2);
    expect(new Set(result.headings.map(({ id }) => id)).size).toBe(2);
    expect(body.querySelector("li p strong")?.textContent).toBe("- Keep this emphasized rule.");
    expect(body.querySelectorAll("h2")).toHaveLength(2);
  });
});
