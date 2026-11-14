# Website Interactions

Scope: visitor/individual website behavior using existing source information. No campaign management, campaign configuration, new analytics provider or additional environment variables were added. Website layouts and product flows are preserved.

## Deployment

Apply `20261113000000_interactions` before starting the updated APIs. Deploy Website, Website API, Admin API and Admin. The migration is additive, creates Interaction with its relations/indexes, adds the PageVisit client correlation field and exposes Interaction through the existing Query Agent schema. Older traffic cannot be reconstructed.

## Administration

Data Hub -> Interactions provides a paginated list and detail screen. Filter by date in GMT, event, source, device, visitor, individual, page, component or product. Interactions appear in the existing Visitor activity tabs and Individual related-information tabs, with links to interaction details. Page Visit details also link to their interactions. Visitor and Individual related records use plain descriptions of actions, readable page names and measured durations. Visibility is distinguished from clicks and successful requests; raw codes and metadata remain collapsed in Technical details on the interaction screen. Browser event time and server receipt time are separate; sequence and elapsed milliseconds help investigate arrival order. SERVER rows identify backend-confirmed request/chat/message outcomes; BROWSER rows describe observed client behavior.

## Captured behavior

- Page entry, departure, active-time summaries and scroll-depth milestones.
- Qualified exposure and duration for homepage collections/cards/hero slides, catalog cards, product images/descriptions/features/prices, plans/inclusions, contact areas and other annotated sections.
- Horizontal and vertical scroll bursts for the page, collection strips, galleries, plan cards, booking drawers and trip content; visible target identifiers and movement direction. Programmatic/unknown movement is distinguished from recently observed wheel/touch/keyboard input.
- Clicks with semantic target/component IDs, product/plan/image context and touch/mouse/keyboard input when known.
- Deliberate mouse hovers >=500ms; no raw cursor recording or session replay.
- Modal opening/closing; image, plan and slideshow state changes; hero automatic/manual progression.
- Form start/completion/validation and result states, without typed values. Password/hidden fields are excluded. Contact/booking/trip submissions carry visitor/journey/page context; request/chat/message success events are recorded by the website backend.
- Existing source context, browser/OS and best-effort mobile/tablet/desktop classification; viewport, language, theme and input capability.

## Measurement and limitations

Exposure normally requires 50% visibility for at least one second; tall sections use half a viewport as the visible-area threshold. Hidden tabs, inactive slides and content behind tracked overlays do not qualify. Visibility/hover is evidence of exposure, not proof of reading or personhood. Browser signals cannot establish a visitor's exact attention, physical device or origin if unavailable.

Events are bounded, batched, retried and deduplicated by event ID. Identity is verified by the server; anonymous interactions are linked only within the verified journey on login/Google authentication. Historical authentication-at-event is preserved. Late PageVisit arrival can attach interactions through the client page-instance ID. Source is taken from that page visit where available, avoiding reassignment to another tab's latest source.

Pending delivery is best effort: a browser killed without a lifecycle notification, offline traffic or blocked analytics can leave missing records. Tracking failure does not block navigation or submissions. No full form values, messages, credentials, reset/payment tokens or arbitrary DOM text are logged. Payment interactions are browser-reported screen states; the existing payment records remain authoritative for receipt of money.

Raw interaction rows currently remain until explicitly removed; no automatic retention deletion was introduced. High-frequency scroll callbacks are aggregated into bursts, and hover/exposure duration is summarized.

## Checks

- Website production build and Admin production build; Admin API TypeScript build.
- Website client test: `node --import ../website-api/node_modules/tsx/dist/loader.mjs --test test/interactions.test.ts` from Website.
- Website API: set `RUN_LOCAL_DB_TESTS=1`, then `node --import tsx --test test/interactions.test.ts test/visitor-profile.test.ts test/page-visit-diagnostics.test.ts`.
- Admin API after build: set `RUN_LOCAL_DB_TESTS=1`, then `node --test test/interactions.test.mjs`.

Database tests require localhost and clean up only their own fixtures. Browser/device UI testing should include touch scrolling, desktop hover, all supported languages and nightclub mode.
