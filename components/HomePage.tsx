import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale, SocialLink, Tour } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { TourCard } from "@/components/TourCard";
import { BlogCard } from "@/components/BlogCard";
import { DestinationCard } from "@/components/DestinationCard";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustIndexLoader } from "@/components/TrustIndexLoader";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import { HomePopularTours } from "@/components/HomePopularTours";
import { HomeHeroMedia } from "@/components/HomeHeroMedia";
import { TravelPartners } from "@/components/TravelPartners";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { homeCopy } from "@/lib/home-copy";

const gallery = [
  ["/images/shorts.png", "/images/shorts-gallary.png", "YouTube Shorts", "shorts"],
  ["/images/youtubeone.png", "/images/youtube-gallary.png", "YouTube", "youtube-video-1"],
  ["/images/tiktok.png", "/images/tiktok-gallary.png", "TikTok", "tiktok"],
  ["/images/instagram.png", "/images/insta-gallary.png", "Instagram", "insta-link"],
  ["/images/youtubetwo.png", "/images/fb-logo.webp", "Facebook", "youtube-video-2"],
];

function ShortcutIcon({ type }: { type: "make" | "find" | "car" }) {
  if (type === "find") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
  }
  if (type === "car") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 17h14l-1-6-2-3H8l-2 3-1 6Z" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 15 8-3 3-8 2 1-1 7 5 3-1 2-6-1-3 5-2-1 1-5-5 2-1-2Z" /></svg>;
}

