# Development and preproduction chat concierge

New website/mobile conversations are owned by Cécile in local development and preproduction (`NODE_ENV=test`). She introduces herself once as Cécile, the AI Assistant, and then stays focused on the request without repeating that introduction. Existing conversations already assigned to a person remain manual. The existing OpenAI and Resend keys in `apps/website-api/.env` are reused; no new environment variables are required.

The feature requires an existing `OPENAI_API_KEY` and a valid PostgreSQL `DATABASE_URL`. Local/development mode additionally requires a loopback database hostname. The existing preproduction mode, `NODE_ENV=test`, allows a remote PostgreSQL database. Production keeps the manual chat behavior. No new environment variables are introduced.

The agent uses `gpt-6-sol` through the Responses API. Intent is determined by the model and its tools, not a keyword-routing tree. Translation and Query Agent model settings are unchanged.

Cécile uses a warm, cheerful, smiling and friendly tone, with an occasional natural smile emoji. She stays concise, avoids repeated greetings and introductions, and treats complaints with appropriate care.

## Behavior

- Public product tools retrieve active villas, transportation, beach clubs, nightlife, experiences and restaurants. Product details and active plans use the same public data mapping as the website; internal supplier costs and unpublished records are excluded.
- Prices must match retrieved product/plan prices. The agent cannot authorize discounts or confirm availability/reservations.
- Cécile never initiates availability discussion or asks for stay dates. When the client raises availability/reservations or persistent price concerns, she explains Asmaa’s role and asks permission to transfer the chat. Product follow-ups and refusals keep Cécile assigned. Only explicit agreement creates a related Product Request, queues an email notification and assigns the chat to the active Asmaa Mounadi user (`mounadi0711@gmail.com`).
- During development and preproduction, the email recipient is fixed to **taoufiq.benallah@gmail.com**. The real sender refuses other recipients. The email includes the request summary, products, supplied dates/details, known client identity, recent conversation and administration chat link.
- Before any transfer, require a full name (first and last name) and at least one valid contact method: email OR phone. Reuse details already supplied or in the known profile. Explain that Asmaa needs a way to reach the visitor if they leave the website. Both the policy/tool layer and final commit enforce this requirement. These details are saved on the related Contact Request and included in Asmaa’s notification. An email-only or phone-only visitor is supported; never require both.
- Partnership, support, complaint and other non-product requests get a clickable localized Contact link. These do not transfer ownership or create an availability notification.
- After human takeover the agent stops. The ownership check is repeated inside the transaction that publishes the response, preventing late model responses after an advisor replies.

## Local startup and checks

The migration `20261117000000_chat_agent` has been applied to the local database. For another development checkout, run the normal database generation/migration commands before starting the API:

```powershell
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

Open `http://localhost:3000/chat` (or a localized `/fr/chat`, etc.) and start a **new conversation**. Try asking about a real product, its plans, availability on specific dates, repeated price objections, or a partnership/support request. Check the existing Chats and Contact Requests records in administration after a handoff.

For broader testing, see [the development test catalog](CHAT_AGENT_TEST_CATALOG.md): 20 additional fictional products, 33 plans, exact expected prices and suggested conversations. The additive seed preserves existing products and is restricted to the local development database.

The [Marrakech expansion](MARRAKECH_CATALOG_EXPANSION.md) adds twelve more experiences plus three villas and three vehicles as normal local records. It also documents persistent recommendation memory, fresh-alternative search and concise company overviews.

From `apps/website-api`, mocked/local-database tests send no email and make no OpenAI calls:

```powershell
$env:RUN_LOCAL_DB_TESTS='1'
node --import tsx --test test/chat-agent.policy.test.ts test/chat-agent.integration.test.ts
```

Semantic tests use the real OpenAI API and public local products, with synthetic visitor messages. They do not create contact requests or send email:

```powershell
$env:RUN_CHAT_AGENT_LIVE_TESTS='1'
node --import tsx --test test/chat-agent.live.test.ts
```

The following separate manual check requires the local API running on port 3001. It sends **one real test email** and retains its labeled local records for inspection. Run it only when that email is intended:

