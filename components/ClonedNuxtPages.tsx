import Image from "next/image";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import type { ApiPage, Locale, Tour, TripTaxonomy } from "@/types/api";
import { BlogCard } from "@/components/BlogCard";
import { ContactForm } from "@/components/ContactForm";
import { AccountFlow, AuthFlow, CartFlow } from "@/components/CustomerFlows";
import { DestinationCard } from "@/components/DestinationCard";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { EmptyState } from "@/components/EmptyState";
import { PaymentCallbackKind, PaymentCallbackStatus } from "@/components/PaymentCallbackStatus";
import { TourCard } from "@/components/TourCard";
import { TrustIndexLoader } from "@/components/TrustIndexLoader";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { siteContact } from "@/lib/site-contact";
import { uiCopy } from "@/lib/ui-copy";

const bookTripGallery = [
  ["/images/shorts.png", "/images/shorts-gallary.png", "YouTube Shorts"],
  ["/images/youtubeone.png", "/images/youtube-gallary.png", "YouTube"],
  ["/images/tiktok.png", "/images/tiktok-gallary.png", "TikTok"],
  ["/images/instagram.png", "/images/insta-gallary.png", "Instagram"],
  ["/images/youtubetwo.png", "/images/fb-logo.webp", "Facebook"],
] as const;

export function AuthPage({ mode, locale = "en" }: { mode: string; locale?: Locale }) {
  const copy = uiCopy(locale);
  return (
    <main className="auth-clone">
      <section className="auth-panel">
        <div className="auth-top">
          <Link href={withLocale("/", locale)}><Image src="/images/Artboard 5.png" alt="Sun Pyramids" width={86} height={86} /></Link>
        </div>
        <Suspense fallback={<div className="auth-form-wrap"><p className="eyebrow">Sun Pyramids Tours</p><h1>{copy.myProfile}</h1></div>}>
          <AuthFlow mode={mode} locale={locale} />
        </Suspense>
      </section>
      <section className="auth-image"><Image src="/images/authHero.png" alt="Egypt travel" fill sizes="50vw" /></section>
    </main>
  );
}

export function AccountPage({ view = "profile", locale = "en" }: { view?: string; locale?: Locale }) {
  const copy = uiCopy(locale);
  const heading = view === "bookings" ? copy.myBookings : view === "favourites" ? copy.myFavorites : copy.myProfile;
  return (
    <main className="account-page">
      <section className="original-page-hero" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.55)), url(/images/authHero.png)" }}>
        <h1>{heading}</h1>
      </section>
      <section className="account-layout container-shell">
        <aside>
          {[
            [copy.myProfile, "/profile"],
            [copy.myBookings, "/profile/bookings"],
            [copy.myFavorites, "/profile/favourites"],
            [copy.myProfile, "/profile/settings"],
          ].map(([label, href]) => <Link key={href} href={withLocale(href, locale)}>{label}</Link>)}
        </aside>
        <AccountFlow view={view} locale={locale} />
      </section>
    </main>
  );
}

export function CartClonePage({ checkout = false, locale = "en" }: { checkout?: boolean; locale?: Locale }) {
  const copy = uiCopy(locale);
  return (
    <main>
      <section className="original-page-hero" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.55)), url(/images/Cairo_Egypt_Unsplash.png)" }}>
        <h1>{checkout ? copy.checkout : copy.cart}</h1>
      </section>
      <section className="cart-layout container-shell">
        <CartFlow checkout={checkout} locale={locale} />
        <aside className="cart-summary">
          <h3>{copy.summary}</h3>
          <p>{copy.subtotal}</p>
          <strong>$0.00</strong>
          {!checkout ? <Link className="btn-primary" href={withLocale("/cart/checkout", locale)}>{copy.checkout}</Link> : null}
        </aside>
      </section>
    </main>
  );
}

export function PaymentStatusPage({ provider, status, callback, locale = "en" }: { provider: string; status: string; callback: PaymentCallbackKind; locale?: Locale }) {
  return (
    <Suspense fallback={<PaymentCallbackShell provider={provider} title="Updating Payment" />}>
      <PaymentCallbackStatus provider={provider} status={status} callback={callback} locale={locale} />
    </Suspense>
  );
}

function PaymentCallbackShell({ provider, title }: { provider: string; title: string }) {
  return (
    <main className="payment-status">
      <section className="status-card">
        <p className="eyebrow">{provider}</p>
        <div className="payment-mark is-loading" aria-hidden="true" />
        <h1>{title}</h1>
        <p className="muted">Please wait while we confirm your payment with Sun Pyramids Tours.</p>
      </section>
    </main>
  );
}

