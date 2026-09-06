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


export function EventDetailPage({ event, relatedTours, locale = "en" }: { event: ApiPage | null; relatedTours: Tour[]; locale?: Locale }) {
  const title = event?.title || event?.name || "Egypt Event";
  return (
    <main>
      <section className="original-page-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.55)), url(${event?.banner || event?.featured_image || "/images/eventsHero.png"})` }}>
        <h1>{title}</h1>
      </section>
      <section className="event-detail-layout container-shell">
        <article>
          <h2>{title}</h2>
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event?.description || event?.content) }} />
        </article>
        <aside className="booking-panel">
          <p className="eyebrow">Event details</p>
          <h3>{title}</h3>
          <ContactForm locale={locale} />
        </aside>
      </section>
      {relatedTours.length ? <section className="section-pad container-shell"><div className="grid-cards">{relatedTours.slice(0, 4).map((tour) => <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />)}</div></section> : null}
    </main>
  );
}

export function MarketingLandingPage({ page, tours, locale = "en" }: { page: ApiPage | null; tours: Tour[]; locale?: Locale }) {
  const copy = uiCopy(locale);
  const banner = page?.banner || "/images/mainBanner.png";
  const phoneBanner = String(page?.phone_banner || banner);
  const heroStyle = {
    "--landing-desktop-image": `url(${banner})`,
    "--landing-mobile-image": `url(${phoneBanner})`,
  } as CSSProperties;
  const reasons = [
    [copy.licensedTitle, copy.licensedDescription],
    [copy.privateTitle, copy.privateDescription],
    [copy.hotelTitle, copy.hotelDescription],
  ];
  return (
    <main className="book-trip-page">
      <section className="landing-hero" style={heroStyle}>
        <div>
          <p className="eyebrow">Sun Pyramids Tours</p>
          <h1>{copy.bookTripTitle}</h1>
          <p className="landing-hero-description">{copy.bookTripDescription}</p>
          <div className="landing-hero-actions">
            <a className="btn-whatsapp" href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer">{copy.whatsappNow}</a>
            <Link className="btn-primary" href={withLocale("/make-your-trip", locale)}>{copy.planYourTrip}</Link>
          </div>
        </div>
      </section>
      <section className="book-trip-why section-pad container-shell">
        <div className="section-heading original-heading"><div><h2>{copy.whyChooseUs}</h2></div></div>
        <div className="why-grid">
          {reasons.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>
      {tours.length ? <section className="section-pad container-shell"><div className="section-heading original-heading"><div><h2>{copy.selectedTours}</h2></div></div><div className="grid-cards">{tours.slice(0, 4).map((tour) => <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />)}</div></section> : null}
      <section className="section-pad container-shell book-trip-contact">
        <div className="section-heading original-heading"><div><h2>{copy.makeTripEasy}</h2></div></div>
        <div className="landing-contact"><ContactForm locale={locale} submitLabel={copy.customItinerary} /></div>
      </section>
      <section className="section-pad container-shell review-section"><div id="book-trip-reviews" /></section>
      <TrustIndexLoader containerId="book-trip-reviews" script="https://cdn.trustindex.io/loader.js?1d15b034519c8049128609a4d4e" />
      <section className="section-pad container-shell home-gallery-section">
        <div className="home-centered-heading"><h2>{copy.galleryTitle}</h2><p>{copy.galleryDescription}</p></div>
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
