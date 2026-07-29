import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";
import it from "@/messages/it.json";
import de from "@/messages/de.json";

export const messages = {
  en,
  fr,
  es,
  pt,
  it,
  de,
};

export type Locale = keyof typeof messages;

export const locales: Locale[] = ["en", "fr", "es", "pt", "it", "de"];

export function getLocaleFromPath(pathname: string): Locale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return "en";
}

export function getDictionary(locale: Locale) {
  return messages[locale] ?? messages.en;
}