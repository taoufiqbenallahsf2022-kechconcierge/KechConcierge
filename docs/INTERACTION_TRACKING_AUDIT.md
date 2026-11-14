# Website interaction tracking audit

Audit date: 13 November 2026. Scope: current repository pages, shared components, website APIs and identity tracking. This is a source-code audit and a proposed tracking specification, not an inspection of production traffic. No application behavior, layout, database or configuration is changed by this report.

## 1. What exists and what is missing

The current PageVisitTracker records route/query changes, visitor/journey/session identifiers, source, referrer, language, previous page, a recently clicked HTTP anchor when captured, browser time and navigation type. The API records user agent, IP, request origin, verified authentication and account access diagnostics. Visitor profiles retain first/latest source and a coarse mobile/desktop classification. Successful password login and Google authentication claim anonymous page visits from the current journey for the Individual.

Verified gaps:

- No Interaction model or general event pipeline currently exists. A page visit cannot distinguish an immediate departure from minutes browsing a carousel, gallery or plans without navigating.
- Product cards and several header controls navigate with buttons/router.push. The existing anchor-only click capture does not describe these actions.
- There is no general item exposure, section exposure, scroll-depth, hover-duration, active-time or form-step logging in the site's own analytics.
- Homepage hero slides advance automatically. A slide change is not necessarily a visitor interaction.
- Galleries and plans contain horizontal/nested scrolling. Document scroll depth cannot identify which image or plan was visible.
- The standalone Contact page sends no visitor/journey headers. Its anonymous submission can therefore be disconnected from the browser's preceding visits. Booking and trip requests send Visitor ID; they do not currently send Journey ID in those requests. Consistent correlation is needed before relying on detailed conversion funnels.
- Session ID lives in sessionStorage. It is tab-scoped, with no explicit inactivity timeout in the current helper. Journey ID persists until identity boundaries such as logout rotate it. Sessions, journeys, page views and unique browser visitors must be reported separately.
- Browser classification uses a user-agent regex and divides visitors into mobile or desktop. Tablet, operating system, pointer type and responsive viewport are not independently represented.
- Explicit source/utm_source is carried in sessionStorage; campaign and medium are read from the current URL and are not preserved with the same session context on subsequent pages. Bare referrer domains are not normalized into a consistent platform taxonomy. Missing referrer is currently labelled direct; this is not evidence of a typed URL.
- The site's TikTok component initializes its pixel and calls ttq.page(). This is separate from the application's own Interaction object and does not provide the proposed internal event history.

These are repository findings. They do not establish the cause of the production average of one page per visitor.

## 2. Source and device context

Keep acquisition separate from behavior. For each visit/session capture:

| Dimension | Proposed information |
| --- | --- |
| Attribution | First known source; current entry/session source; latest source; medium; campaign; raw allowed source value; attribution method: explicit parameter, external referrer, internal navigation or unknown |
| Link compatibility | Continue accepting source. Support existing utm_source/utm_medium/utm_campaign and custom medium/campaign if chosen; do not force UTM naming |
| Referrer | Sanitized external origin/path and normalized platform when identifiable; record missing information as unknown/direct-unattributed, not an invented origin |
| Landing/navigation | Landing route, previous internal route, clicked target, destination, navigation type, entry vs internal navigation |
| Device | Mobile/tablet/desktop/unknown as a best-effort classification; browser family/major version; OS family; viewport width/height; responsive breakpoint; orientation |
| Input | Actual event pointer type: mouse/touch/pen; hover/fine-pointer capabilities; keyboard activation/focus as a distinct interaction |
| Context | Page language, browser language, light/nightclub theme, visible/hidden tab state, environment and application version |

Capture attribution at entry and carry it through subsequent events and backend conversions. Do not rewrite the first source on every return visit. Detect source changes without converting ordinary internal navigation into a new marketing acquisition.

Do not use a small viewport as proof of a mobile device, or a mouse as proof of a desktop computer. Hybrid devices exist. Unknown device/platform values should remain unknown.

## 3. Common measurement rules

Proposed starting thresholds below are product choices, not industry requirements:

