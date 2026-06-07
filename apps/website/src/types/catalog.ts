export type Category =
  | "villas"
  | "apartments"
  | "activities"
  | "transportation"
  | "spa"
  | "restaurants";

export type CatalogItem = {
  id: string;
  category: Category;
  slug: string;
  title: string;
  location: string;
  price: string;
  images: string[];
  shortDescription: string;
  description: string;
  highlights: string[];
  details: Record<string, string>;
};
