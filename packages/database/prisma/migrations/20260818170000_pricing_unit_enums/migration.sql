CREATE TYPE "BeachClubPricingUnit" AS ENUM ('PER_PERSON', 'PER_ADULT', 'PER_CHILD', 'PER_SUNBED', 'PER_TABLE', 'PER_CABANA', 'HALF_DAY', 'FULL_DAY', 'FIXED');
CREATE TYPE "ActivityPricingUnit" AS ENUM ('PER_PERSON', 'PER_ADULT', 'PER_CHILD', 'PER_GROUP', 'HALF_DAY', 'FULL_DAY', 'FIXED');
CREATE TYPE "TransportationPricingUnit" AS ENUM ('PER_VEHICLE', 'PER_PERSON', 'PER_HOUR', 'PER_TRIP', 'HALF_DAY', 'FULL_DAY', 'FIXED');

ALTER TABLE "BeachClubPlan" ALTER COLUMN "pricingUnit" TYPE "BeachClubPricingUnit"
USING CASE WHEN "pricingUnit" IN ('PER_PERSON', 'PER_ADULT', 'PER_CHILD', 'PER_SUNBED', 'PER_TABLE', 'PER_CABANA', 'HALF_DAY', 'FULL_DAY', 'FIXED') THEN "pricingUnit"::"BeachClubPricingUnit" ELSE NULL END;

ALTER TABLE "ActivityPlan" ALTER COLUMN "pricingUnit" TYPE "ActivityPricingUnit"
USING CASE WHEN "pricingUnit" IN ('PER_PERSON', 'PER_ADULT', 'PER_CHILD', 'PER_GROUP', 'HALF_DAY', 'FULL_DAY', 'FIXED') THEN "pricingUnit"::"ActivityPricingUnit" ELSE NULL END;

ALTER TABLE "TransportationPlan" ALTER COLUMN "pricingUnit" TYPE "TransportationPricingUnit"
USING CASE WHEN "pricingUnit" IN ('PER_VEHICLE', 'PER_PERSON', 'PER_HOUR', 'PER_TRIP', 'HALF_DAY', 'FULL_DAY', 'FIXED') THEN "pricingUnit"::"TransportationPricingUnit" ELSE NULL END;
