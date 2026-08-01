export const supportedLocales = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "de",
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export type ApiProductType =
  | "VILLA"
  | "TRANSPORTATION"
  | "SWIMMINGPOOL"
  | "ACTIVITY"
  | "RESTAURANT"
  | "SPA";

export type CatalogItem = {
  id: string;
  type: ApiProductType;
  uniqueCode: string;
  order: number | null;
  thumbnail: string;
  thumbnailAlt: string;
  priceEuro: number;
  title: string;
  subtitle: string;
  priceTitle: string;
  address: string;
};

export type ProductsApiResponse = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: CatalogItem[];
};

const categoryTypeMap: Record<string, ApiProductType> = {
  villa: "VILLA",
  villas: "VILLA",

  transportation: "TRANSPORTATION",
  transportations: "TRANSPORTATION",

  swimmingpool: "SWIMMINGPOOL",
  swimmingpools: "SWIMMINGPOOL",

  activity: "ACTIVITY",
  activities: "ACTIVITY",

  restaurant: "RESTAURANT",
  restaurants: "RESTAURANT",

  spa: "SPA",
};

const canonicalCategoryMap: Record<ApiProductType, string> = {
  VILLA: "villas",
  TRANSPORTATION: "transportation",
  SWIMMINGPOOL: "swimmingpools",
  ACTIVITY: "activities",
  RESTAURANT: "restaurants",
  SPA: "spa",
};

const categoryContent: Record<
  SupportedLocale,
  Record<
    ApiProductType,
    {
      label: string;
      description: string;
      catalogLabel: string;
      emptyMessage: string;
    }
  >
