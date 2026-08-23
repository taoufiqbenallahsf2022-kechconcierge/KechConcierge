import "dotenv/config";

import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to migrate legacy villas.");
}

const client = new Client({ connectionString });

const villaColumns = [
  "id", "uniqueCode", "priceEuro", "order", "thumbnail",
  "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES",
  "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES",
  "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES",
  "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES",
  "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES",
  "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES",
  "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES",
  "imageAlts", "isActive", "createdAt", "updatedAt",
] as const;

const quotedVillaColumns = villaColumns.map((column) => `"${column}"`).join(", ");
const updatedVillaColumns = villaColumns
  .filter((column) => column !== "id")
  .map((column) => `"${column}" = EXCLUDED."${column}"`)
  .join(",\n        ");

async function main() {
  await client.connect();
  await client.query("BEGIN");

  try {
    // Prevent two deployment instances from running this backfill concurrently.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('moorish:migrate-legacy-villas:v1'))",
    );

    const conflictingCodes = await client.query<{ productId: string; villaId: string; uniqueCode: string }>(`
      SELECT p."id" AS "productId", v."id" AS "villaId", p."uniqueCode"
      FROM "Product" p
      JOIN "Villa" v ON v."uniqueCode" = p."uniqueCode" AND v."id" <> p."id"
      WHERE p."type" = 'VILLA'
    `);

    if (conflictingCodes.rowCount) {
      throw new Error(
        `Cannot safely preserve legacy IDs: ${conflictingCodes.rowCount} Villa row(s) use a legacy uniqueCode with a different ID. Conflicts: ${JSON.stringify(conflictingCodes.rows)}`,
      );
    }

    const upsertedVillas = await client.query(`
      INSERT INTO "Villa" (${quotedVillaColumns})
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
      FROM "Product"
      WHERE "type" = 'VILLA'
      ON CONFLICT ("id") DO UPDATE SET
        ${updatedVillaColumns}
    `);

    const upsertedImages = await client.query(`
      INSERT INTO "VillaImage" (
        "id", "villaId", "url", "order",
        "altFR", "altEN", "altDE", "altIT", "altPT", "altES"
      )
      SELECT
        p."id" || '-image-' || g.n,
        p."id",
        to_jsonb(p)->>('image' || g.n),
        g.n - 1,
        p."imageAlts"->('image' || g.n)->>'fr',
        p."imageAlts"->('image' || g.n)->>'en',
        p."imageAlts"->('image' || g.n)->>'de',
        p."imageAlts"->('image' || g.n)->>'it',
        p."imageAlts"->('image' || g.n)->>'pt',
        p."imageAlts"->('image' || g.n)->>'es'
      FROM "Product" p
      CROSS JOIN generate_series(1, 50) AS g(n)
      WHERE p."type" = 'VILLA'
        AND NULLIF(to_jsonb(p)->>('image' || g.n), '') IS NOT NULL
      ON CONFLICT ("villaId", "order") DO UPDATE SET
        "url" = EXCLUDED."url",
        "altFR" = EXCLUDED."altFR",
        "altEN" = EXCLUDED."altEN",
        "altDE" = EXCLUDED."altDE",
        "altIT" = EXCLUDED."altIT",
        "altPT" = EXCLUDED."altPT",
        "altES" = EXCLUDED."altES"
    `);

    const audit = await client.query<{
      legacyVillas: number;
      migratedVillas: number;
      missingVillas: number;
      legacyImages: number;
      migratedImages: number;
    }>(`
      WITH legacy_villas AS (
        SELECT * FROM "Product" WHERE "type" = 'VILLA'
      ),
      legacy_images AS (
        SELECT p."id" AS "villaId", g.n - 1 AS "order", to_jsonb(p)->>('image' || g.n) AS "url"
        FROM legacy_villas p
        CROSS JOIN generate_series(1, 50) AS g(n)
        WHERE NULLIF(to_jsonb(p)->>('image' || g.n), '') IS NOT NULL
      )
      SELECT
        (SELECT COUNT(*)::int FROM legacy_villas) AS "legacyVillas",
        (SELECT COUNT(*)::int FROM "Villa" v JOIN legacy_villas p ON p."id" = v."id") AS "migratedVillas",
        (SELECT COUNT(*)::int FROM legacy_villas p LEFT JOIN "Villa" v ON v."id" = p."id" WHERE v."id" IS NULL) AS "missingVillas",
        (SELECT COUNT(*)::int FROM legacy_images) AS "legacyImages",
        (SELECT COUNT(*)::int FROM legacy_images i JOIN "VillaImage" vi ON vi."villaId" = i."villaId" AND vi."order" = i."order" AND vi."url" = i."url") AS "migratedImages"
    `);

    const result = audit.rows[0];

    if (!result) throw new Error("The villa migration audit returned no result.");
    if (result.missingVillas !== 0 || result.migratedVillas !== result.legacyVillas) {
      throw new Error(`Villa migration verification failed: ${JSON.stringify(result)}`);
    }
    if (result.migratedImages !== result.legacyImages) {
      throw new Error(`Villa image migration verification failed: ${JSON.stringify(result)}`);
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          status: "Legacy villa backfill complete",
          villaRowsAffected: upsertedVillas.rowCount,
          imageRowsAffected: upsertedImages.rowCount,
          ...result,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Legacy villa backfill failed.", error);
  process.exitCode = 1;
});
