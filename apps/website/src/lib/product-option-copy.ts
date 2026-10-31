import type { Locale } from "@/lib/i18n";
import type { ProductType } from "@/store/product-details.store";
import type { CtaText } from "@/store/product-cta.store";

const titles: Record<Locale, Partial<Record<ProductType, string>> & { default: string }> = {
  en: { default: "Available options", TRANSPORTATION: "Service options & pricing", ACTIVITY: "Experience options", SWIMMINGPOOL: "Available packages", NIGHTCLUB: "Table & experience options", PACK: "Available packages" },
  fr: { default: "Options disponibles", TRANSPORTATION: "Options de service et tarifs", ACTIVITY: "Options d’expérience", SWIMMINGPOOL: "Formules disponibles", NIGHTCLUB: "Options de tables et d’expériences", PACK: "Formules disponibles" },
  de: { default: "Verfügbare Optionen", TRANSPORTATION: "Serviceoptionen & Preise", ACTIVITY: "Erlebnisoptionen", SWIMMINGPOOL: "Verfügbare Pakete", NIGHTCLUB: "Tisch- & Erlebnisoptionen", PACK: "Verfügbare Pakete" },
  it: { default: "Opzioni disponibili", TRANSPORTATION: "Opzioni di servizio e prezzi", ACTIVITY: "Opzioni per l’esperienza", SWIMMINGPOOL: "Pacchetti disponibili", NIGHTCLUB: "Opzioni tavolo ed esperienza", PACK: "Pacchetti disponibili" },
  pt: { default: "Opções disponíveis", TRANSPORTATION: "Opções de serviço e preços", ACTIVITY: "Opções de experiência", SWIMMINGPOOL: "Pacotes disponíveis", NIGHTCLUB: "Opções de mesa e experiência", PACK: "Pacotes disponíveis" },
  es: { default: "Opciones disponibles", TRANSPORTATION: "Opciones de servicio y precios", ACTIVITY: "Opciones de experiencia", SWIMMINGPOOL: "Paquetes disponibles", NIGHTCLUB: "Opciones de mesa y experiencia", PACK: "Paquetes disponibles" },
};

const optionCopy = {
  en: { count: "option", action: "Request this option", previous: "Previous option", next: "Next option", choose: "Choose an option", select: "Select an option…", required: "Please select an option before booking." },
  fr: { count: "option", action: "Demander cette option", previous: "Option précédente", next: "Option suivante", choose: "Choisir une option", select: "Sélectionner une option…", required: "Veuillez sélectionner une option avant de continuer." },
  de: { count: "Option", action: "Diese Option anfragen", previous: "Vorherige Option", next: "Nächste Option", choose: "Option auswählen", select: "Option auswählen…", required: "Bitte wählen Sie zuerst eine Option aus." },
  it: { count: "opzione", action: "Richiedi questa opzione", previous: "Opzione precedente", next: "Opzione successiva", choose: "Scegli un’opzione", select: "Seleziona un’opzione…", required: "Seleziona un’opzione prima di continuare." },
  pt: { count: "opção", action: "Solicitar esta opção", previous: "Opção anterior", next: "Opção seguinte", choose: "Escolher uma opção", select: "Selecionar uma opção…", required: "Selecione uma opção antes de continuar." },
  es: { count: "opción", action: "Solicitar esta opción", previous: "Opción anterior", next: "Opción siguiente", choose: "Elegir una opción", select: "Seleccionar una opción…", required: "Selecciona una opción antes de continuar." },
} as const;

const transportationTrigger: Record<Locale, string> = {
  en: "Explore prices",
  fr: "Découvrir les tarifs",
  de: "Preise entdecken",
  it: "Scopri i prezzi",
  pt: "Explorar preços",
  es: "Explorar precios",
};

export function getProductOptionCopy(locale: Locale, productType: ProductType, cta: CtaText = {}) {
  const title = cta.optionsTitle || titles[locale][productType] || titles[locale].default;
  return { ...optionCopy[locale], action: cta.optionAction || optionCopy[locale].action, title, trigger: cta.options || (productType === "TRANSPORTATION" ? transportationTrigger[locale] : title) };
}
