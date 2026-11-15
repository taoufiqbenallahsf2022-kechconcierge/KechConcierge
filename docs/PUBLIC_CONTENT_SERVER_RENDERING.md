# Public content in the initial HTML

Homepage, category listings and product pages now load their initial public content in Next.js server routes using the existing Website API endpoints. The existing client components retain their layout and interactions. Services/About/Contact already render static content without waiting for product API calls; account, trip and chat remain client features.

## Behavior

- Homepage requests slideshow configuration and all homepage collections in parallel, then passes public data into the existing components.
- Category pages fetch their requested product type, language and page number. Pagination and language routes get distinct component state.
- Product routes fetch their existing details endpoint and pass data into ProductDetailsPage, which contains the previous product UI. Metadata, structured data and the visible page share a request-scoped fetch result.
- React cache deduplicates within one server render. Public fetches use no-store so new requests do not retain previous content globally. No visitor identity or browser session is forwarded to these public endpoints.
- Missing products return 404. Temporary API failures leave the existing browser loading/retry path available instead of being treated as a missing product. The pre-existing metadata failure handling is unchanged.
- No server rendering mutates shared Zustand stores. Initial category/product state is local to the keyed page component. No new environment variables, endpoint, database migration or API deployment is required.
- Product cards use Next.js Link with the original layout, localized destination, loading feedback, tracking and explicit hover/focus prefetch.

## Deployment

Deploy Website. The existing API_URL (if configured) or NEXT_PUBLIC_API_URL must be reachable from the Website container. Localhost fallback remains for local development. No environment variables were added. Server request timeout is 10 seconds; failures preserve browser fallback. This may add API latency to initial responses and should be monitored after deployment.

## Validation

Run npm run build from apps/website, then node --test apps/website/test/server-rendering.test.mjs from the repository root. The test starts its own temporary production Website and local mock public API; it does not access the database or modify real catalog records.

The test checks homepage content, all six currently public product categories, all six languages, category page 2, crawlable product hrefs, product headings/descriptions/prices, request-level API deduplication, missing-product 404, temporary upstream failure and concurrent language isolation. Scripts/styles are stripped from responses before checking content, so serialized JSON is not mistaken for visible page markup.

Browser verification with mock catalog data covered a French category card navigating to the French product, desktop service options to the booking form with the selected option, and the mobile service-options layout. No form was submitted. Unrelated client APIs (trip restoration etc.) were not running in that isolated preview; a live booking/payment end-to-end test was not performed.

## Public category availability

Packs and Spa remain stored and manageable in administration. Website navigation, homepage collections, Services and sitemap omit them. Their category/product URLs (including localized routes and supported aliases) return 404 with noindex through Next.js notFound. Do not add a robots.txt disallow: search engines must still be able to recrawl those URLs to observe their removal. Google decides when existing search results and sitelinks update after deployment.

Mobile menu thumbnails come from the first homepage-highlighted product with a thumbnail in each public category. Categories without a highlighted image fall back to an actual catalog product. No stock images are hard-coded in Header. If an image request fails, the category keeps its existing image area with a neutral background and remains navigable. On local seed data, the stored product thumbnail itself can be an Unsplash image; production follows the production API/database.
