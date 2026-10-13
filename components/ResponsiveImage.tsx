"use client";

import type { Ref } from "react";
import Image, { type ImageProps, type ImageLoaderProps } from "next/image";
import { responsiveImageSource, remoteImageURL } from "@/lib/responsive-image";

function imageLoader({ src, width }: ImageLoaderProps) {
  return responsiveImageSource(src, width);
}

// Use the existing backend image URL; resizing never owns or snapshots CMS data.
export default function ResponsiveImage(props: ImageProps & { ref?: Ref<HTMLImageElement> }) {
  const source = typeof props.src === "string" ? props.src : undefined;
  if (!source || props.unoptimized || !remoteImageURL(source)) return <Image alt="" {...props} />;
  return <Image alt="" {...props} data-image-source={source} unoptimized={false} loader={imageLoader} />;
}

