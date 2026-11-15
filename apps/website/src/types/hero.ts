export type HeroSlide = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  altText: string;
  durationMs?: number;
  transitionMs?: number;
  isActive?: boolean;
  order?: number;
};
export type HeroConfiguration = { heroSlides: HeroSlide[]; settings: { durationMs: number; transitionMs: number } };
