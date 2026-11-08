# Query Agent and visitor attribution

Deploy both visitor and business-coverage database migrations before starting the updated APIs. Deploy Website API, Admin API, Website and Admin for this feature.

## OpenAI

The existing Admin API `OPENAI_API_KEY` is reused. Query Agent and text translation reuse the existing `OPENAI_TRANSLATION_MODEL`, with the existing `OPENAI_MODEL` fallback. Image descriptions reuse `OPENAI_ALT_MODEL`, then `OPENAI_MODEL`. The default model is `gpt-6.1-sol`. No extra model environment variable is introduced. GPT-6.1 requests omit unsupported sampling parameters; older model overrides retain their temperature settings. No visitor records or report rows are sent to OpenAI: the generator receives reporting column metadata, the administrator's request and, for a follow-up, the previous prompt and SQL. OpenAI response storage is disabled.

## Reporting

Only authenticated ADMIN users can use Query Agent. Each user's saved queries and execution history are scoped to that user. Query Agent covers every current application entity, including the independent product catalog, plans, images, business identities, messages, orders, payments, email records and automation metadata. Tables and fields keep their original names, for example "Villa"."createdAt". PostgreSQL parsing restricts queries to these business entities and ordinary SQL functions. A dedicated query_agent schema exposes credential-free projections; execution resolves unqualified entity names only in that schema, never against raw public tables. Existing reporting_* queries remain compatible. Every execution is validated again, runs in a read-only transaction, and has a five-second statement timeout. Results are paginated at 50 rows. Queries, prompts, timestamps, SQL snapshots, execution duration, status, errors and returned row counts are saved; report rows are not saved. Date calculations use UTC/GMT.

The query_agent schema excludes passwords, reset and verification tokens, payment access links, push credentials and raw webhook/action payloads. Business messages and form comments are queryable. Application database credentials remain server-side.

## Visitor meaning

A Visitor identifies a browser installation, not a guaranteed unique human. Names, email and phone remain empty until provided by a form or authenticated individual. VisitorIdentity links multiple individuals to a shared browser; activity ownership follows existing VisitorJourney boundaries. Individual `source` remains its registration/system origin, while `acquisitionSource` records the first known marketing source.

`?source=tiktok`, `?source=instagram`, `?source=facebook`, and `utm_source` are supported. The source persists for the tab session. Visitors retain their first source separately from the latest source; PageVisit stores attribution for that visit. Campaign and medium, landing page, referrer, browser, language and device category are captured where available. Backfill uses only previously stored records. Historical unknown sources stay unknown; no earlier identities or sources are invented.

## Checks

- Admin API: `npm run build`, then `node --test test/queryAgent.test.mjs`
- Optional local database integration: set `RUN_LOCAL_DB_TESTS=1`, then `node --test test/queryAgent.integration.test.mjs`
- Website API visitor tests: set `RUN_LOCAL_DB_TESTS=1`, then `node --import tsx --test test/visitor-profile.test.ts`

Database tests refuse non-local database URLs and remove their own fixtures.

## Page visit investigations

Apply `20261108000000_page_visit_diagnostics` and deploy Website, Website API, Admin and Admin API. No additional environment variables are required. Page Visit details expose server-verified authentication, browser-reported account outcome, previous page, clicked HTTP link when captured, navigation type, browser timestamp/language/automation signal and request origin/fetch-site headers. Existing IP, user agent and referrer remain available. Diagnostic navigation URLs keep only approved attribution/section query parameters. Passwords, access tokens and email parameters are not collected in these new navigation fields.

`visitDate` is server receipt time, while `clientVisitedAt` is the browser's reported event time. Network scheduling can reverse receipt order, so compare both times and previous-page context. Browser signals and outcome reports are evidence, not proof of a human or a bot. Account outcomes begin as `REQUESTED_NOT_CONFIRMED`; the account guard reports `REDIRECTED_UNAUTHENTICATED`, `ACCOUNT_DATA_LOADED` or `ACCOUNT_LOAD_FAILED`. The existing unauthenticated account flow redirects to the localized homepage. Successful-load updates require a valid token matching the visit's individual. Updates require the matching browser/journey and a visit received in the preceding five minutes. Historical evidence fields stay null. Visitor activity links to the full Page Visit record.

Check: in Website API run `RUN_LOCAL_DB_TESTS=1 node --import tsx --test test/page-visit-diagnostics.test.ts` (set the environment variable using your shell's syntax).
