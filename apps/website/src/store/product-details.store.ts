import { create } from "zustand";

export type ProductType =
  | "VILLA"
  | "TRANSPORTATION"
  | "SWIMMINGPOOL"
  | "ACTIVITY"
  | "RESTAURANT"
  | "SPA";

export type ProductDisplayDetail = {
  label: string;
  value: string;
};

export type ProductRawDetail =
  | ProductDisplayDetail
  | {
      techRooms?: number;
      techSeats?: number;
      [key: string]: unknown;
    };

export type ProductDetails = {
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
  description: string;

  tags: string[];
  details: ProductRawDetail[];

  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  image5: string | null;
  image6: string | null;
  image7: string | null;
  image8: string | null;
  image9: string | null;
  image10: string | null;
  image11: string | null;
  image12: string | null;
  image13: string | null;
  image14: string | null;
  image15: string | null;
  image16: string | null;
  image17: string | null;
  image18: string | null;
  image19: string | null;
  image20: string | null;
};

type ProductDetailsState = {
  product: ProductDetails | null;

  loading: boolean;
  hasLoaded: boolean;
  error: string | null;

  currentUniqueCode: string | null;
  currentLanguage: string | null;

  startLoading: (
    uniqueCode: string,
    language: string
  ) => void;

  setProduct: (
    product: ProductDetails,
    language: string
  ) => void;

  setError: (error: string) => void;

  resetProduct: () => void;
};

export const useProductDetailsStore =
  create<ProductDetailsState>((set) => ({
    product: null,

    loading: false,
    hasLoaded: false,
    error: null,

    currentUniqueCode: null,
    currentLanguage: null,

    startLoading: (
      uniqueCode,
      language
    ) => {
      set({
        product: null,

        loading: true,
        hasLoaded: false,
        error: null,

        currentUniqueCode: uniqueCode,
        currentLanguage: language,
      });
    },

    setProduct: (product, language) => {
      set({
        product,

        loading: false,
        hasLoaded: true,
        error: null,

        currentUniqueCode:
          product.uniqueCode,

        currentLanguage: language,
      });
    },

    setError: (error) => {
      set({
        product: null,

        loading: false,
        hasLoaded: true,
        error,
      });
    },

    resetProduct: () => {
      set({
        product: null,

        loading: false,
        hasLoaded: false,
        error: null,

        currentUniqueCode: null,
        currentLanguage: null,
      });
    },
  }));