export function HomePage({
  page,
  tours,
  popularTours,
  specialOffers,
  highlights,
  blogs,
  faqs,
  socialLinks,
  locale = "en",
}: {
  page: ApiPage | null;
  tours: Tour[];
  popularTours: Tour[];
  specialOffers: Tour[];
  highlights: ApiPage[];
  blogs: ApiPage[];
  faqs: ApiPage[];
  socialLinks: SocialLink[];
  locale?: Locale;
}) {
  const copy = homeCopy(locale);
  const heroImages = page?.gallery?.length
    ? page.gallery
    : [page?.banner || page?.image || "/images/mainBanner.png"];
  const stats = [
    ["+100K", copy.happyCustomer],
    ["+50", copy.yearsExperience],
    ["+60", copy.totalDestinations],
    ["5.0", copy.tripadvisorRating],
  ];
  const bookingSteps = [
    ["1", copy.findingTitle, copy.findingDescription],
    ["2", copy.bookingTitle, copy.bookingDescription],
    ["3", copy.enjoyTitle, copy.enjoyDescription],
  ];
  const socialUrls = new Map(socialLinks.map((item) => [item.type, item.url]));

  return (
    <main className="home-page home-page--redesign">
      <section className="home-hero-v2">
        <div className="home-hero-v2__media">
          <HomeHeroMedia images={heroImages} alt="Sun Pyramids Tours Egypt experience" />
        </div>
        <div className="home-hero-v2__veil" />
        <div className="home-hero-v2__inner">
          <div className="home-hero-v2__copy">
            <p>{copy.heroKicker}</p>
            <h1>{copy.heroTitle}</h1>
          </div>
          <div className="home-hero-v2__search">
            <HomeSearchShortcuts locale={locale} destinations={highlights} />
          </div>
        </div>
        <nav className="home-mobile-shortcuts" aria-label="Quick trip actions">
          <Link href={withLocale("/make-your-trip", locale)}><ShortcutIcon type="make" /><strong>{copy.makeTripShort}</strong></Link>
          <Link href={withLocale("/trips", locale)}><ShortcutIcon type="find" /><strong>{copy.findTripShort}</strong></Link>
          <Link href={withLocale("/rent-car", locale)}><ShortcutIcon type="car" /><strong>{copy.rentCarShort}</strong></Link>
        </nav>
      </section>

      <section className="home-trust-rail container-shell" aria-label="Sun Pyramids Tours statistics">
        {stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      {tours.length ? (
        <section className="home-section home-signature-section container-shell">
          <SectionHeading
            description={copy.seasonalDescription}
            href={withLocale("/event/egypt-christmas-event-2027", locale)}
            linkLabel={copy.seeMore}
            title={copy.seasonalTitle}
          />
          <div className="home-signature-grid">
            {tours.map((tour, index) => (
              <TourCard className={index === 0 ? "tour-card--feature" : ""} key={tour.id || tour.slug} tour={tour} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-section home-discovery-section">
        <div className="container-shell">
          <SectionHeading
            align="center"
            description={copy.popularDescription}
            href={withLocale("/trips", locale)}
            linkLabel={copy.seeMore}
            title={copy.popularTitle}
          />
          <HomePopularTours initialTours={popularTours} locale={locale} />
        </div>
      </section>

      <section className="home-plan-section container-shell">
        <div className="home-plan-section__media">
          <Image src={heroImages[1] || heroImages[0]} alt="Plan a journey across Egypt" fill sizes="(max-width: 900px) 100vw, 42vw" />
          <div><span>{copy.makeTripShort}</span><strong>{copy.makeYourTrip}</strong></div>
        </div>
        <div className="home-plan-section__form">
          <h2>{copy.makeYourTrip}</h2>
          <HomeSearchShortcuts locale={locale} destinations={highlights} modeOnly="make" />
        </div>
      </section>

      {specialOffers.length ? (
        <section className="home-section container-shell home-offers-section">
          <SectionHeading
            description={copy.specialOffersDescription}
            href={withLocale("/trips?main=special-offers", locale)}
            linkLabel={copy.seeMore}
            title={copy.specialOffersTitle}
          />
          <SwipeCarousel className="home-offers-track" ariaLabel={copy.specialOffersTitle}>
            {specialOffers.map((tour) => <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />)}
          </SwipeCarousel>
        </section>
      ) : null}

      <section className="home-how-section-v2">
        <div className="container-shell home-how-layout">
          <div className="home-how-intro">
            <h2>{copy.howItWorks}</h2>
            <p>{copy.howItWorksDescription}</p>
            <Link className="btn-outline" href={withLocale("/make-your-trip", locale)}>{copy.makeTripShort}<span aria-hidden="true">↗</span></Link>
          </div>
          <ol className="home-booking-steps-v2">
            {bookingSteps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number.padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <span aria-hidden="true">↗</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {highlights.length ? (
        <section className="home-section home-destinations-section container-shell">
          <SectionHeading align="center" description={copy.highlightsDescription} title={copy.highlightsTitle} />
          <SwipeCarousel className="home-destination-mosaic" ariaLabel={copy.highlightsTitle}>
            {highlights.slice(0, 7).map((destination, index) => (
              <DestinationCard
                basePath="/egypt-tours/one-day-tours"
                className={index === 0 || index === 4 ? "destination-card--wide" : ""}
                destination={destination}
                headingLevel={3}
                key={destination.id || destination.slug}
                locale={locale}
              />
            ))}
          </SwipeCarousel>
        </section>
      ) : null}

      {blogs.length ? (
        <section className="home-section home-editorial-section">
          <div className="container-shell">
            <SectionHeading
              href={withLocale("/blogs/all-blogs", locale)}
              linkLabel={copy.seeMore}
              title={copy.travelBlogs}
            />
            <div className="home-editorial-grid">
              {blogs.slice(0, 4).map((blog, index) => (
                <BlogCard className={index === 0 ? "blog-card--lead" : ""} key={blog.id || blog.slug} blog={blog} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-certification-section-v2 container-shell">
        <div>
          <p>{copy.howItWorksDescription}</p>
          <h2>Tailored <span>guidance</span> for your <span>sustainability</span> journey</h2>
          <Link className="btn-primary" href={withLocale("/sustainability", locale)}>{copy.seeMore}<span aria-hidden="true">↗</span></Link>
        </div>
        <Image src="/images/certified-logo.png" alt="Certified sustainable travel" width={430} height={167} />
      </section>

      <section className="home-section container-shell home-gallery-section-v2">
        <SectionHeading align="center" description={copy.galleryDescription} title={copy.galleryTitle} />
        <SwipeCarousel className="home-social-gallery-v2" ariaLabel={copy.galleryTitle}>
          {gallery.map(([image, icon, label, type], index) => {
            const content = <><Image src={image} alt={`${label} travel moments`} fill sizes="(max-width: 768px) 72vw, 25vw" /><Image className="home-gallery-icon" src={icon} alt="" width={54} height={54} /><span>{label}</span></>;
            const url = socialUrls.get(type);
            return <article className={index === 1 ? "is-tall" : ""} key={label}>{url ? <a href={url} target="_blank" rel="noreferrer" aria-label={label}>{content}</a> : content}</article>;
          })}
        </SwipeCarousel>
      </section>

      <section className="home-review-section container-shell">
        <div id="home-reviews" />
        <TrustIndexLoader containerId="home-reviews" script="https://cdn.trustindex.io/loader.js?1d15b034519c8049128609a4d4e" />
      </section>

      {faqs.length ? (
        <section className="home-faq-section-v2">
          <div className="container-shell home-faq-layout">
            <div className="home-faq-intro">
              <h2>{copy.faqTitle}</h2>
              <Link className="section-heading-link" href={withLocale("/faqs", locale)}>{copy.seeMore}<span aria-hidden="true">↗</span></Link>
            </div>
            <div className="faq-list-v2">
              {faqs.map((faq) => (
                <details className="faq-item-v2" key={String(faq.id || faq.question || faq.title)}>
                  <summary>{String(faq.question || faq.title || "Question")}<span aria-hidden="true">+</span></summary>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer || faq.description) }} />
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-help-section-v2 container-shell">
        <div className="home-help-panel-v2"><h2>{copy.needHelp}</h2><HomeNeedHelpForm locale={locale} /></div>
      </section>

      <TravelPartners />
    </main>
  );
}
