"use client";

import Image from "@/components/ResponsiveImage";
import { useEffect, useRef, useState } from "react";

export type HomeHeroCopySlide = {
  title: string;
  accent: string;
  description: string;
};

export function HomeHeroScene({
  images,
  blurImages,
  alt,
  slides,
}: {
  images: string[];
  blurImages: Record<string, string>;
  alt: string;
  slides: HomeHeroCopySlide[];
}) {
  const [active, setActive] = useState(0);
  const [prepared, setPrepared] = useState<number[]>([0]);
  const firstImageRef = useRef<HTMLImageElement>(null);
  const count = images.length;

  const goTo = (index: number) => setActive(((index % count) + count) % count);

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const firstImage = firstImageRef.current;
    let timer: number | undefined;
    function prepareNext() {
      // The next slide can load after the visible image, without downloading
      // the whole gallery or a second copy of each original CMS image.
      timer = window.setTimeout(() => {
        const next = (active + 1) % count;
        setPrepared(current => current.includes(next) ? current : [...current, next]);
      }, 250);
    }
    if (firstImage?.complete) prepareNext();
    else {
      firstImage?.addEventListener("load", prepareNext, { once: true });
      firstImage?.addEventListener("error", prepareNext, { once: true });
    }
    return () => {
      window.clearTimeout(timer);
      firstImage?.removeEventListener("load", prepareNext);
      firstImage?.removeEventListener("error", prepareNext);
    };
  }, [active, count]);

  const copy = slides.length ? slides[active % slides.length] : null;
  const TitleTag = copy && active % slides.length === 0 ? "h1" : "h2";

  return (
    <>
      <div className="home-hero-v2__media">
        {images.map((image, index) => prepared.includes(index) || index === active ? (
          <Image
            key={image}
            ref={index === 0 ? firstImageRef : undefined}
            src={image}
            placeholder={blurImages[image] ? "blur" : "empty"}
            blurDataURL={blurImages[image]}
            alt={alt}
            fill
            loading={index === active ? "eager" : "lazy"}
            fetchPriority={index === active ? "high" : "low"}
            sizes="(max-width: 640px) max(100vw, 1200px), (max-width: 1180px) max(100vw, 1680px), 100vw"
            className="hero-media-slide"
            style={{ opacity: index === active ? 1 : 0 }}
            aria-hidden={index !== active}
          />
        ) : null)}
        {count > 1 && (
          <>
            <button type="button" className="hero-arrow hero-arrow-prev" aria-label="Previous slide" onClick={() => goTo(active - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button type="button" className="hero-arrow hero-arrow-next" aria-label="Next slide" onClick={() => goTo(active + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <div className="hero-dots">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === active ? "hero-dot hero-dot-active" : "hero-dot"}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="home-hero-v2__veil" />
      <div className="home-hero-v2__inner">
        {copy && (
          <div className="home-hero-v2__copy" key={active}>
            <TitleTag>
              <span className="home-hero-v2__title-row">{copy.title}</span>{" "}
              <span className="home-hero-v2__title-row home-hero-v2__title-row--accent">
                <span className="home-hero-v2__title-accent">{copy.accent}</span>
              </span>
            </TitleTag>
            <p>{copy.description}</p>
          </div>
        )}
      </div>
    </>
  );
}
