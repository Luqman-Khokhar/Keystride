import type { Metadata } from "next";
import { SITE_NAME } from "./site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Page-level openGraph replaces the layout's entirely (no deep merge), so every page
 * that sets its own must re-include the shared defaults — including the default image.
 * Routes with their own opengraph-image file pass `image: false`.
 */
export function openGraph(page: OpenGraph & { image?: boolean }): OpenGraph {
  const { image = true, ...rest } = page;
  return {
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    ...(image ? { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Keystride typing test" }] } : {}),
    ...rest,
  } as OpenGraph;
}