> = {
  en: {
    VILLA: {
      label: "Villas",
      description:
        "Private villas in Marrakech with pools, gardens, staff options, and premium comfort.",
      catalogLabel: "Catalog",
      emptyMessage: "No villas were found.",
    },
    TRANSPORTATION: {
      label: "Transportation",
      description:
        "Private cars, luxury vehicles, vans, and group transfers with reliable drivers.",
      catalogLabel: "Catalog",
      emptyMessage: "No transportation options were found.",
    },
    SWIMMINGPOOL: {
      label: "Swimming Pools",
      description:
        "Pool day passes and relaxing swimming experiences around Marrakech.",
      catalogLabel: "Catalog",
      emptyMessage: "No swimming pool options were found.",
    },
    ACTIVITY: {
      label: "Activities",
      description:
        "Quad rides, camel rides, desert trips, city tours, and local experiences.",
      catalogLabel: "Catalog",
      emptyMessage: "No activities were found.",
    },
    RESTAURANT: {
      label: "Restaurants",
      description:
        "Selected Moroccan and international restaurants for memorable meals.",
      catalogLabel: "Catalog",
      emptyMessage: "No restaurants were found.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, massage, beauty, and wellness experiences in Marrakech.",
      catalogLabel: "Catalog",
      emptyMessage: "No SPA experiences were found.",
    },
  },

  fr: {
    VILLA: {
      label: "Villas",
      description:
        "Villas privées à Marrakech avec piscines, jardins, personnel en option et confort premium.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucune villa n’a été trouvée.",
    },
    TRANSPORTATION: {
      label: "Transport",
      description:
        "Voitures privées, véhicules de luxe, vans et transferts de groupe avec chauffeurs fiables.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucune option de transport n’a été trouvée.",
    },
    SWIMMINGPOOL: {
      label: "Piscines",
      description:
        "Pass journée et expériences piscine pour se détendre autour de Marrakech.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucune piscine n’a été trouvée.",
    },
    ACTIVITY: {
      label: "Activités",
      description:
        "Quad, balades à dos de chameau, désert, visites de la ville et expériences locales.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucune activité n’a été trouvée.",
    },
    RESTAURANT: {
      label: "Restaurants",
      description:
        "Restaurants marocains et internationaux sélectionnés pour des repas mémorables.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucun restaurant n’a été trouvé.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, massage, beauté et expériences bien-être à Marrakech.",
      catalogLabel: "Catalogue",
      emptyMessage: "Aucune expérience SPA n’a été trouvée.",
    },
  },

  es: {
    VILLA: {
      label: "Villas",
      description:
        "Villas privadas en Marrakech con piscina, jardín, personal opcional y comodidad premium.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron villas.",
    },
    TRANSPORTATION: {
      label: "Transporte",
      description:
        "Coches privados, vehículos de lujo, vans y traslados para grupos con conductores fiables.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron opciones de transporte.",
    },
    SWIMMINGPOOL: {
      label: "Piscinas",
      description:
        "Pases de día y experiencias de piscina para relajarse en Marrakech.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron piscinas.",
    },
    ACTIVITY: {
      label: "Actividades",
      description:
        "Quad, paseos en camello, excursiones al desierto, visitas y experiencias locales.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron actividades.",
    },
    RESTAURANT: {
      label: "Restaurantes",
      description:
        "Restaurantes marroquíes e internacionales seleccionados para comidas memorables.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron restaurantes.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, masajes, belleza y experiencias de bienestar en Marrakech.",
      catalogLabel: "Catálogo",
      emptyMessage: "No se encontraron experiencias de SPA.",
    },
  },

  pt: {
    VILLA: {
      label: "Villas",
      description:
        "Villas privadas em Marraquexe com piscina, jardim, equipa opcional e conforto premium.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhuma villa foi encontrada.",
    },
    TRANSPORTATION: {
      label: "Transporte",
      description:
        "Carros privados, veículos de luxo, vans e transfers de grupo com motoristas confiáveis.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhuma opção de transporte foi encontrada.",
    },
    SWIMMINGPOOL: {
      label: "Piscinas",
      description:
        "Passes diários e experiências de piscina para relaxar em Marraquexe.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhuma piscina foi encontrada.",
    },
    ACTIVITY: {
      label: "Atividades",
      description:
        "Quad, passeios de camelo, deserto, visitas à cidade e experiências locais.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhuma atividade foi encontrada.",
    },
    RESTAURANT: {
      label: "Restaurantes",
      description:
        "Restaurantes marroquinos e internacionais selecionados para refeições memoráveis.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhum restaurante foi encontrado.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, massagens, beleza e experiências de bem-estar em Marraquexe.",
      catalogLabel: "Catálogo",
      emptyMessage: "Nenhuma experiência de SPA foi encontrada.",
    },
  },

  it: {
    VILLA: {
      label: "Ville",
      description:
        "Ville private a Marrakech con piscina, giardino, personale opzionale e comfort premium.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessuna villa trovata.",
    },
    TRANSPORTATION: {
      label: "Trasporti",
      description:
        "Auto private, veicoli di lusso, van e transfer di gruppo con autisti affidabili.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessuna opzione di trasporto trovata.",
    },
    SWIMMINGPOOL: {
      label: "Piscine",
      description:
        "Pass giornalieri ed esperienze in piscina per rilassarsi a Marrakech.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessuna piscina trovata.",
    },
    ACTIVITY: {
      label: "Attività",
      description:
        "Quad, passeggiate in cammello, deserto, visite della città ed esperienze locali.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessuna attività trovata.",
    },
    RESTAURANT: {
      label: "Ristoranti",
      description:
        "Ristoranti marocchini e internazionali selezionati per pasti memorabili.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessun ristorante trovato.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, massaggi, bellezza ed esperienze benessere a Marrakech.",
      catalogLabel: "Catalogo",
      emptyMessage: "Nessuna esperienza SPA trovata.",
    },
  },

  de: {
    VILLA: {
      label: "Villen",
      description:
        "Private Villen in Marrakesch mit Pool, Garten, optionalem Personal und Premium-Komfort.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine Villen gefunden.",
    },
    TRANSPORTATION: {
      label: "Transport",
      description:
        "Private Autos, Luxusfahrzeuge, Vans und Gruppentransfers mit zuverlässigen Fahrern.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine Transportoptionen gefunden.",
    },
    SWIMMINGPOOL: {
      label: "Pools",
      description:
        "Tagespässe und Pool-Erlebnisse zum Entspannen in Marrakesch.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine Pools gefunden.",
    },
    ACTIVITY: {
      label: "Aktivitäten",
      description:
        "Quad, Kamelritte, Wüstenausflüge, Stadtführungen und lokale Erlebnisse.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine Aktivitäten gefunden.",
    },
    RESTAURANT: {
      label: "Restaurants",
      description:
        "Ausgewählte marokkanische und internationale Restaurants für besondere Mahlzeiten.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine Restaurants gefunden.",
    },
    SPA: {
      label: "SPA",
      description:
        "Hammam, Massage, Beauty und Wellness-Erlebnisse in Marrakesch.",
      catalogLabel: "Katalog",
      emptyMessage: "Keine SPA-Erlebnisse gefunden.",
    },
  },
};

export function isSupportedLocale(
  value: string
): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function getCategoryType(
  category: string
): ApiProductType | null {
  return categoryTypeMap[category.toLowerCase()] || null;
}

export function getCanonicalCategory(
  type: ApiProductType
): string {
  return canonicalCategoryMap[type];
}

export function getCategoryContent(
  locale: SupportedLocale,
  type: ApiProductType
) {
  return categoryContent[locale][type];
}

export async function getProductsByCategory(params: {
  type: ApiProductType;
  page: number;
  locale: SupportedLocale;
}): Promise<ProductsApiResponse> {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  const url = new URL(
    `/api/products/${params.type}`,
    apiUrl
  );

  url.searchParams.set("page", String(params.page));
  url.searchParams.set(
    "lang",
    params.locale.toUpperCase()
  );

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },

    // Always retrieve the current database values.
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Unable to load catalog products:", {
      status: response.status,
      url: url.toString(),
      body: errorBody,
    });

    throw new Error("ERROR_PRODUCTS_FETCH_FAILED");
  }

  return response.json() as Promise<ProductsApiResponse>;
}
