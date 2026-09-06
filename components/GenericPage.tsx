import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale, PublicSiteSettings, TeamMember, Tour } from "@/types/api";
import { ContactForm } from "@/components/ContactForm";
import { DestinationCard } from "@/components/DestinationCard";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { EmptyState } from "@/components/EmptyState";
import { TourCard } from "@/components/TourCard";
import { BlogCard } from "@/components/BlogCard";
import { PlannerRequestFlow } from "@/components/CustomerFlows";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { uiCopy } from "@/lib/ui-copy";
import { siteContact } from "@/lib/site-contact";

type GenericPageProps = {
  page: ApiPage | null;
  fallbackTitle: string;
  route: string;
  locale?: Locale;
  faqs?: ApiPage[];
  categories?: ApiPage[];
  tours?: Tour[];
  blogs?: ApiPage[];
  team?: TeamMember[];
  settings?: PublicSiteSettings;
};

const fallbackBanners: Record<string, string> = {
  faqs: "/images/faqs-banner.png",
  "contact-us": "/images/contactForm.png",
  "about-us": "/images/aboutusmainbanner.png",
  sustainability: "/images/certification.png",
  "accessible-travel": "/images/wheelChair.png",
  "make-your-trip": "/images/makeYourTripImage.png",
  "rent-car": "/images/Cairo_Egypt_Unsplash.png",
};

function meta(page: ApiPage | null, key: string) {
  return page?.metas?.find((item) => item.meta_key === key);
}

function metaHtml(page: ApiPage | null, key: string) {
  const item = meta(page, key);
  return String(item?.meta_value || item?.value || item?.description || "");
}

function heroImage(page: ApiPage | null, route: string) {
  return page?.banner || page?.featured_image || page?.image || fallbackBanners[route] || "/images/aboutusmainbanner.png";
}

export function GenericPage({
  page,
  fallbackTitle,
  route,
  locale = "en",
  faqs = [],
  categories = [],
  tours = [],
  blogs = [],
  team = [],
  settings,
}: GenericPageProps) {
  const title = page?.title || page?.name || fallbackTitle;
  const image = heroImage(page, route);

  if (route === "about-us") {
    return <AboutPage page={page} title={title} image={image} locale={locale} faqs={faqs} team={team} />;
  }

  if (route === "contact-us") {
    return <ContactPage page={page} title={title} image={image} locale={locale} settings={settings} />;
  }

  if (route === "faqs") {
    return <FaqPage title={title} image={image} faqs={faqs} locale={locale} />;
  }

  if (route === "events") {
    return <EventsPage page={page} title={title} image={image} categories={categories} locale={locale} />;
  }

  if (route === "make-your-trip" || route === "rent-car") {
    return <PlannerPage page={page} title={title} image={image} route={route} locale={locale} />;
  }

  if (route === "accessible-travel" || route === "sustainability") {
    return <ImpactPage page={page} title={title} image={image} route={route} locale={locale} tours={tours} blogs={blogs} faqs={faqs} />;
  }

  return <ContentPage page={page} title={title} image={image} locale={locale} />;
}

function EditorialHeroCompact({
  title,
  eyebrow,
  locale = "en",
}: {
  title: string;
  eyebrow?: string;
  locale?: Locale;
}) {
  return (
    <header className="editorial-hero editorial-hero--compact">
      <div className="editorial-hero-inner">
        <nav className="editorial-breadcrumb" aria-label="Breadcrumb">
          <Link href={withLocale("/", locale)}>Home</Link>
          <span className="separator" aria-hidden="true">›</span>
          <span className="current" aria-current="page">{title}</span>
        </nav>
        {eyebrow && <span className="editorial-eyebrow">{eyebrow}</span>}
        <h1 className="editorial-title">{title}</h1>
      </div>
    </header>
  );
}

