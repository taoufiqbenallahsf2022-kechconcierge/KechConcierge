"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

function tinyCloudflareVariant(source: ImageProps["src"]) {
  if (typeof source !== "string") return null;
  const match = source.match(/^(https:\/\/imagedelivery\.net\/[^/]+\/[^/]+)\/[^/?]+(?:\?.*)?$/i);
  return match ? `${match[1]}/w=48,quality=28,format=auto` : null;
}

type Props = Omit<ImageProps, "placeholder" | "blurDataURL" | "onLoad"> & { priority?: boolean };

export default function ProgressiveImage({ className = "", priority = false, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const tinyUrl = tinyCloudflareVariant(props.src);
  return <>
    <span className={`progressive-image-placeholder ${loaded ? "is-loaded" : ""}`} style={tinyUrl ? { backgroundImage: `url("${tinyUrl}")` } : undefined} aria-hidden="true" />
    <Image {...props} priority={priority} loading={priority ? undefined : "lazy"} onLoad={() => setLoaded(true)} className={`${className} progressive-image ${loaded ? "is-loaded" : ""}`} />
  </>;
}
