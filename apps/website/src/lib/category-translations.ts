import { Category } from "../types/catalog";

export function getCategoryTranslations(t: any) {
  return {
    labels: {
      villas: t.categories.villasLabel,
      activities: t.categories.activitiesLabel,
      transportation: t.categories.transportationLabel,
      spa: t.categories.spaLabel,
      restaurants: t.categories.restaurantsLabel,
      beachclubs: "Beach Clubs",
      swimmingpools: "Beach Clubs",
      nightclubs: "Night Clubs",
      packs: "Packs",
    } satisfies Record<Category, string>,

    descriptions: {
      villas: t.categories.villasDescription,
      activities: t.categories.activitiesDescription,
      transportation: t.categories.transportationDescription,
      spa: t.categories.spaDescription,
      restaurants: t.categories.restaurantsDescription,
      beachclubs: t.categories.swimmingPoolsDescription,
      swimmingpools: t.categories.swimmingPoolsDescription,
      nightclubs: "Nightlife experiences, tables and exclusive club plans in Marrakech.",
      packs: "Curated combinations of services and experiences with flexible plans.",
    } satisfies Record<Category, string>,
  };
}
