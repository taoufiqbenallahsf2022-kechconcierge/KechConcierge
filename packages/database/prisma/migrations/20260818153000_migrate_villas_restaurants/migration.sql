-- Preserve the two legacy domains whose existing content remains authoritative.
INSERT INTO "Villa" (
  "id", "uniqueCode", "priceEuro", "order", "thumbnail",
  "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES",
  "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES",
  "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES",
  "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES",
  "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES",
  "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES",
  "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES",
  "imageAlts", "isActive", "createdAt", "updatedAt"
)
SELECT
  "id", "uniqueCode", "priceEuro"::numeric(12,2), "order", "thumbnail",
  "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES",
  "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES",
  "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES",
  "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES",
  "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES",
  "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES",
  "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES",
  "imageAlts", "isActive", "createdAt", "updatedAt"
FROM "Product" WHERE "type" = 'VILLA'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Restaurant" (
  "id", "uniqueCode", "priceEuro", "order", "thumbnail",
  "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES",
  "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES",
  "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES",
  "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES",
  "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES",
  "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES",
  "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES",
  "imageAlts", "isActive", "createdAt", "updatedAt"
)
SELECT
  "id", "uniqueCode", "priceEuro"::numeric(12,2), "order", "thumbnail",
  "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES",
  "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES",
  "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES",
  "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES",
  "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES",
  "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES",
  "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES",
  "imageAlts", "isActive", "createdAt", "updatedAt"
FROM "Product" WHERE "type" = 'RESTAURANT'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "VillaImage" ("id", "villaId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES")
SELECT p."id" || '-image-' || g.n, p."id", to_jsonb(p)->>('image' || g.n), g.n - 1,
  p."imageAlts"->('image' || g.n)->>'fr', p."imageAlts"->('image' || g.n)->>'en',
  p."imageAlts"->('image' || g.n)->>'de', p."imageAlts"->('image' || g.n)->>'it',
  p."imageAlts"->('image' || g.n)->>'pt', p."imageAlts"->('image' || g.n)->>'es'
FROM "Product" p CROSS JOIN generate_series(1, 50) AS g(n)
WHERE p."type" = 'VILLA' AND NULLIF(to_jsonb(p)->>('image' || g.n), '') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RestaurantImage" ("id", "restaurantId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES")
SELECT p."id" || '-image-' || g.n, p."id", to_jsonb(p)->>('image' || g.n), g.n - 1,
  p."imageAlts"->('image' || g.n)->>'fr', p."imageAlts"->('image' || g.n)->>'en',
  p."imageAlts"->('image' || g.n)->>'de', p."imageAlts"->('image' || g.n)->>'it',
  p."imageAlts"->('image' || g.n)->>'pt', p."imageAlts"->('image' || g.n)->>'es'
FROM "Product" p CROSS JOIN generate_series(1, 50) AS g(n)
WHERE p."type" = 'RESTAURANT' AND NULLIF(to_jsonb(p)->>('image' || g.n), '') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