```powershell
$env:RUN_CHAT_AGENT_EMAIL_SMOKE='1'
node --import tsx test/chat-agent.email-smoke.ts
```

## Persistence and failures

`ChatAgentTask` stores one queued turn per incoming message. A database claim serializes replies per chat, bounds outstanding messages and avoids duplicate replies across workers. Interrupted work is recovered after six minutes; failed model calls retry up to three attempts, then show a localized Contact fallback. A turn allows up to twelve model/tool rounds so multi-category suggestions have room to retrieve their real details.

`ChatAgentHandoff` relates the chat to its Contact Request and acts as the email outbox. Ownership, Contact Request, outbox entry and AI reply commit together. A failed email does not undo the human assignment: delivery retries up to five attempts with Resend idempotency keys. `SENT` means Resend accepted the email; it does not guarantee inbox delivery. Failed deliveries retain `lastError` for investigation. These records do not add a new administration section.

Human advisor replies now update ownership and create the message in the same transaction. The chat layout is preserved; the frontend only gains safe rendering of generated Contact/product links.

## Visual product recommendations

Migration `20261117010000_chat_product_recommendations` adds nullable `ChatMessage.recommendations` JSON. It is applied locally. Generated replies store server-built product cards with canonical product links, catalog images and exact published base, driver-inclusive or selected-plan prices. The model only selects retrieved product references and price-source IDs; it cannot provide card URLs, images or arbitrary prices. Old messages without recommendations continue to render as plain messages.

Cards use a compact horizontal collection (approximately 200px per card), native touch scrolling, keyboard scrolling and desktop arrow controls. A single card can also swipe through its catalog images. Product cards and product text links open the public product page in a new tab with `noopener noreferrer`; the CTA is “Book now”, localized across all six languages. Clicking a card does not confirm a booking, charge a payment or transfer ownership by itself.

Cécile asks concise questions when understanding a broad need. Once showing cards, she normally uses one short sentence instead of duplicating product descriptions. Explicit detail requests can still receive a fuller answer. Mixed villa/transport/restaurant/beach-club suggestions are individual recommendations, without an invented bundle price or availability guarantee. Display order and product references are included in conversation history so follow-ups such as “the second one” retain their context.

The stored cards are a snapshot of the published offer when the message was generated. Current details and availability are checked on the linked product page or through the advisor. Media URLs are specific to the database environment; no local fixture image is hardcoded in the website component.

The temporary IPv6 connection workaround used during the previous browser check has been removed. The normal local website/API addresses remain `http://localhost:3000` and `http://localhost:3001`. No ports or production connection settings were changed; the separate Salesforce project is managed independently by the user.


## Consent before advisor transfer

A separate, narrowly scoped semantic check uses the same model and existing OpenAI key to verify the latest client message in its conversational context before the handoff tool can prepare side effects. Dates, availability enquiries, and a yes about a pool or product choice are not transfer consent. Missing/ambiguous consent or verification outages fail closed. The commit path also rejects an unverified handoff. No new environment variables or database migration are required. The chat history itself supplies the conversation context; no keyword-based intent router was added. After confirmed transfer, Asmaa owns the chat and automated replies stop.

`test/chat-agent.consent-live.test.ts` tests broad villa discovery, client-initiated availability, product questions before transfer, explicit agreement, and an unrelated yes. It uses the live model and local public catalog but never persists a chat, sends email or transfers actual ownership.

A final commit-time check also refuses an otherwise approved handoff if a newer client message has arrived while generation was running. The newer question/cancellation is handled by its queued turn, without publishing a false transfer confirmation. The local persistence test covers this race without creating an email job.

When a client already agreed to transfer and then supplies requested missing contact details, the consent check recognizes the earlier agreement. It does not ask for agreement again unless they withdrew/deferred it or switched back to product questions. A client supplying only contact details without any prior consent still cannot be transferred. No new database fields or environment variables were added.

## Preproduction deployment

Deploy the updated website-api with the existing NODE_ENV=test, OPENAI_API_KEY and remote DATABASE_URL. Testing handoff notifications still go only to the authorized test address; test subjects use [TEST]. Existing manually assigned conversations remain manual. Start a new conversation to test Cécile after redeployment. Production remains disabled.