export function TripsListingPage({
  page,
  tours,
  taxonomy,
  locale = "en",
  active = {},
}: {
  page: ApiPage | null;
  tours: Tour[];
  taxonomy: TripTaxonomy;
  locale?: Locale;
  active?: { main?: string; category?: string; destination?: string; title?: string };
}) {
  const copy = uiCopy(locale);
  const tripsPath = withLocale("/trips", locale);
  const filterHref = (key: "main" | "category" | "destination", value: string | number) => {
    const query = new URLSearchParams();
    if (active.title) query.set("title", active.title);
    query.set(key, String(value));
    return `${tripsPath}?${query.toString()}`;
  };
  return (
    <main>
      <section className="original-page-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.55)), url(${page?.banner || "/images/mainBanner.png"})` }}>
        <h1>{page?.title || copy.egyptTours}</h1>
      </section>
      <section className="trips-layout">
        <aside className="trips-filter">
          <h3>{copy.tours}</h3>
          {taxonomy.rootCategories.map((item) => (
            <Link className={active.main === item.slug ? "is-active" : ""} href={filterHref("main", item.slug || "")} key={item.id || item.slug}>
              <span>{item.title || item.name}</span>
              {item.slug && taxonomy.counts[item.slug] !== undefined ? <small>{taxonomy.counts[item.slug]}</small> : null}
            </Link>
          ))}
          {taxonomy.childCategories.length ? <h3>{copy.trips}</h3> : null}
          {taxonomy.childCategories.map((item) => (
            <Link className={active.category === String(item.id) ? "is-active" : ""} href={filterHref("category", item.id || "")} key={item.id || item.slug}>
              <span>{item.title || item.name}</span>
            </Link>
          ))}
          {taxonomy.destinations.length ? <h3>Egypt Destinations</h3> : null}
          {taxonomy.destinations.map((item) => (
            <Link className={active.destination === item.slug ? "is-active" : ""} href={filterHref("destination", item.slug || "")} key={item.id || item.slug}>
              <span>{item.title || item.name}</span>
            </Link>
          ))}
          {!taxonomy.available ? <p className="muted">Filters are temporarily unavailable.</p> : null}
        </aside>
        <div className="trips-results">
          <div className="section-heading original-heading"><div><h2>{copy.egyptTours}</h2><p>{active.title ? `${copy.search}: ${active.title}` : "Browse all available Sun Pyramids tours"}</p></div></div>
          <div className="grid-cards">{tours.map((tour) => <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />)}</div>
          {!tours.length ? <p className="muted">No tours matched the selected filters.</p> : null}
        </div>
      </section>
    </main>
  );
}

