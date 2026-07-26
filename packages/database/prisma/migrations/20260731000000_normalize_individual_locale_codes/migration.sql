UPDATE "Individual"
SET "language" = lower(trim("language"));

UPDATE "Individual"
SET "country" = upper(trim("country"))
WHERE "country" IS NOT NULL AND length(trim("country")) = 3;

UPDATE "Individual"
SET "country" = NULL
WHERE "country" IS NOT NULL AND length(trim("country")) <> 3;

ALTER TABLE "Individual"
ADD CONSTRAINT "Individual_language_lowercase_check"
CHECK ("language" = lower("language")),
ADD CONSTRAINT "Individual_country_alpha3_check"
CHECK ("country" IS NULL OR "country" ~ '^[A-Z]{3}$');
