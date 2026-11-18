# Local Marrakech supply and conversation continuity

This update inserts records directly into the local `kechconcierge` database, using normal product names and codes (no `TEST` label): **12 experiences, 3 villas, 3 vehicles and 33 active plans**. Existing records, prices and images are preserved. No schema or environment-variable changes are required.

New experience descriptions, plan inclusions, locations and pricing explanations are authored in all six languages. The rates and inclusions are representative local-development data for testing, not supplier-confirmed offers. Existing catalog media is reused as representative imagery; it is not new destination-specific photography. Availability remains a human-advisor decision.

| Experience | Shared price/person EUR | Private group EUR | Private group limit |
|---|---:|---:|---:|
| Ourika Valley & Setti Fatma | 55 | 210 | 6 |
| Imlil Atlas Village Walk | 70 | 250 | 6 |
| Toubkal Guided Mountain Trek | 290 | 980 | 4 |
| Jbilet Sunrise Balloon & Breakfast | 195 | 1150 | 6 |
| Agafay Camel Ride at Sunset | 45 | 180 | 4 |
| Agafay Dinner Under the Stars | 85 | 340 | 4 |
| Ouzoud Waterfalls Day Trip | 65 | 270 | 6 |
| Essaouira Coastal Escape | 75 | 290 | 6 |
| Aït Ben Haddou Heritage Day | 90 | 340 | 6 |
| Palmeraie Camel Ride & Tea | 35 | 140 | 4 |
| Marrakech Medina & Souks Walk | 30 | 110 | 6 |
| Moroccan Kitchen & Market Workshop | 70 | 260 | 4 |

Each experience has two actual related plans with explicit inclusions, a duration, pricing unit and group capacity. Imlil village walking is distinguished from the demanding two-day Toubkal trek. The overall balloon outing duration is distinguished from flight time. Meals, transfers, optional activities and weather restrictions are stated separately rather than implied by a generic description.

Villas: Villa Grenadine (8 guests, 420/510 EUR without/with driver), Villa Olive Terrace (10 guests, 610/710 EUR), Villa Atlas Gardens (14 guests, 980/1180 EUR). Each has native translated tags and capacity/bedroom details.

Vehicles: Executive City Sedan (3 passengers/2 bags), Marrakech Group Minibus (16 passengers/12 bags), Atlas Excursion 4x4 (4 passengers/3 bags). Each has an airport, half-day and full-day plan. Airport transfers are one-way, while private hire states four or eight hours; this avoids implying a return airport journey or an all-day hire in the airport price.

## Why recommendations could cycle

The old search always started with the first matching records and supplied no explicit exclusion list. The recent conversation transcript was limited to 31 messages. The new worker reads the product-card history for the entire same chat and derives a compact, deduplicated memory from it. This remains available even when old turns leave the recent transcript.

The model interprets requests for alternatives and calls `search_products` with `exclude_previously_shown=true`. Exclusions are applied in the database **before the result limit**, allowing later records to be found. The policy also rejects recycled cards in `new_options` mode and in an alternatives-only search. Explicitly returning to a named or numbered old choice remains allowed in `revisit` mode. Exhausted searches should receive an honest answer and a question about changing preferences, rather than cycling back or inventing supply.

This does not replace semantic intent understanding with a keyword tree. The model selects the intent/mode, while the server validates references and enforces the corresponding exclusions.

## Short company overview

Questions about what Moorish Concierge does are explicitly in scope. Cécile should briefly explain villas, drivers/transfers, restaurants, beach clubs, nightlife and excursions, then ask at most one friendly question. This does not require a long product list, cards or a Contact referral.

## Local scripts and verification

From `apps/website-api`, `npm run expand:marrakech-catalog` adds only missing codes and is guarded to the localhost development database. It does not run at deployment/startup or reset data. Re-running it skips existing products instead of overwriting content-manager edits.

Offline: `node --import tsx --test test/chat-agent.policy.test.ts test/chat-agent.recommendations.test.ts test/chat-agent.continuity.test.ts`.

Optional live-model checks with synthetic prompts and public local product data only:

```powershell
$env:RUN_CHAT_AGENT_LIVE_TESTS='1'
node --import tsx --test test/chat-agent.continuity-live.test.ts
```

The live test runs repeated alternatives, an explicit return to the first option, English/French service overviews and catalog exhaustion. It also checks retrieval beyond the first twelve records. It does not create client chats, send email or confirm availability.

Destination background was checked against Moroccan National Tourism Office material: [official Morocco overview](https://www.visitmorocco.com/sites/default/files/atoms/files/maroc-ang.pdf), [Azilal and Ouzoud](https://www.visitmorocco.com/en/travel/azilal/nature), and [official desert/oasis itinerary](https://www.visitmorocco.com/sites/default/files/atoms/files/maroc_desert_oasis_150226_il_en.pdf). These sources support destination context, not the authored local prices, inclusions or departure availability.
