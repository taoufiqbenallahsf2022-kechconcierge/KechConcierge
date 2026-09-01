import { create } from "zustand";
import { getVisitorId } from "@/lib/visitor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export type TripPlan = { id: string; title: string; salePrice: number; currency: string };
export type TripItem = { id: string; productId: string; productType: string; productName: string; category: string; image: string; plans: TripPlan[]; planId: string; planTitle?: string; startDate: string; endDate: string };
type NewTripItem = Pick<TripItem, "productId" | "productType" | "productName" | "category" | "image" | "plans" | "startDate" | "endDate"> & { planId?: string; planTitle?: string };
type CartMeta = { id: string; visitorId: string; individualId: string | null; status: string; updatedDate: string } | null;
type TripState = { cart: CartMeta; items: TripItem[]; isOpen: boolean; hydrated: boolean; loading: boolean; restore: (force?: boolean) => Promise<void>; open: () => void; close: () => void; add: (item: NewTripItem) => Promise<void>; update: (id: string, changes: Partial<Pick<TripItem, "planId" | "planTitle" | "startDate" | "endDate">>) => Promise<void>; remove: (id: string) => Promise<void>; updateEmail: (email: string) => Promise<void>; markSubmitted: (contactRequestId: string, email: string) => Promise<void> };

function requestHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("kech_access_token") : null;
  return { "Content-Type": "application/json", Accept: "application/json", "x-visitor-id": getVisitorId(), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function normalize(payload: any) {
  const cart = payload?.cart ?? null;
  return { cart: cart ? { id: cart.id, visitorId: cart.visitorId, individualId: cart.individualId, status: cart.status, updatedDate: cart.updatedDate } : null, items: Array.isArray(cart?.items) ? cart.items.map((item: any) => ({ ...item, image: item.image || "", plans: Array.isArray(item.plans) ? item.plans : [], planId: item.planId || "", startDate: item.startDate?.slice(0, 10) || "", endDate: item.endDate?.slice(0, 10) || "" })) : [] };
}
async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}/api/trip-cart${path}`, { ...init, headers: requestHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to update your trip.");
  return normalize(data);
}

let updateQueue = Promise.resolve();

export const useTripStore = create<TripState>((set, get) => ({
  cart: null, items: [], isOpen: false, hydrated: false, loading: false,
  restore: async (force = false) => { if ((!force && get().hydrated) || get().loading || typeof window === "undefined") return; set({ loading: true }); try { set({ ...(await request("/")), hydrated: true, loading: false }); } catch (error) { console.error("Unable to restore trip cart:", error); set({ hydrated: true, loading: false }); } },
  open: () => set({ isOpen: true }), close: () => set({ isOpen: false }),
  add: async (item) => { set({ loading: true }); try { set({ ...(await request("/items", { method: "POST", body: JSON.stringify(item) })), hydrated: true, loading: false }); } catch (error) { set({ loading: false }); throw error; } },
  update: async (id, changes) => {
    set({ items: get().items.map((item) => item.id === id ? { ...item, ...changes } : item) });
    updateQueue = updateQueue.then(async () => { const result = await request(`/items/${id}`, { method: "PATCH", body: JSON.stringify(changes) }); set(result); });
    try { await updateQueue; } catch (error) { updateQueue = Promise.resolve(); await get().restore(true); throw error; }
  },
  remove: async (id) => { set(await request(`/items/${id}`, { method: "DELETE" })); },
  updateEmail: async (email) => { set(await request("/", { method: "PATCH", body: JSON.stringify({ email }) })); },
  markSubmitted: async (contactRequestId, email) => {
    await request("/submit", { method: "POST", body: JSON.stringify({ contactRequestId, email }) });
    set({ cart: null, items: [], hydrated: true, loading: false });
  },
}));