- **Item exposure:** record an item when at least 50% of a card/image/plan is in its visible container for at least one second, while the tab is visible. For content taller than the viewport, observe paragraphs or subsection markers rather than an impossible 50% of the entire section. Exclude content behind an active modal or inactive slide.
- **Visible duration:** aggregate how long the item remains eligible. This means on-screen exposure, not proof that the person read or looked at it.
- **Page scroll:** record 25/50/75/90/100% maximum depth once per page view, plus meaningful section exposure. Record short-page status separately so a non-scrollable page is not treated as fully read.
- **Scroll bursts:** after a short pause (initially 200ms), record direction, axis, container, start/end position and newly exposed item IDs. Keep document scrolling separate from carousel, gallery and plan scrolling. Do not write a database row for every native scroll callback.
- **Hover:** record deliberate mouse hover on meaningful targets, initially >=500ms, with target and duration. Merge rapid re-entry into bounded summaries. Do not log every mouse coordinate or every text span. Touch interaction and keyboard focus are separate event types.
- **Active time:** count visible-page time with recent interaction; pause while hidden or idle (initial recommendation: idle after 30 seconds). Keep total visible time and active time distinct. A final event is best effort, not a guarantee that every browser close will be captured.
- **Lifecycle:** separate click intent, modal open, navigation completion, successful business action and failure. A Book click is not a confirmed booking; a WhatsApp click is not proof of a sent message.
- **Errors:** capture safe error codes, affected component and request duration; no credentials, raw server exceptions or private form values in analytics.
- **Deduplication:** use client event IDs and page-instance sequence numbers; retries, React development effects and overlapping mobile/desktop components must not inflate counts.

## 4. Shared components on every page

| Area | Events and useful properties | Question answered |
| --- | --- | --- |
| Header/logo | logo activation; origin/destination route; pointer/keyboard input | Do visitors return home instead of progressing? |
| Desktop navigation | item exposure where useful; deliberate item hover; activation; completed route; navigation failure/loading duration | Which sections attract interest and actually receive traffic? |
| Mobile/tablet menu | open/close; open duration; category-strip scroll; category cards exposed; card activation; nav-item activation; last visible category | Do users discover categories beyond the first two? |
| Language selector/prompt | open; suggested locale; accept/dismiss; selected locale; successful switch/failure | Does language mismatch cause friction? |
| Account/trip controls | open/activation; anonymous vs verified identity; destination; empty/non-empty cart | Are visitors trying to save products or access their account? |
| Floating contact widget | launcher exposure; open/close; time open; choice of WhatsApp, contact form or chat | Which contact channel converts interest into intent? |
| Footer | footer exposure; service/legal links; phone, email, WhatsApp and social clicks; target channel and placement | Is the footer an important conversion path? |
| Global experience | first useful content ready; content/image load failures; safe navigation/network failures; active-time summary | Are people leaving because usable content never arrived? |

Event targets must use stable IDs such as header.villas or floating_contact.whatsapp, independent of translated wording or CSS classes. Record visible label/config version separately when needed to compare CTA wording. Preserve all six languages and nightclub mode.

## 5. Homepage /

Current collections are Villas, Transportation, Restaurants, Night Clubs, Beach Clubs, Experiences and Packs, followed by a contact CTA section.

| Element | Proposed events/properties |
| --- | --- |
| Hero loading | ready/fallback/error; time until usable; slide configuration/version |
| Hero slides | qualified slide exposure and visible duration; slide ID/index; auto vs arrow/keyboard change; video progress if a configured video is actually presented |
| Hero CTAs | exposure, deliberate hover, click/keyboard activation, destination and navigation completion; primary CTA vs Contact |
| Collection sections | section exposure and visible duration; category and order on page |
| Product cards | exposure, item ID/type, row and card position, price/currency shown, deliberate hover, activation and eventual product-page load |
| Horizontal collections | swipe/arrow/keyboard/other scroll; direction; newly exposed card IDs; furthest item reached; end reached; repeated exploration |
| View all | exposure and activation, distinguishing top button from final carousel card |
| Contact section | exposure and contact-form/chat activation; this is a CTA section, not an inline form |

