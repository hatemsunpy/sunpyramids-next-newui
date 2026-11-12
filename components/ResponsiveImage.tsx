"use client";

import type { Ref } from "react";
import Image, { type ImageProps, type ImageLoaderProps } from "next/image";
import { responsiveImageSource, remoteImageURL } from "@/lib/responsive-image";
import { APPROVED_BRAND_LOGO } from "@/lib/site-contact";

function imageLoader({ src, width }: ImageLoaderProps) {
  return responsiveImageSource(src, width);
}

// Use the existing backend image URL; resizing never owns or snapshots CMS data.
export default function ResponsiveImage({
  alt = "",
  ...props
}: ImageProps & { ref?: Ref<HTMLImageElement> }) {
  const source = typeof props.src === "string" ? props.src : undefined;
  const usesCustomLoader = Boolean(
    source && !props.unoptimized && (remoteImageURL(source) || source === APPROVED_BRAND_LOGO),
  );
  if (!usesCustomLoader) {
    return <Image alt={alt} {...props} unoptimized={props.unoptimized ?? true} />;
  }
  return <Image alt={alt} {...props} data-image-source={source} unoptimized={false} loader={imageLoader} />;
}