function ContentPage({
  page,
  title,
  locale = "en",
}: {
  page: ApiPage | null;
  title: string;
  image: string;
  locale?: Locale;
}) {
  return (
    <main>
      <EditorialHeroCompact title={title} eyebrow="Policy & Terms" locale={locale} />
      <section className="editorial-legal-shell">
        <div className="editorial-container">
          <div className="editorial-legal-doc">
            <div className="legal-header">
              <h1>{title}</h1>
              <p>Official legal terms and privacy policies for Sun Pyramids Tours guests.</p>
            </div>
            <article
              className="editorial-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page?.content || page?.description) }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactPage({
  page,
  title,
  locale,
  settings,
}: {
  page: ApiPage | null;
  title: string;
  image: string;
  locale: Locale;
  settings?: PublicSiteSettings;
}) {
  const dynamicEmails = settings?.notificationEmails?.length ? settings.notificationEmails : siteContact.safeFallbackEmails;
  const emails = [...new Set([...dynamicEmails, ...siteContact.staticEmails])];
  const copy = uiCopy(locale);

  return (
    <main>
      <EditorialHeroCompact title={title} eyebrow={copy.contactInfo || "Direct Contact"} locale={locale} />
      <section className="editorial-main-section">
        <div className="editorial-container">
          <div className="editorial-contact-layout">
            <div className="contact-info-card">
              <span className="card-eyebrow">{copy.contactInfo || "Get in Touch"}</span>
              <h2>We&apos;re Here to Help</h2>
              <div
                className="contact-intro"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    page?.content ||
                      page?.description ||
                      "Have questions about booking, private guides, or custom itineraries? Reach our 24/7 Cairo operations team.",
                  ),
                }}
              />

              <div className="contact-items-list">
                <div className="contact-item">
                  <div className="icon-pill" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="item-detail">
                    <strong>Phone Support</strong>
                    {siteContact.phones.map((phone) => (
                      <p key={phone.href}>
                        <a href={phone.href}>{phone.display}</a>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="contact-item">
                  <div className="icon-pill" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div className="item-detail">
                    <strong>WhatsApp Hotline</strong>
                    <p>
                      <a href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer">
                        {siteContact.whatsapp.display}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="icon-pill" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="item-detail">
                    <strong>Email Inquiries</strong>
                    {emails.map((email) => (
                      <p key={email}>
                        <a href={`mailto:${email}`}>{email}</a>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="contact-item">
                  <div className="icon-pill" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="item-detail">
                    <strong>Head Office</strong>
                    {settings?.locationUrl ? (
                      <p>
                        <a href={settings.locationUrl} target="_blank" rel="noreferrer">
                          {siteContact.address}
                        </a>
                      </p>
                    ) : (
                      <p>{siteContact.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <h2>Send a Message</h2>
              <p className="form-subtitle">Fill out the form below and an Egypt specialist will reply promptly.</p>
              <ContactForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AboutPage({
  page,
  title,
  locale,
  faqs,
  team,
}: {
  page: ApiPage | null;
  title: string;
  image: string;
  locale: Locale;
  faqs: ApiPage[];
  team: TeamMember[];
}) {
  const copy = uiCopy(locale);
  const gallery = page?.gallery || [];
  const goals = [
    ["Our Mission", metaHtml(page, "mission")],
    ["Our Vision", metaHtml(page, "vision")],
  ].filter((item) => item[1]);

  return (
    <main>
      <EditorialHeroCompact title={title} eyebrow="Heritage Since 1970" locale={locale} />

      <section className="editorial-main-section">
        <div className="editorial-container">
          <div className="editorial-story-section">
            <div className="story-content">
              <span className="story-eyebrow">Pioneering Egypt Exploration</span>
              <h2>Sun Pyramids Tours</h2>
              <div
                className="story-body editorial-prose"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(metaHtml(page, "about-sun-pyramids") || page?.content),
                }}
              />
            </div>
            <div className="story-media">
              <Image
                src={String(page?.feature_1 || gallery[0] || "/images/aboutusmainbanner.png")}
                alt={title}
                fill
                sizes="(max-width: 920px) 100vw, 50vw"
              />
            </div>
          </div>

          {goals.length > 0 && (
            <div className="editorial-goals-grid">
              {goals.map(([goalTitle, html]) => (
                <article className="goal-card" key={goalTitle}>
                  <h3>{goalTitle}</h3>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
                </article>
              ))}
            </div>
          )}

          {team.length > 0 && (
            <section className="editorial-team-section">
              <div className="team-header">
                <h2>{copy.team || "Meet Our Dedicated Team"}</h2>
                <p>The Egyptologists, trip designers, and hospitality leaders behind your journey.</p>
              </div>
              <div className="editorial-team-grid">
                {team.map((member) => (
                  <article className="team-card" key={`${member.name}-${member.position}`}>
                    <div className="team-photo-wrap">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <h3>{member.name}</h3>
                    <p>{member.position}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <FaqTeaser faqs={faqs} locale={locale} />
        </div>
      </section>
    </main>
  );
}

function FaqPage({
  title,
  faqs,
  locale,
}: {
  title: string;
  image: string;
  faqs: ApiPage[];
  locale: Locale;
}) {
  return (
    <main>
      <EditorialHeroCompact title={title} eyebrow="Help Center & Advice" locale={locale} />
      <section className="editorial-main-section">
        <div className="editorial-container">
          <div className="editorial-faq-container">
            <div className="editorial-faq-list">
              {faqs.map((faq) => (
                <details className="editorial-faq-item" key={faq.id}>
                  <summary>
                    <span>{String(faq.question || faq.title || "Question")}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </summary>
                  <div
                    className="faq-answer"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer || faq.description) }}
                  />
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
      <EditorialNeedHelp locale={locale} />
    </main>
  );
}

function EventsPage({ page, title, image, categories, locale }: { page: ApiPage | null; title: string; image: string; categories: ApiPage[]; locale: Locale }) {
  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: title },
  ];

  return (
    <main>
      <DiscoveryHero
        title={title}
        breadcrumbs={breadcrumbs}
        eyebrow="Egypt Annual Celebrations"
        description={
          page?.short_description ||
          page?.description ||
          "Experience Egypt's rich cultural calendar, sound and light spectacles, and seasonal festivities."
        }
        totalCount={categories.length > 0 ? categories.length : undefined}
        bgImage={image}
      />

      <section className="discovery-section">
        <div className="container-shell">
          {categories.length > 0 ? (
            <div className="destination-mosaic-grid">
              {categories.map((category) => (
                <DestinationCard
                  key={category.id || category.slug}
                  destination={category}
                  basePath="/event"
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No events currently scheduled"
              description="Check back soon for upcoming Egypt events, concerts, and cultural spectacles."
              actionLabel="Explore all Egypt tours"
              actionHref={withLocale("/trips", locale)}
            />
          )}
        </div>
      </section>

      <GalleryStrip gallery={page?.gallery || []} />
    </main>
  );
}

function PlannerPage({
  page,
  title,
  route,
  locale,
}: {
  page: ApiPage | null;
  title: string;
  image: string;
  route: "make-your-trip" | "rent-car";
  locale: Locale;
}) {
  const isCar = route === "rent-car";
  const eyebrow = isCar
    ? "Private Transfers & Chauffeur Services"
    : "Bespoke Private Egypt Itineraries";
  const leadDescription =
    page?.short_description ||
    page?.description ||
    (isCar
      ? "Reliable, air-conditioned vehicle transfers across Cairo, Luxor, Aswan, Hurghada, and Alexandria with licensed English-speaking drivers."
      : "Tell our certified Egyptologists and trip designers what you want to experience. We craft your personalized journey with zero hassle.");

  return (
    <main className="planner-page">
      <header className="planner-hero">
        <div className="planner-hero-inner">
          <nav className="planner-breadcrumb" aria-label="Breadcrumb">
            <Link href={withLocale("/", locale)}>Home</Link>
            <span className="separator" aria-hidden="true">›</span>
            <span className="current" aria-current="page">{title}</span>
          </nav>

          <span className="planner-eyebrow">{eyebrow}</span>
          <h1 className="planner-title">{title}</h1>
          <p className="planner-lead">{leadDescription}</p>

          <div className="planner-trust-pills">
            <div className="trust-pill-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>100% Tailor-Made &bull; Private</span>
            </div>
            <div className="trust-pill-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>24/7 Cairo Operations Support</span>
            </div>
            <div className="trust-pill-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Licensed Egyptologist Specialists</span>
            </div>
            <div className="trust-pill-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Direct Operator Pricing</span>
            </div>
          </div>
        </div>
      </header>

      <section className="planner-main-section">
        <div className="planner-container">
          <div className="planner-layout-grid">
            <div className="planner-main-column">
              {page?.content && (
                <div
                  className="editorial-prose"
                  style={{ marginBottom: "2rem" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                />
              )}
              <PlannerRequestFlow route={route} locale={locale} />
            </div>

            <aside className="planner-sidebar">
              <div className="concierge-card">
                <span className="concierge-badge">Concierge Desk</span>
                <h3>Need Instant Advice?</h3>
                <p>
                  Our Cairo operations specialists are available around the clock to answer transfer questions, customize multi-city routes, or discuss special family requirements.
                </p>

                <div className="concierge-contact-actions">
                  <a
                    className="btn-concierge-wa"
                    href={siteContact.whatsapp.contactUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.63a11.9 11.9 0 0 0 5.86 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-.1.25-1.25-3.52-4.44zM12.07 21.88h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.65-.24-.38a9.88 9.88 0 0 1-1.52-5.27c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9 1.87 1.88 2.9 4.37 2.9 7.02 0 5.46-4.45 9.9-9.92 9.9zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z" />
                    </svg>
                    <span>Chat on WhatsApp</span>
                  </a>

                  {siteContact.phones[0] && (
                    <a className="btn-concierge-phone" href={siteContact.phones[0].href}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Call {siteContact.phones[0].display}</span>
                    </a>
                  )}
                </div>

                <ul className="concierge-perks">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>100% Free Consultation & Custom Itinerary Design</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Guaranteed Private Air-Conditioned Vehicles</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>English-Speaking Drivers & Certified Egyptologists</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Heritage Since 1970 — Trusted Local Operator</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function ImpactPage({
  page,
  title,
  route,
  locale,
  tours,
  blogs,
  faqs,
}: {
  page: ApiPage | null;
  title: string;
  image: string;
  route: string;
  locale: Locale;
  tours: Tour[];
  blogs: ApiPage[];
  faqs: ApiPage[];
}) {
  const isSustainability = route === "sustainability";
  const eyebrow = isSustainability ? "Responsible Travel & Eco Commitment" : "Inclusive Travel Worldwide";
  const illustration = isSustainability ? "/images/certification.png" : "/images/wheelChair.png";

  return (
    <main>
      <EditorialHeroCompact title={title} eyebrow={eyebrow} locale={locale} />
      <section className="editorial-main-section">
        <div className="editorial-container">
          <div className="editorial-story-section">
            <div className="story-content">
              <span className="story-eyebrow">{isSustainability ? "Sustainable Journeys" : "Accessible Egypt"}</span>
              <h2>{title}</h2>
              <div
                className="story-body editorial-prose"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page?.content || page?.description) }}
              />
            </div>
            <div className="story-media">
              <Image
                src={illustration}
                alt={title}
                fill
                sizes="(max-width: 920px) 100vw, 50vw"
              />
            </div>
          </div>

          {tours.length > 0 && (
            <section className="editorial-related-section">
              <div className="section-header">
                <h2>Recommended Experiences</h2>
                <Link className="see-more" href={withLocale("/trips", locale)}>
                  View all &rarr;
                </Link>
              </div>
              <div className="discovery-grid">
                {tours.slice(0, 3).map((tour) => (
                  <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {blogs.length > 0 && (
            <section className="editorial-related-section">
              <div className="section-header">
                <h2>Related Articles & Travel Tips</h2>
                <Link className="see-more" href={withLocale("/blogs/all-blogs", locale)}>
                  All articles &rarr;
                </Link>
              </div>
              <div className="discovery-grid">
                {blogs.slice(0, 3).map((blog) => (
                  <BlogCard key={blog.id || blog.slug} blog={blog} locale={locale} />
                ))}
              </div>
            </section>
          )}

          <FaqTeaser faqs={faqs} locale={locale} />
        </div>
      </section>
    </main>
  );
}

function GalleryStrip({ gallery }: { gallery: string[] }) {
  if (!gallery.length) return null;
  return (
    <section className="gallery-strip">
      {gallery.slice(0, 6).map((item) => (
        <Image key={item} src={item} alt="Sun Pyramids gallery" width={360} height={260} />
      ))}
    </section>
  );
}

function FaqTeaser({ faqs, locale = "en" }: { faqs: ApiPage[]; locale?: Locale }) {
  if (!faqs.length) return null;
  return (
    <section className="editorial-related-section">
      <div className="section-header">
        <h2>Frequently Asked Questions</h2>
        <Link className="see-more" href={withLocale("/faqs", locale)}>
          See all FAQs &rarr;
        </Link>
      </div>
      <div className="editorial-faq-container">
        <div className="editorial-faq-list">
          {faqs.slice(0, 5).map((faq) => (
            <details key={faq.id} className="editorial-faq-item">
              <summary>
                <span>{String(faq.question || faq.title || "Question")}</span>
                <span className="faq-icon" aria-hidden="true" />
              </summary>
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer || faq.description) }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialNeedHelp({ locale = "en" }: { locale?: Locale }) {
  return (
    <section className="editorial-related-section" style={{ background: "var(--spt-surface)" }}>
      <div className="editorial-container" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
        <span className="editorial-eyebrow">Need Guidance?</span>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0 1rem", color: "var(--spt-ink)" }}>
          We would be happy to help you plan your trip
        </h2>
        <p style={{ color: "var(--spt-muted)", lineHeight: 1.6, marginBottom: "1.75rem" }}>
          Contact our local team directly for customized itineraries, private requests, or any questions.
        </p>
        <Link
          className="btn-primary"
          href={withLocale("/contact-us", locale)}
          style={{
            display: "inline-flex",
            padding: "0.85rem 2rem",
            background: "var(--spt-amber)",
            color: "#fff",
            borderRadius: 999,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}

function NeedHelp({ locale = "en" }: { locale?: Locale }) {
  return (
    <section className="need-help-band">
      <div className="container-shell">
        <div>
          <p className="eyebrow">Need Our Help?</p>
          <h2>We would be happy to help you plan your trip</h2>
        </div>
        <Link className="btn-primary" href={withLocale("/contact-us", locale)}>Contact Us</Link>
      </div>
    </section>
  );
}
