import { Category } from "../types/catalog";

export function getCategoryTranslations(t: any) {
  return {
    labels: {
      villas: t.categories.villasLabel,
      activities: t.categories.activitiesLabel,
      transportation: t.categories.transportationLabel,
      spa: t.categories.spaLabel,
      restaurants: t.categories.restaurantsLabel,
      swimmingpools: t.categories.swimmingPoolsLabel,
    } satisfies Record<Category, string>,

    descriptions: {
      villas: t.categories.villasDescription,
      activities: t.categories.activitiesDescription,
      transportation: t.categories.transportationDescription,
      spa: t.categories.spaDescription,
      restaurants: t.categories.restaurantsDescription,
      swimmingpools: t.categories.swimmingPoolsDescription,
    } satisfies Record<Category, string>,
  };
}