Derived reports: percentage reaching each collection; product clicks divided by qualified product-card exposures; carousel end-card discovery; home-to-product conversion by source/device; active one-page sessions with contact intent versus arrivals with no observed interaction. Do not classify everyone with one page as a bounce or a bot.

## 6. Category pages /[category]

Applies to every implemented category and localized equivalent. The current catalog has a grid and pagination; no search/filter/sort controls were found in this component, so do not invent events for controls that do not exist.

- Catalog request start/success/error, category, result count, requested page and load duration.
- Qualified product-card exposure with product ID, absolute result position and pagination page.
- Deliberate card hover; card activation; successful destination page load.
- Rows/sections reached, scroll milestones, maximum result position exposed.
- Pagination control exposure, page selected and successfully loaded; previous/next or numbered activation method where present.
- Empty-result state and recovery navigation.

Reports: which displayed products are ignored, click rates by result position, mobile versus desktop discovery, and drop-off before later catalog pages.

## 7. Product pages /[category]/[slug]

Use product ID and product type as durable identity. Include unique code/slug as context; translated names and URLs alone are not stable identifiers. All product categories share this plan, with only events for sections/options actually available.

| Area | Proposed events/properties |
| --- | --- |
| Product load | request/ready/not-found/error; category, product ID, load duration and originating collection/catalog card |
| Main gallery | loaded-image exposure; image ID or stable media identifier/index; next/previous/thumbnail selection; swipe vs arrow vs keyboard; repeated viewing |
| Fullscreen gallery | open/close; starting image; each qualified image exposure and duration; image changes; maximum image reached; close method; load errors |
| Price | base-price exposure and shown amount/currency; driver-inclusive price/label exposure for villas; deliberate hover on those regions if useful |
| Description | visible paragraph/subsection IDs and duration; start/end reached; scroll through description; no claim that visibility proves reading |
| Highlights/details | section and individual feature exposure; deliberate mouse hover; no click event for a decorative tag unless it is genuinely clickable |
| Main CTAs | individual exposure, hover and activation for Book, Add to trip, plans/service options, Contact and Chat; exact placement |
| Sticky mobile booking | when it appears/disappears, exposure and activation; distinguish it from the main booking CTA |
| Back to category | activation and destination |

Reports: gallery engagement before contact; images most often revisited; description reach; base versus driver-price exposure; plan discovery; which CTA placement works; users engaging deeply without submitting a request.

## 8. Plans/service-options modal

- Modal open/close, entry CTA, product ID/type and available plan count.
- Each qualified plan exposure: plan ID, index, price/currency, description and inclusion-list reach, visible duration.
- Plan change with method: swipe, arrow, keyboard or desktop scrolling. One settled transition per change, not every scroll callback.
- Horizontal progress/end reached; vertical scroll inside a plan separately from switching plans.
- Deliberate hover on plan cards and Request this option; keyboard focus separately.
- Request-option activation, chosen plan ID and resulting booking-panel open.
- Close method (button/Escape/backdrop where supported), last plan and whether any request was started.

For desktop, several plans can be visible simultaneously: record each qualifying card, not only the component's selected index. Hidden mobile and desktop renderings must not produce duplicate impressions.

## 9. Booking panel, Add to trip and trip page /trip

**Product booking panel:** trigger activation; actual open/close; selected plan; field started/completed/validation failure by field name only; date-selection completed/cleared; country selector used; submit attempt; request duration; backend-confirmed request success with ContactRequest ID; safe failure category. Link to product and entry plan. Form abandonment is derived when a started form has no observed success; exact browser-close abandonment is not guaranteed.

**Add to trip:** open/close; plan/date selection state; confirm attempt; backend/store success or failure; duplicate-item outcome where applicable. Keep the click separate from actual saved-cart state.

**Trip page:** empty/non-empty view; visible product items; plan/date edits (field and completion state); item removal attempt/success; client-information form start/progress; submit attempt/validation/error; backend-confirmed combined request with TripCart/ContactRequest IDs and item count.

Do not duplicate names, email addresses, phone numbers or free-text messages into Interaction metadata. Keep submitted personal information in its existing business record and correlate by record ID. Prefer duration-of-stay/lead-time buckets over copying travel dates into analytics unless exact dates are explicitly required.