export function TravelGuidePage({
  page,
  categories,
  blogs,
  categoryBasePath = "/egypt-travel-guide",
  locale = "en",
}: {
  page: ApiPage | null;
  categories: ApiPage[];
  blogs?: ApiPage[];
  categoryBasePath?: string;
  locale?: Locale;
}) {
  const pageTitle = page?.title || page?.name || "Egypt Travel Guide";
  const isRoot = categoryBasePath === "/egypt-travel-guide";
  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: "Egypt Travel Guide", href: !isRoot ? withLocale("/egypt-travel-guide", locale) : undefined },
    ...(!isRoot ? [{ label: pageTitle }] : []),
  ];
  const totalCount = categories.length + (blogs?.length ?? 0);

  return (
    <main>
      <DiscoveryHero
        title={pageTitle}
        breadcrumbs={breadcrumbs}
        eyebrow="Local Insights & Guides"
        description={
          page?.short_description ||
          page?.description ||
          "Essential travel advice, historical insights, and destination tips directly from our Cairo team."
        }
        totalCount={totalCount > 0 ? totalCount : undefined}
        bgImage={page?.banner || "/images/blogsHero.png"}
      />

      <section className="discovery-section">
        <div className="container-shell" style={{ display: "grid", gap: "2.5rem" }}>
          {page?.content && (
            <article
              className="editorial-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          )}

          {categories.length > 0 && (
            <div>
              <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.45rem", fontWeight: 700, color: "var(--spt-ink)" }}>
                {isRoot ? "Explore Destination Guides" : "Topics & Regions"}
              </h2>
              <div className="destination-mosaic-grid">
                {categories.map((category) => (
                  <DestinationCard
                    key={category.id || category.slug}
                    destination={category}
                    basePath={categoryBasePath}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {blogs && blogs.length > 0 && (
            <div>
              <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.45rem", fontWeight: 700, color: "var(--spt-ink)" }}>
                Featured Articles & Advice
              </h2>
              <div className="discovery-grid">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id || blog.slug} blog={blog} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {categories.length === 0 && (!blogs || blogs.length === 0) && (
            <EmptyState
              title="No guide topics found"
              description="We are actively writing new guides for this region. Explore our other destinations or search our tours."
              actionLabel="Explore Egypt tours"
              actionHref={withLocale("/trips", locale)}
            />
          )}
        </div>
      </section>
    </main>
  );
}


export function EventDetailPage({
  event,
  relatedTours,
  locale = "en",
}: {
  event: ApiPage | null;
  relatedTours: Tour[];
  locale?: Locale;
}) {
  const title = event?.title || event?.name || "Egypt Event";
  const image = event?.banner || event?.featured_image || event?.image || "/images/eventsHero.png";
  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: "Events", href: withLocale("/events", locale) },
    { label: title },
  ];

  return (
    <main className="event-detail-page">
      <header className="editorial-hero">
        <div className="editorial-hero-inner">
          <nav className="editorial-breadcrumb" aria-label="Breadcrumb">
            <Link href={withLocale("/", locale)}>Home</Link>
            <span className="separator" aria-hidden="true">›</span>
            <Link href={withLocale("/events", locale)}>Events</Link>
            <span className="separator" aria-hidden="true">›</span>
            <span className="current" aria-current="page">{title}</span>
          </nav>

          <span className="editorial-eyebrow">Cultural Celebration</span>
          <h1 className="editorial-title">{title}</h1>

          {image && (
            <div className="editorial-lead-media">
              <Image
                src={image}
                alt={title}
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
              />
            </div>
          )}
        </div>
      </header>

      <section className="editorial-main-section">
        <div className="editorial-container">
          <div className="editorial-event-layout">
            <article
              className="editorial-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(event?.description || event?.content) }}
            />

            <aside className="event-booking-panel">
              <p className="panel-eyebrow">Event Attendance</p>
              <h3>Plan Your Visit</h3>
              <ContactForm locale={locale} submitLabel="Inquire About Event" />
            </aside>
          </div>
        </div>
      </section>

      {relatedTours.length > 0 && (
        <section className="editorial-related-section">
          <div className="editorial-container">
            <div className="section-header">
              <h2>Related Tours & Experiences</h2>
              <Link className="see-more" href={withLocale("/trips", locale)}>
                View all tours &rarr;
              </Link>
            </div>
            <div className="discovery-grid">
              {relatedTours.slice(0, 3).map((tour) => (
                <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export function MarketingLandingPage({ page, tours, locale = "en" }: { page: ApiPage | null; tours: Tour[]; locale?: Locale }) {
  const copy = uiCopy(locale);
  const banner = page?.banner || "/images/mainBanner.png";
  const heroStyle = {
    backgroundImage: `url(${banner})`,
  } as CSSProperties;
  const reasons = [
    [copy.licensedTitle, copy.licensedDescription],
    [copy.privateTitle, copy.privateDescription],
    [copy.hotelTitle, copy.hotelDescription],
  ];

  return (
    <main className="book-trip-page">
      <section className="book-trip-hero" style={heroStyle}>
        <div className="hero-content">
          <p className="eyebrow">Sun Pyramids Concierge</p>
          <h1>{copy.bookTripTitle}</h1>
          <p>{copy.bookTripDescription}</p>
          <div className="hero-actions">
            <a className="btn-whatsapp" href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.63a11.9 11.9 0 0 0 5.86 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-.1.25-1.25-3.52-4.44zM12.07 21.88h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.65-.24-.38a9.88 9.88 0 0 1-1.52-5.27c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9 1.87 1.88 2.9 4.37 2.9 7.02 0 5.46-4.45 9.9-9.92 9.9zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z" />
              </svg>
              <span>{copy.whatsappNow}</span>
            </a>
            <Link className="btn-primary" href={withLocale("/make-your-trip", locale)}>
              {copy.planYourTrip} &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="book-trip-pillars">
        <div className="pillars-grid">
          {reasons.map(([title, description]) => (
            <article className="pillar-card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      {tours.length > 0 && (
        <section className="editorial-related-section">
          <div className="editorial-container">
            <div className="section-header">
              <h2>{copy.selectedTours}</h2>
              <Link className="see-more" href={withLocale("/trips", locale)}>
                View all tours &rarr;
              </Link>
            </div>
            <div className="discovery-grid">
              {tours.slice(0, 4).map((tour) => (
                <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="book-trip-consultation">
        <div className="consultation-shell">
          <div className="section-header">
            <h2>{copy.makeTripEasy}</h2>
          </div>
          <ContactForm locale={locale} submitLabel={copy.customItinerary} />
        </div>
      </section>

      <section className="section-pad container-shell review-section">
        <div id="book-trip-reviews" />
      </section>
      <TrustIndexLoader
        containerId="book-trip-reviews"
        script="https://cdn.trustindex.io/loader.js?1d15b034519c8049128609a4d4e"
      />

      <section className="section-pad container-shell home-gallery-section">
        <div className="home-centered-heading">
          <h2>{copy.galleryTitle}</h2>
          <p>{copy.galleryDescription}</p>
        </div>
        <div className="home-social-gallery">
          {bookTripGallery.map(([image, icon, label]) => (
            <article key={label}>
              <Image src={image} alt={`${label} travel moments`} fill sizes="(max-width: 768px) 72vw, 25vw" />
              <Image className="home-gallery-icon" src={icon} alt="" width={66} height={66} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ThankfulPage({ locale = "en" }: { locale?: Locale }) {
  return (
    <main className="payment-status">
      <section className="status-card">
        <p className="eyebrow">Thank you</p>
        <h1>Your request has been received</h1>
        <p className="muted">Sun Pyramids Tours will contact you shortly with the next steps.</p>
        <Link className="btn-primary" href={withLocale("/", locale)}>Back Home</Link>
      </section>
    </main>
  );
}
