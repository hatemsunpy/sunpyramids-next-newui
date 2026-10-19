'use client';

import { responsiveImageSource } from "./responsive-image";

// Global custom loader for next/image. Uses the existing /media/image
// transform service for approved live backend image URLs and returns all
// other sources unchanged. Never routes through Vercel's billed /_next/image
// service. Byte derivation only; Laravel remains the source of truth.
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  return responsiveImageSource(src, width);
}
