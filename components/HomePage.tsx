import { Activity } from "react";
import Image from "@/components/ResponsiveImage";
import Link from "next/link";
import type { ApiPage, Locale, SocialLink, Tour } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { TourCard } from "@/components/TourCard";
import { BlogCard } from "@/components/BlogCard";
import { DestinationCard } from "@/components/DestinationCard";
import { SectionEyebrow, SectionHeading } from "@/components/SectionHeading";
import { TravelMomentsGallery } from "@/components/TravelMomentsGallery";
import { TravellerReviews } from "@/components/TravellerReviews";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import { HomePopularTours } from "@/components/HomePopularTours";
import { HomeHeroScene } from "@/components/HomeHeroScene";
import { TravelPartners } from "@/components/TravelPartners";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { HomeUpcomingEvents } from "@/components/HomeUpcomingEvents";
import { HomeCardStack } from "@/components/HomeCardStack";
import { WhyTravelWithSunPyramids } from "@/components/WhyTravelWithSunPyramids";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { toTourCardData } from "@/lib/tour-card-data";
import { homeCopy } from "@/lib/home-copy";
import { homeSectionLabels } from "@/lib/home-section-labels";
import { getImageBlurPlaceholders } from "@/lib/image-blur.server";

function ShortcutIcon({ type }: { type: "make" | "find" | "car" }) {
  if (type === "find") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
  }
  if (type === "car") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 17h14l-1-6-2-3H8l-2 3-1 6Z" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 15 8-3 3-8 2 1-1 7 5 3-1 2-6-1-3 5-2-1 1-5-5 2-1-2Z" /></svg>;
}

