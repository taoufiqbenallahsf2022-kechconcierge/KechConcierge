# Cécile development test catalog

Added locally: **20 products, 33 active plans**. Every title begins with `TEST ·` and every code begins with `qa-agent-`. Existing products are preserved. These are fictional test offers with illustrative EUR prices, not real commercial offers or confirmed availability.

Descriptions, plan descriptions, inclusions and native tags are provided in English and French. The other four locales use the application's existing English fallback; Cécile can answer questions in the visitor's language. Villas and restaurants use their existing structured tag fields. Other categories store their characteristics in product descriptions and plan inclusions, without a schema change.

Images are reused from existing records in the same category in the local database. Test products have display orders above the homepage's featured range, so they appear in their category catalog without replacing featured products.

| Category | Test product | Published prices in EUR | Distinct facts to investigate |
|---|---|---|---|
| Villa | Villa Saffron | 320/night; 400 with driver | 3 bedrooms, 6 guests, gated pool area, no breakfast; seven-seat van |
| Villa | Villa Palm Serenity | 750/night; 850 with driver | 5 bedrooms, 10 guests; breakfast, seasonal pool heating; van carries only 7 at once |
| Villa | Villa Atlas Horizon | 1100/night; 1250 with drivers | 6 bedrooms, 12 guests; padel, cinema; two vans; no heated pool |
| Villa | Riad Jasmine | 180/night | 2 bedrooms, 4 guests, ages 12+; steep stairs; no published driver package |
| Transport | City Sedan | Airport 28/vehicle; half day 90; full day 155 | 3 passengers, 2 large bags; one-way airport transfer |
| Transport | Family Van | Airport 45/vehicle; half day 130; full day 220 | 7 passengers, 7 medium bags; child seats on request |
| Transport | Executive Electric | Airport 55/trip; 45/hour; full day 320 | 3 passengers, Wi-Fi; hourly hire minimum 2 hours |
| Transport | Atlas Minibus | Airport 85/vehicle; Ourika 280/day; Essaouira 420/vehicle | 15 passengers, 12 bags; return excursion versus one-way intercity transfer |
| Beach club | Azure Family Club | Adult access 45; child access 25; adult lunch package 70 | Children 4–11; age 12+ adult; child plan excludes lunch |
| Beach club | Dune Quiet Retreat | Day 75/person; sunset dinner 120/person; cabana 260 | Adults 18+; quiet, no DJ; heated November–February; cabana for 4 |
| Beach club | Oasis Social Club | Sunbed 60; lunch 95/person; cabana 360 | Adults 18+, resident DJ, unheated pool; cabana for 6 |
| Nightclub | Velvet Lounge | Entry 30/person; table 300 | Minimum age 21; table for 4; dress code; entry excludes drinks |
| Nightclub | Pulse Rooftop | Entry 25/person; table 240 | Minimum age 18; table for 6; terrace weather restrictions |
| Experience | Atlas Kitchen Workshop | Shared 65/person; private 280/group | Minimum age 8; shared 2–8 guests, private 1–4; different market-walk inclusions |
| Experience | Desert Buggy Trail | Shared 90/person; private 155/group | Driver 18+ with licence; passenger 12+; private buggy for 1–2 |
| Experience | Sunrise Balloon Journey | Shared 210/person; private 1250/group | Minimum age 6; weather-dependent; private basket up to 6; transfers/breakfast |
| Experience | Medina Photo Walk | Classic 110/group; golden hour 180/group | 20 versus 40 edited photos; 72-hour delivery; stairs; different group capacities |
| Restaurant | Garden Table | Set menu from 35/person | Family friendly, vegan options, garden, allergen-free preparation not guaranteed |
| Restaurant | Ember Rooftop | Set menu from 57/person | Three-course dinner, stairs without lift, drinks excluded |
| Restaurant | Chef’s Counter | **No published price** | Private tasting for 2–8 adults, 18+; agent must not invent a quote |

## Suggested conversations

Start a new conversation at `/chat` or a localized chat page. First ask factual questions, then follow up naturally to check that Cécile remembers the context and introduces herself only once.

1. “Compare Villa Saffron and Villa Palm Serenity for a family of six. Which includes breakfast and pool heating?”
2. “What does Palm Serenity cost with a driver? Can all ten of us travel together?”
3. “Does Riad Jasmine have step-free access and a driver-inclusive rate?”
4. “We are seven with seven suitcases. Which transport fits? What is the Family Van airport price?”
5. “Is the Atlas Minibus Essaouira transfer a return trip? Does Ourika include a guide and lunch?”
6. “At Azure Family Club, what does a seven-year-old pay? Is lunch included?”
7. “Compare Dune Quiet Retreat and Oasis Social Club for four adults who want a quiet, heated pool.”
8. “Is the private cabana price per person or for the whole cabana?”
9. “Can a nineteen-year-old visit Velvet Lounge? What about Pulse Rooftop?”
10. “For two people, is the Desert Buggy private option charged per person? Do we need a driving licence?”
11. “What is included in the private Atlas Kitchen workshop? Does it include the market walk?”
12. “How many photos do we receive from the golden-hour walk, and when?”
13. “Can you give me Chef’s Counter’s starting price?” — no invented price.
14. Repeat any question in French, Spanish, Italian, German or Portuguese.
15. “Is Villa Palm Serenity free on 20–22 December?” — creates a contact request, assigns Asmaa and emails the authorized development test address.
16. Ask a product price, object once, then insist on a reduction — published price stays unchanged; insistence is handed to Asmaa.
17. “I want to propose a partnership / file a complaint” — clickable Contact link, no availability handoff.

Handoffs send real development test notifications to **taoufiq.benallah@gmail.com**. Ordinary catalog questions do not send email. Use a new conversation to test the AI again after a chat has been assigned to Asmaa.

## Reusing the seed

From `apps/website-api`:

```powershell
npm run seed:chat-catalog
```

This additive script refuses a remote database or a non-development environment, requires the local `kechconcierge` database, and skips fixture codes already present. It never resets the existing catalog or runs automatically at startup/deployment. It verifies all product/plan prices and inclusions through the public retrieval services and checks that existing product records were unchanged.

Optional real-model catalog checks (synthetic prompts, no emails):

```powershell
$env:RUN_CHAT_AGENT_LIVE_TESTS='1'
node --import tsx --test test/chat-agent.catalog-live.test.ts
```
