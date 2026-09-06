"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function HomeHeroMedia({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;

  const goTo = (index: number) => setActive(((index % count) + count) % count);

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <>
      {images.map((image, index) => (
        <Image
          key={image}
          src={image}
          alt={alt}
          fill
          priority={index === 0}
          sizes="100vw"
          className="hero-media-slide"
          style={{ opacity: index === active ? 1 : 0 }}
          aria-hidden={index !== active}
        />
      ))}
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
    </>
  );
}
