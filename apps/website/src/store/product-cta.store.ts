"use client";
import { useEffect } from "react";
import { create } from "zustand";

export type CtaText = { booking?: string; options?: string; addToTrip?: string; optionAction?: string; optionsTitle?: string };
type CtaContent = Record<string, Record<string, CtaText>>;
const useStore = create<{ content: CtaContent; loaded: boolean }>(() => ({ content: {}, loaded: false }));
let pending: Promise<void> | null = null;
export function useProductCtaContent() {
  const content = useStore((state) => state.content);
  useEffect(() => {
    if (useStore.getState().loaded || pending) return;
    pending = fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/website-configuration/product-ctas`)
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load CTA configuration"); const body = await response.json(); useStore.setState({ content: body.content ?? {}, loaded: true }); })
      .catch(() => {}).finally(() => { pending = null; });
  }, []);
  return content;
}
export function productCta(content: CtaContent, type: string, locale: string): CtaText {
  return content[type]?.[locale] ?? {};
}
