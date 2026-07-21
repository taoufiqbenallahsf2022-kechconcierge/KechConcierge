import { notFound } from "next/navigation";

import CategoryCatalog from "@/components/CategoryCatalog";
import {
  ProductType,
} from "@/store/catalog.store";

type CategorySlug =
  | "villas"
  | "transportation"
  | "swimmingpools"
  | "activities"
  | "restaurants"
  | "spa";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

function getCategoryConfiguration(
  category: string
): {
  category: CategorySlug;
  productType: ProductType;
} | null {
  switch (category.toLowerCase()) {
    case "villa":
    case "villas":
      return {
        category: "villas",
        productType: "VILLA",
      };

    case "transportation":
    case "transportations":
      return {
        category: "transportation",
        productType: "TRANSPORTATION",
      };

    case "swimmingpool":
    case "swimmingpools":
      return {
        category: "swimmingpools",
        productType: "SWIMMINGPOOL",
      };

    case "activity":
    case "activities":
      return {
        category: "activities",
        productType: "ACTIVITY",
      };

    case "restaurant":
    case "restaurants":
      return {
        category: "restaurants",
        productType: "RESTAURANT",
      };

    case "spa":
      return {
        category: "spa",
        productType: "SPA",
      };

    default:
      return null;
  }
}

export default async function CategoryPage({
  params,
}: Props) {
  const { category } = await params;

  const configuration =
    getCategoryConfiguration(category);

  if (!configuration) {
    notFound();
  }

  return (
    <CategoryCatalog
      category={configuration.category}
      productType={
        configuration.productType
      }
    />
  );
}