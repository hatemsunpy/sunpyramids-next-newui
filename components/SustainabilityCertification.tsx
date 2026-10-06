import Image from "next/image";
import { sustainabilityCertificationHtml } from "@/lib/sustainability-copy";
import { sanitizeHtml } from "@/lib/sanitize-html";

export function SustainabilityCertification() {
  return (
    <section className="sustainability-certification-section">
      <div className="editorial-container sustainability-certification-grid">
        <div>
          <h2><span>Travelife</span> Certified Certification</h2>
          <div className="editorial-prose sustainability-certification-copy" dangerouslySetInnerHTML={{ __html: sanitizeHtml(sustainabilityCertificationHtml) }} />
        </div>
        <Image className="sustainability-certificate" src="/images/certified.webp" alt="Sun Pyramids Tours Travelife sustainability certificate" width={1061} height={763} sizes="(max-width: 920px) 100vw, 620px" />
      </div>
    </section>
  );
}