## 10. Contact /contact

- Form exposure and visible contact-information sections.
- First interaction with form, first focus per field, completion state, safe validation code and correction; no typed characters or values.
- Request-type selection (General/Product request/Support/Partnership or the actual configured enum), country selector used, optional phone completion state.
- Submit attempt, frontend validation result, request duration, server-confirmed ContactRequest ID, failure and retry.
- Form start-to-submit time; last field reached before leaving; partial progress without storing the message/subject text.
- Contact-channel outbound actions where present, with placement and destination category.
- Repair missing Visitor/Journey correlation on the Contact request before claiming a complete visitor-to-contact funnel.

## 11. Services /services and About /about

**Services:** category-card exposure, position, hover and activation; category reached; section scroll and contact CTA interactions. Respect the current intentional exclusion of SPA and Packs on this page. Do not change navigation/layout as part of tracking.

**About:** hero exposure; service/principle section exposure and duration; Explore services, Contact and Chat CTA exposure/activation; footer reach. Record real links/actions only, not fictional accordions or tabs.

## 12. Chat /chat and /chat/[chatId]

Track entry placement; conversation-list exposure; new-chat intent and server-confirmed conversation creation; existing conversation opened; input started (boolean); send attempt/success/failure; first visitor message and first advisor response timestamps; reconnect/failure where observable; reading older message ranges (message IDs only); minimized/closed state only where a corresponding control exists.

Link to Chat/ChatMessage IDs without copying message bodies into analytics. A visit to /chat is not a created chat, and a focused input is not a sent message. Derive response time from existing server message timestamps when possible rather than duplicating existing message records.

## 13. Authentication, account and recovery pages

**Auth modal:** open/close and entry placement; mode changes; Google vs password action; safe validation categories; submit attempt and server-confirmed success/failure; verification-required state. Never record password, access token, OAuth credential or account-enumeration details.

**Account /account:** requested section, anonymous redirect versus verified load, section change, edit started, save attempt/success/failure, communication preference change by channel/state and outcome, logout. Auth-at-event remains historical evidence even if earlier anonymous interactions later acquire an Individual ID.

**Verify, forgot-password, reset-password:** screen state, submit/result/retry, safe error category and duration. Normalize secret-bearing paths/queries; never log verification/reset tokens or password values. A reset request success must not expose whether an email belongs to an account.

## 14. Legal /terms and payment /pay/[token]

**Terms:** anchor navigation, qualified exposure of Terms/Privacy/Refund/Consent/Guest responsibilities, section time and outbound Contact CTA. Exposure is not proof of legal acceptance; only a real explicit acceptance action could be recorded as acceptance.

**Payment:** normalize route to /pay/:token. Record request-screen loading/ready/unavailable; retry; payment CTA activation; checkout creation success/failure; return/cancel; pending verification; server-confirmed payment completion. Link using internal order/payment IDs, never the public payment token, checkout URL, session secret, card data or bank details. A browser success screen or checkout click alone is not payment confirmation.

## 15. Proposed Interaction object and correlation

Interaction should be a first-class Data Hub object, linked from Visitor, Individual, Page Visit and relevant product/business records. It should not be placed under Operations.

| Group | Proposed fields |
| --- | --- |
| Identity | id/client event ID (unique), visitorId, journeyId, nullable individualId, sessionId; server verifies individual identity |
| Page correlation | pageVisitId when available, client page-instance ID, normalized route/page type, actual locale, component ID, target ID, parent/container ID |
| Event | event name/version, frontend or backend producer, client sequence, input method, outcome, safe metadata |
| Content | productId/type, planId, stable image reference/index, collection/category, placement/position, optional related ContactRequest/Chat/TripCart/Order ID |
| Time | occurredAt (browser UTC), receivedAt (server UTC), elapsed monotonic time/sequence for ordering, durationMs where meaningful |
| Exposure/scroll | container/axis, eligible visible fraction, qualified duration, from/to positions, maximum depth, newly exposed item IDs |
| Context | entry-source/session context reference, device/browser context, viewport at event, authentication-at-event, environment and application version |

