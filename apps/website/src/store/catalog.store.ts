import { create } from "zustand";

export type ProductType =
  | "VILLA"
  | "TRANSPORTATION"
  | "SWIMMINGPOOL"
  | "ACTIVITY"
  | "RESTAURANT"
  | "SPA";

export type CatalogItem = {
  id: string;
  type: ProductType;
  uniqueCode: string;
  order: number | null;
  thumbnail: string;
  priceEuro: number;
  title: string;
  subtitle: string;
  priceTitle: string;
  address: string;
};

export type CatalogApiResponse = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: CatalogItem[];
};

type CatalogState = {
  items: CatalogItem[];

  page: number;
  perPage: number;
  total: number;
  totalPages: number;

  loading: boolean;
  hasLoaded: boolean;
  error: string | null;

  currentCategory: ProductType | null;
  currentLanguage: string | null;

  startLoading: (
    category: ProductType,
    language: string
  ) => void;

  setError: (error: string) => void;

  setCatalogData: (
    data: CatalogApiResponse,
    category: ProductType,
    language: string
  ) => void;

  resetCatalog: () => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  items: [],

  page: 1,
  perPage: 12,
  total: 0,
  totalPages: 1,

  loading: false,
  hasLoaded: false,
  error: null,

  currentCategory: null,
  currentLanguage: null,

  startLoading: (category, language) => {
    set({
      loading: true,
      hasLoaded: false,
      error: null,

      currentCategory: category,
      currentLanguage: language,

      /*
       * Clear the previous category results.
       * This prevents villas from remaining visible while
       * transportation products are being fetched.
       */
      items: [],
      page: 1,
      perPage: 12,
      total: 0,
      totalPages: 1,
    });
  },

  setError: (error) => {
    set({
      loading: false,
      hasLoaded: true,
      error,
      items: [],
    });
  },

  setCatalogData: (data, category, language) => {
    set({
      items: data.items,

      page: data.page,
      perPage: data.perPage,
      total: data.total,
      totalPages: data.totalPages,

      currentCategory: category,
      currentLanguage: language,

      loading: false,
      hasLoaded: true,
      error: null,
    });
  },

  resetCatalog: () => {
    set({
      items: [],

      page: 1,
      perPage: 12,
      total: 0,
      totalPages: 1,

      loading: false,
      hasLoaded: false,
      error: null,

      currentCategory: null,
      currentLanguage: null,
    });
  },
}));