export async function HomePage({
  page,
  tours,
  popularTours,
  specialOffers,
  highlights,
  blogs,
  faqs,
  socialLinks,
  events = [],
  rootCategories = [],
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
  events?: ApiPage[];
  rootCategories?: Pick<ApiPage, "slug" | "title" | "name">[];
  locale?: Locale;
}) {
  const copy = homeCopy(locale);
  const labels = homeSectionLabels(locale);
  const heroImages = page?.gallery?.length
    ? page.gallery
    : [page?.banner || page?.image || "/images/mainBanner.webp"];
  const heroBlurImages = await getImageBlurPlaceholders(heroImages);
  const heroCopySlides = [
    { title: copy.heroMainTitle, accent: copy.heroMainAccent, description: copy.heroMainDescription },
    { title: copy.heroSlide1Title, accent: copy.heroSlide1Accent, description: copy.heroSlide1Description },
    { title: copy.heroSlide2Title, accent: copy.heroSlide2Accent, description: copy.heroSlide2Description },
    { title: copy.heroSlide3Title, accent: copy.heroSlide3Accent, description: copy.heroSlide3Description },
    { title: copy.heroSlide4Title, accent: copy.heroSlide4Accent, description: copy.heroSlide4Description },
  ];
  const bookingSteps = [
    ["1", copy.findingTitle, copy.findingDescription],
    ["2", copy.bookingTitle, copy.bookingDescription],
    ["3", copy.enjoyTitle, copy.enjoyDescription],
  ];

  return (
    <main className="home-page home-page--redesign">
      <section className="home-hero-v2">
        <HomeHeroScene images={heroImages} blurImages={heroBlurImages} alt="Sun Pyramids Tours Egypt experience" slides={heroCopySlides} />
        <nav className="home-mobile-shortcuts" aria-label="Quick trip actions">
          <Link href={withLocale("/make-your-trip", locale)}><ShortcutIcon type="make" /><strong>{copy.makeTripShort}</strong></Link>
          <Link href={withLocale("/trips", locale)}><ShortcutIcon type="find" /><strong>{copy.findTripShort}</strong></Link>
          <Link href={withLocale("/rent-car", locale)}><ShortcutIcon type="car" /><strong>{copy.rentCarShort}</strong></Link>
        </nav>
      </section>

      <section className="home-search-bridge container-shell" aria-label="Search and plan your trip">
        <Activity mode="visible">
          <HomeSearchShortcuts locale={locale} destinations={highlights} rootCategories={rootCategories} />
        </Activity>
      </section>

      <WhyTravelWithSunPyramids locale={locale} />

      {tours.length ? (
        <section className="home-section home-signature-section container-shell">
          <SectionHeading
            description={copy.seasonalDescription}
            eyebrow={labels.seasonal}
            href={withLocale("/event/egypt-christmas-event-2027", locale)}
            linkLabel={copy.seeMore}
            title={copy.seasonalTitle}
          />
          <SwipeCarousel className="home-signature-grid" ariaLabel={copy.seasonalTitle}>
            {tours.map((tour, index) => (
              <TourCard
                className={index === 0 ? "tour-card--feature" : ""}
                key={tour.id || tour.slug}
                tour={tour}
                locale={locale}
                imageSizes={index === 0
                  ? "(max-width: 640px) 850px, (max-width: 1180px) 100vw, 1200px"
                  : "(max-width: 640px) 750px, (max-width: 1180px) 100vw, 800px"}
              />
            ))}
          </SwipeCarousel>
        </section>
      ) : null}

      <section className="home-section home-discovery-section">
        <div className="container-shell">
          <SectionHeading
            align="center"
            description={copy.popularDescription}
            eyebrow={copy.popularEyebrow}
            href={withLocale("/trips", locale)}
            linkLabel={copy.seeMore}
            title={copy.popularTitle}
          />
          <Activity mode="visible">
            <HomePopularTours initialTours={popularTours.map(toTourCardData)} locale={locale} />
          </Activity>
        </div>
      </section>

      <section className="home-plan-section container-shell">
        <div className="home-plan-section__media">
          <Image
            src={heroImages[1] || heroImages[0]}
            alt="Plan a journey across Egypt"
            fill
            sizes="(max-width: 640px) max(100vw, 600px), (max-width: 1180px) max(100vw, 840px), max(42vw, 1240px)"
          />
        </div>
        <div className="home-plan-section__form">
          <SectionEyebrow>{labels.plan}</SectionEyebrow>
          <h2>{copy.makeYourTrip}</h2>
          <Activity mode="visible">
            <HomeSearchShortcuts locale={locale} destinations={highlights} modeOnly="make" />
          </Activity>
        </div>
      </section>

      {specialOffers.length ? (
        <section className="home-section container-shell home-offers-section">
          <SectionHeading
            description={copy.specialOffersDescription}
            eyebrow={labels.offers}
            href={withLocale("/trips?main=special-offers", locale)}
            linkLabel={copy.seeMore}
            title={copy.specialOffersTitle}
          />
          <SwipeCarousel className="home-offers-track" ariaLabel={copy.specialOffersTitle}>
            {specialOffers.map((tour) => (
              <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} isSpecialOffer />
            ))}
          </SwipeCarousel>
        </section>
      ) : null}

      <HomeUpcomingEvents events={events} locale={locale} />

      <section className="home-how-section-v2">
        <div className="container-shell home-how-layout">
          <div className="home-how-intro">
            <SectionEyebrow>{labels.how}</SectionEyebrow>
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
          <SectionHeading align="center" description={copy.highlightsDescription} eyebrow={labels.destinations} title={copy.highlightsTitle} />
          <SwipeCarousel className="home-destination-mosaic" ariaLabel={copy.highlightsTitle}>
            {highlights.slice(0, 7).map((destination, index) => (
              <DestinationCard
                basePath="/egypt-tours/one-day-tours"
                className={index === 0 || index === 5 || index === 6 ? "destination-card--wide" : ""}
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
              eyebrow={labels.blogs}
              href={withLocale("/blogs/all-blogs", locale)}
              linkLabel={copy.seeMore}
              title={copy.travelBlogs}
            />
            <div className="home-editorial-grid">
              {blogs.slice(0, 4).map((blog, index) => (
                <BlogCard
                  className={index === 0 ? "blog-card--lead" : ""}
                  imageSizes={index === 0
                    ? "(max-width: 640px) max(100vw, 960px), (max-width: 1180px) 100vw, 80vw"
                    : undefined}
                  key={blog.id || blog.slug}
                  blog={blog}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-certification-section-v2 container-shell">
        <div>
          <p>{copy.howItWorksDescription}</p>
          <SectionEyebrow>{labels.sustainability}</SectionEyebrow>
          <h2>Tailored <span>guidance</span> for your <span>sustainability</span> journey</h2>
          <Link className="btn-primary" href={withLocale("/sustainability", locale)}>{copy.seeMore}<span aria-hidden="true">↗</span></Link>
        </div>
        <Image src="/images/certified-logo.webp" alt="Certified sustainable travel" width={430} height={167} />
      </section>

      <TravelMomentsGallery socialLinks={socialLinks} locale={locale} />

      <div className="home-card-stack-section">
        <Activity mode="visible">
          <HomeCardStack previousLabel={copy.stackPrevious} nextLabel={copy.stackNext} cardLabel={copy.stackCard} />
        </Activity>
      </div>

      <TravellerReviews containerId="home-reviews" locale={locale} />

      {faqs.length ? (
        <section className="home-faq-section-v2">
          <div className="container-shell home-faq-layout">
            <div className="home-faq-intro">
              <SectionEyebrow>{labels.faq}</SectionEyebrow>
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
        <div className="home-help-panel-v2"><SectionEyebrow>{labels.help}</SectionEyebrow><h2>{copy.needHelp}</h2><Activity mode="visible"><HomeNeedHelpForm locale={locale} /></Activity></div>
      </section>

      <TravelPartners />
    </main>
  );
}