Use typed payloads per event rather than unrestricted arbitrary JSON. Keep metadata small; use indexed columns for common filtering. Do not copy full source/device profiles to every row when a linked visit/session context can provide them; capture viewport/input changes when they occur.

Generate the page-instance ID before the PageVisit API responds, so early clicks are not lost or attached to the next page. Server-verified outcomes should reference the originating interaction/request correlation ID. Reuse the existing verified journey-claim boundary on login/Google sign-in to attach eligible anonymous Interaction rows; do not claim an entire shared browser's history or assign identity solely from a typed email.

## 16. Example history

One page-view instance could show this sequence, with times in GMT:

1. Entry from Instagram, paid campaign, mobile/touch, homepage.
2. Hero ready; slide exposed for 3.2 seconds.
3. Villas collection exposed; Villa A and Villa B cards qualified.
4. Horizontal swipe exposed Villa C and Villa D.
5. Villa D activated; product navigation completed.
6. Fullscreen gallery opened; images 1, 2 and 4 exposed, with image 4 revisited.
7. Plans opened; options 1 and 2 exposed; option 2 requested.
8. Booking panel opened; form started; email validation error corrected.
9. Submit succeeded; ContactRequest ID linked.

This is an illustrative future report, not a reconstruction of a real visitor.

## 17. Administration, reporting and delivery

- Data Hub -> Interactions: paginated rows, GMT times, source/device/person/page/product/event/outcome filters, and direct links to related records.
- Visitor and Individual activity: chronological history showing exposure, scroll, hover, click and verified conversions; distinguish browser event time from receipt time.
- Reports: source/device-to-engagement funnel; homepage collection reach; product-card exposure-to-click rate; gallery and plans usage; form friction and completion; active one-page sessions; meaningful interaction time.
- Query Agent: include Interaction and the required joins so natural-language investigations can use the new data.
- Keep original events when filtering internal traffic or suspected automation. Automation confidence is a filter/annotation, not proof of personhood and not a reason to silently delete evidence.
- Batch events in small bounded payloads; throttle/aggregate scroll and hover; deduplicate retries server-side; isolate tracking failures from navigation, forms and checkout.
- Flush pending batches on page/tab lifecycle changes where possible. The current app uses cross-origin APIs and bearer/header-based identity; sendBeacon cannot simply replace this transport because it does not support those custom headers. Choose a compatible keepalive/batch endpoint design.
- Do not send all Interaction history to TikTok or OpenAI by default. This object is the application's own analytics; AI reporting can continue to generate SQL from metadata without receiving raw visitor rows.
- Set a bounded raw-event retention period and aggregation policy before enabling high-volume logging. No extra paid analytics service is required for the proposed design.

All items above are proposed scope, including detailed desktop hover and mobile/nested-scroll tracking. Suggested delivery order is identity/source correlation, global event collection, priority pages/components, remaining routes, then administration/reports. This order is not a restriction of the requested full scope.

## 18. Acceptance checks for a later implementation

- Mobile/desktop/tablet and all six languages; normal and nightclub themes; touch, mouse and keyboard input.
- Hidden/preloaded slides and offscreen cards produce no qualified exposure. A click before the one-second threshold still records the action.
- Open gallery/plans modal pauses exposure of covered page content. Nested scroll identifies the actual image/plan rather than only document depth.
- Resizing changes viewport context, not the human/visitor identity. Browser Back restores are distinguishable from first entry.
- Anonymous-to-authenticated history is linked at the correct journey boundary and remains isolated from a second person's login.
- Source persists through navigation and request creation; Contact, booking and trip conversions link to the correct browser/journey.
- Retries and duplicate UI renders do not duplicate interactions. Clock skew and out-of-order API arrival do not silently rewrite event order.
- No credentials, payment tokens, private form values or chat bodies enter analytics payloads. Server confirmation is required for business success events.
- Slow networks, blocked tracking, failed batches and offline transitions do not break business actions; existing counts remain comparable or are explicitly versioned.

## Reference documentation

- [MDN: timing element visibility](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API/Timing_element_visibility) explains combining viewport exposure with tab visibility.
- [MDN: hover capability](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) distinguishes input capability from assumed device category.
- [MDN: sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) explains analytics delivery constraints and lifecycle recommendations.
