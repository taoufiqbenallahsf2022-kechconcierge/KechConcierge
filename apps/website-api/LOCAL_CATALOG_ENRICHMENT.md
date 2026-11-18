# Existing local catalog content update

Updated the existing 16 public products and 19 existing plans directly in the local development database. This is separate from the additional `qa-agent-` fixtures. Product names, codes, IDs, published prices, internal costs, pricing units, durations, images, active flags and ordering were preserved.

The update writes tailored subtitles and descriptions in all six languages, native villa/restaurant tags and details, and specific plan descriptions assembled from each plan's actual title, duration, pricing unit, route and included options. No new schema or environment variables are needed.

## Corrections and explicit decisions

- Villa Atlas View: the user confirmed **12 guests**. Removed the conflicting `CapacityOK: 15` detail, retained unrelated details, and corrected the driver-inclusive label without changing its 850/950 EUR prices.
- Range Rover evening service: restored the meaningful evening city service title from its `evening` code and service type. Removed `xx`/`okok` edit leftovers from the driver and water inclusions. The existing 75 EUR price and 240-minute duration remain.
- Sunset-and-dinner plans: changed the inconsistent “three-course lunch” inclusion to “three-course dinner” to match the existing selected plan.
- Nightclub priority-entry options: removed unconditional “confirmed” wording. Catalog content describes the service; admission and dates still require confirmation.
- Agafay VIP Experience: the user identified this as an incomplete mock plan and requested suggested inclusions. Its existing 345 EUR adult price and plan ID/code are preserved. Representative local-development inclusions are pool access, a reserved premium sunbed and towel, three-course lunch, one soft drink, a concierge host and return transfers within Marrakech. These are proposed test inclusions, **not independently verified supplier inclusions**.
- All other prices, including Agafay's existing 510 EUR day pass, remain exactly as stored. This update does not validate those commercial rates against supplier pricing.

Villa facts use existing stored amenities and capacities. Unknown room counts, vehicle capacities, driver hours, table sizes, diets and activity age limits have not been invented; descriptions ask for confirmation where needed. Generic names such as The Atlas Table and Secret Garden Dining retain descriptions grounded in their existing catalog fields rather than assumed supplier amenities.

## Official venue references checked on 17 November 2026

These references support venue background and corrected locations, not the prices or packages sold in this local catalog:

- [Beldi pool-day setting and dining](https://beldicountryclub.com/restaurants); [official address in Cherifia](https://beldicountryclub.com/contact). Corrected its existing Palmeraie location to Km 6, Route de Barrage, Cherifia.
- [Dar Zellij restaurant, official operator](https://marrakech-riads.com/en/restaurant-dar-zellij/): restored Medina house and Moroccan cuisine.
- [Nomad official site](https://nomadmarrakech.com/): modern Moroccan cooking and seasonal ingredients.
- [Theatro, official Es Saadi page](https://www.essaadi.com/en/theatro-night-club): theatre setting, DJs and staged performances.
- [555 Famous Club official contact page](https://555marrakech.com/en/contact-us/): corrected the existing Hivernage location to 555 Hotel Clubbing, Boulevard Mohamed VI.

## Backup and verification

Before writing, the script saves a full catalog-only snapshot under `apps/website-api/.local/catalog-before-enrichment-<timestamp>.json`. This directory is ignored by Git.

`src/scripts/enrichLocalCatalog.ts` refuses remote databases and non-development environments, requires the local `kechconcierge` database, and updates only the named existing products. It verifies IDs, prices, images, units and public product retrieval in every language after the transaction.

Running it again reapplies this authored content, so it should **not** be used after manual content changes unless intentionally replacing them. It is not part of startup, deployment or the general seed.

```powershell
# From apps/website-api; inspect only:
node --import tsx src/scripts/enrichLocalCatalog.ts

# Explicitly reapply the authored local content:
npm run enrich:local-catalog

# Optional semantic tests: synthetic prompts, public catalog, no emails:
$env:RUN_CHAT_AGENT_LIVE_TESTS='1'
node --import tsx --test test/chat-agent.existing-catalog-live.test.ts
```
