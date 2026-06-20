import { create } from "zustand";

export type HomeProduct = {
  id: string;
  type: string;
  uniqueCode: string;
  order: number | null;
  thumbnail: string;
  priceEuro: number;
  title: string;
  subtitle: string;
  priceTitle: string;
  address: string;
};

type HomeProductsResponse = {
  villa?: HomeProduct[];
  swimmingpool?: HomeProduct[];
  activity?: HomeProduct[];
  spa?: HomeProduct[];
  transportation?: HomeProduct[];
  restaurant?: HomeProduct[];
};

type HomeProductsState = {
  products: HomeProductsResponse | null;
  loading: boolean;
  error: string | null;
  fetchHomeProducts: (lang?: string) => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useHomeProductsStore = create<HomeProductsState>((set, get) => ({
  products: null,
  loading: false,
  error: null,

  fetchHomeProducts: async (lang = "EN") => {
    if (get().products) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/products/home?lang=${lang}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load home products.");
      }

      set({
        products: data,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        products: null,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load home products.",
      });
    }
  },
}));