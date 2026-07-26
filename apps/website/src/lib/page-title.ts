import {
  getLocaleFromPath,
  locales,
  type Locale,
} from "@/lib/i18n";

type TitleCopy = {
  home: string;
  about: string;
  services: string;
  contact: string;
  account: string;
  verify: string;
  forgotPassword: string;
  resetPassword: string;
  terms: string;
  chat: string;
  notFound: string;
  categories: Record<string, string>;
};

const TITLES: Record<Locale, TitleCopy> = {
  en: {
    home: "Luxury Concierge Services in Marrakech",
    about: "About Our Marrakech Concierge",
    services: "Private Concierge Services",
    contact: "Contact Your Concierge",
    account: "Your Account",
    verify: "Verify Your Account",
    forgotPassword: "Forgot Your Password",
    resetPassword: "Reset Your Password",
    terms: "Terms and Conditions",
    chat: "Chat with Your Concierge",
    notFound: "Page Not Found",
    categories: {
      villas: "Luxury Villas in Marrakech",
      transportation: "Private Transportation",
      swimmingpools: "Private Swimming Pools",
      activities: "Experiences and Activities",
      restaurants: "Restaurants in Marrakech",
      spa: "Spa and Wellness",
    },
  },
  fr: {
    home: "Services de conciergerie de luxe à Marrakech",
    about: "À propos de notre conciergerie",
    services: "Services de conciergerie privée",
    contact: "Contactez votre concierge",
    account: "Votre compte",
    verify: "Vérifiez votre compte",
    forgotPassword: "Mot de passe oublié",
    resetPassword: "Réinitialiser votre mot de passe",
    terms: "Conditions générales",
    chat: "Discutez avec votre concierge",
    notFound: "Page introuvable",
    categories: {
      villas: "Villas de luxe à Marrakech",
      transportation: "Transport privé",
      swimmingpools: "Piscines privées",
      activities: "Expériences et activités",
      restaurants: "Restaurants à Marrakech",
      spa: "Spa et bien-être",
    },
  },
  es: {
    home: "Servicios de conserjería de lujo en Marrakech",
    about: "Sobre nuestro servicio de conserjería",
    services: "Servicios de conserjería privada",
    contact: "Contacta con tu conserje",
    account: "Tu cuenta",
    verify: "Verifica tu cuenta",
    forgotPassword: "Contraseña olvidada",
    resetPassword: "Restablecer tu contraseña",
    terms: "Términos y condiciones",
    chat: "Chatea con tu conserje",
    notFound: "Página no encontrada",
    categories: {
      villas: "Villas de lujo en Marrakech",
      transportation: "Transporte privado",
      swimmingpools: "Piscinas privadas",
      activities: "Experiencias y actividades",
      restaurants: "Restaurantes en Marrakech",
      spa: "Spa y bienestar",
    },
  },
  pt: {
    home: "Serviços de concierge de luxo em Marrakech",
    about: "Sobre o nosso serviço de concierge",
    services: "Serviços de concierge privado",
    contact: "Contacte o seu concierge",
    account: "A sua conta",
    verify: "Verifique a sua conta",
    forgotPassword: "Palavra-passe esquecida",
    resetPassword: "Redefinir a palavra-passe",
    terms: "Termos e condições",
    chat: "Converse com o seu concierge",
    notFound: "Página não encontrada",
    categories: {
      villas: "Villas de luxo em Marrakech",
      transportation: "Transporte privado",
      swimmingpools: "Piscinas privadas",
      activities: "Experiências e atividades",
      restaurants: "Restaurantes em Marrakech",
      spa: "Spa e bem-estar",
    },
  },
  it: {
    home: "Servizi concierge di lusso a Marrakech",
    about: "Chi siamo",
    services: "Servizi concierge privati",
    contact: "Contatta il tuo concierge",
    account: "Il tuo account",
    verify: "Verifica il tuo account",
    forgotPassword: "Password dimenticata",
    resetPassword: "Reimposta la password",
    terms: "Termini e condizioni",
    chat: "Chatta con il tuo concierge",
    notFound: "Pagina non trovata",
    categories: {
      villas: "Ville di lusso a Marrakech",
      transportation: "Trasporto privato",
      swimmingpools: "Piscine private",
      activities: "Esperienze e attività",
      restaurants: "Ristoranti a Marrakech",
      spa: "Spa e benessere",
    },
  },
  de: {
    home: "Luxus-Concierge-Service in Marrakesch",
    about: "Über unseren Concierge-Service",
    services: "Private Concierge-Leistungen",
    contact: "Kontaktieren Sie Ihren Concierge",
    account: "Ihr Konto",
    verify: "Konto bestätigen",
    forgotPassword: "Passwort vergessen",
    resetPassword: "Passwort zurücksetzen",
    terms: "Allgemeine Geschäftsbedingungen",
    chat: "Chatten Sie mit Ihrem Concierge",
    notFound: "Seite nicht gefunden",
    categories: {
      villas: "Luxusvillen in Marrakesch",
      transportation: "Privater Transport",
      swimmingpools: "Private Swimmingpools",
      activities: "Erlebnisse und Aktivitäten",
      restaurants: "Restaurants in Marrakesch",
      spa: "Spa und Wellness",
    },
  },
};

const STATIC_ROUTE_KEYS: Record<
  string,
  Exclude<keyof TitleCopy, "categories">
> = {
  "/": "home",
  "/about": "about",
  "/services": "services",
  "/contact": "contact",
  "/account": "account",
  "/account/verify": "verify",
  "/forgot-password": "forgotPassword",
  "/reset-password": "resetPassword",
  "/terms": "terms",
  "/chat": "chat",
};

function stripLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (locales.includes(segments[0] as Locale)) segments.shift();
  return `/${segments.join("/")}` || "/";
}

function humanizeSlug(slug: string) {
  let value = slug;
  try {
    value = decodeURIComponent(slug);
  } catch {
    // Keep the original segment when malformed URL encoding is encountered.
  }
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveTitle(pathname: string, locale: Locale) {
  const path = stripLocale(pathname);
  const copy = TITLES[locale];

  if (path === "/chat" || path.startsWith("/chat/")) return copy.chat;

  const staticKey = STATIC_ROUTE_KEYS[path];
  if (staticKey) return copy[staticKey] as string;

  const segments = path.split("/").filter(Boolean);
  const category = segments[0]?.toLowerCase();
  const categoryTitle = category
    ? copy.categories[category]
    : undefined;

  if (categoryTitle && segments.length === 1) return categoryTitle;
  if (categoryTitle && segments[1]) {
    return `${humanizeSlug(segments[1])} — ${categoryTitle}`;
  }

  return copy.notFound;
}

export function getPageTitle(pathname: string) {
  const locale =
    getLocaleFromPath(pathname);

  return {
    locale,
    title: `${resolveTitle(pathname, locale)} | Moorish Concierge`,
  };
}
