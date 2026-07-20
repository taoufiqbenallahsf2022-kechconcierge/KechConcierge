import OpenAI from "openai";
import { ProductType } from "../../../../packages/database/generated/prisma/client";
import { prisma } from "../config/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PRODUCT_PRIORITY: Record<ProductType, number> = {
  VILLA: 1,
  TRANSPORTATION: 2,
  SWIMMINGPOOL: 3,
  ACTIVITY: 4,
  RESTAURANT: 5,
  SPA: 6,
};

type NoProductReason =
  | "BUDGET"
  | "CAPACITY"
  | "ROOMS"
  | "NO_MATCH"
  | "UNKNOWN";

type ProductRecommendation = {
  product: any;

  affordable: boolean;

  productPriceEuro: number;

  budgetPerPersonPerDay: number;

  costPerPersonPerDay: number;

  remainingBudgetPerPersonPerDay: number;

  totalDailyBudgetForGroup: number;

  techRooms?: number | null;

  techSeats?: number | null;

  capacityValid: boolean;

  score: number;
};


type SupportedLanguage = "en" | "fr" | "es" | "pt" | "it" | "de";

type ChatIntent = "GREETING" | "NEEDS_MORE_INFO" | "TOURISM_RECOMMENDATION" | "REDIRECT_CONTACT";
type BudgetScope = "GROUP" | "PER_PERSON";
type BudgetPeriod = "TOTAL_STAY" | "PER_DAY";
type RoomOccupancy = "ONE_PER_PERSON" | "TWO_PER_ROOM";
type TransportationServicePeriod = "HALF_DAY" | "FULL_DAY";

type CategoryNeed = {
  people?: number;
  durationDays?: number;
  budgetEuro?: number;
  budgetPeriod?: BudgetPeriod;
  budgetScope?: BudgetScope;
  roomOccupancy?: RoomOccupancy;
  transportationServicePeriod?: TransportationServicePeriod;
  preferences?: string[];
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ExtractedChatNeed = {
  intent: ChatIntent;
  reason: string;
  category?: ProductType;
  interests: ProductType[];
  categoryNeeds: Partial<Record<ProductType, CategoryNeed>>;

  // Legacy active-category fields kept for compatibility with the existing engine.
  people?: number;
  budgetEuro?: number;
  budgetPeriod?: BudgetPeriod;
  durationDays?: number;
  preferences: string[];
  budgetScope?: BudgetScope;
  roomOccupancy?: RoomOccupancy;
  transportationServicePeriod?: TransportationServicePeriod;
};

type MissingInformation =
  | "INTEREST"
  | "PEOPLE"
  | "DURATION"
  | "BUDGET"
  | "BUDGET_SCOPE"
  | "BUDGET_PERIOD"
  | "ROOM_OCCUPANCY"
  | "TRANSPORTATION_DAYS"
  | "TRANSPORTATION_SERVICE_PERIOD";

function getRequestedProductTypes(
  need: ExtractedChatNeed
): ProductType[] {
  const requestedTypes: ProductType[] = [];

  const addType = (type?: ProductType) => {
    if (type && !requestedTypes.includes(type)) {
      requestedTypes.push(type);
    }
  };

  addType(need.category);

  for (const type of need.interests || []) {
    addType(type);
  }

  for (const preference of need.preferences || []) {
    addType(normalizeCategory(preference));
  }

  return requestedTypes;
}

function getCategoryNeed(
  need: ExtractedChatNeed,
  type: ProductType
): CategoryNeed {
  const categoryNeed = need.categoryNeeds?.[type] || {};

  if (need.category !== type) {
    return categoryNeed;
  }

  return {
    people: categoryNeed.people ?? need.people,
    durationDays: categoryNeed.durationDays ?? need.durationDays,
    budgetEuro: categoryNeed.budgetEuro ?? need.budgetEuro,
    budgetScope: categoryNeed.budgetScope ?? need.budgetScope,
    budgetPeriod: categoryNeed.budgetPeriod ?? need.budgetPeriod,
    roomOccupancy: categoryNeed.roomOccupancy ?? need.roomOccupancy,
    transportationServicePeriod:
      categoryNeed.transportationServicePeriod ??
      need.transportationServicePeriod,
    preferences: categoryNeed.preferences ?? need.preferences,
  };
}

function getMissingInformation(
  need: ExtractedChatNeed
): MissingInformation[] {
  const missing: MissingInformation[] = [];
  const requestedTypes = getRequestedProductTypes(need);

  if (requestedTypes.length === 0) {
    missing.push("INTEREST");
    return missing;
  }

  // Ask only for the category currently being discussed. Previous categories
  // remain stored in categoryNeeds and are not erased.
  const activeType = need.category || requestedTypes[0];
  const activeNeed = getCategoryNeed(need, activeType);

  if (!activeNeed.people) {
    missing.push("PEOPLE");
  }

  if (activeType === ProductType.VILLA) {
    if (!activeNeed.durationDays) {
      missing.push("DURATION");
    }

    if (!activeNeed.roomOccupancy) {
      missing.push("ROOM_OCCUPANCY");
    }
  }

  if (activeType === ProductType.TRANSPORTATION) {
    if (!activeNeed.durationDays) {
      missing.push("TRANSPORTATION_DAYS");
    }

    if (!activeNeed.transportationServicePeriod) {
      missing.push("TRANSPORTATION_SERVICE_PERIOD");
    }
  }

  if (!activeNeed.budgetEuro) {
    missing.push("BUDGET");
  }

  if (activeNeed.budgetEuro && !activeNeed.budgetScope) {
    missing.push("BUDGET_SCOPE");
  }

  if (activeNeed.budgetEuro && !activeNeed.budgetPeriod) {
    missing.push("BUDGET_PERIOD");
  }

  return missing;
}

function isContactRedirectRequest(message: string) {
  const text = message.toLowerCase();

  const keywords = [
    // FR
    "problème sur mon compte",
    "problème de compte",
    "mot de passe oublié",
    "j'ai oublié le mot de passe",
    "oublié le mot de passe",
    "connexion",
    "réclamation",
    "remboursement",
    "partenariat",

    // EN
    "account problem",
    "problem with my account",
    "forgot password",
    "password reset",
    "login issue",
    "complaint",
    "refund",
    "partnership",

    // ES
    "problema con mi cuenta",
    "olvidé mi contraseña",
    "contraseña olvidada",
    "reclamación",
    "reembolso",

    // PT
    "problema na minha conta",
    "esqueci a senha",
    "reclamação",
    "reembolso",

    // IT
    "problema con il mio account",
    "password dimenticata",
    "reclamo",
    "rimborso",

    // DE
    "problem mit meinem konto",
    "passwort vergessen",
    "beschwerde",
    "rückerstattung",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeLanguage(language?: string): SupportedLanguage {
  const lang = (language || "en").toLowerCase();

  if (["en", "fr", "es", "pt", "it", "de"].includes(lang)) {
    return lang as SupportedLanguage;
  }

  return "en";
}

function appendProductLinksIfMissing(reply: string, products: any[], language?: string) {
  const hasMarkdownLink = /\[.+?\]\(.+?\)/.test(reply);

  if (hasMarkdownLink) return reply;

  const lang = normalizeLanguage(language);

  const intro: Record<SupportedLanguage, string> = {
    en: "You can check the suggested options here:",
    fr: "Vous pouvez consulter les options proposées ici :",
    es: "Puedes consultar las opciones sugeridas aquí:",
    pt: "Pode consultar as opções sugeridas aqui:",
    it: "Puoi consultare le opzioni suggerite qui:",
    de: "Sie können die vorgeschlagenen Optionen hier ansehen:",
  };

  const links = products
    .slice(0, 5)
    .map((product) => {
      const p = productSummary(product, lang);
      return `- ${p.title} — [voir ici](${p.link})`;
    })
    .join("\n");

  return `${reply}\n\n${intro[lang]}\n${links}`;
}

function buildFrontendPath(path: string, language?: string) {
  const lang = normalizeLanguage(language);

  if (lang === "en") return path;

  return `/${lang}${path}`;
}

function getLanguageInstruction(language?: string) {
  const lang = normalizeLanguage(language);

  const instructions: Record<SupportedLanguage, string> = {
    en: "Answer in English.",
    fr: "Réponds en français.",
    es: "Responde en español.",
    pt: "Responde em português.",
    it: "Rispondi in italiano.",
    de: "Antworte auf Deutsch.",
  };

  return instructions[lang];
}

function getGreetingMessage(language?: string) {
  const lang = normalizeLanguage(language);

  const messages: Record<SupportedLanguage, string> = {
    en: `Hello 👋 Welcome to Moorly 😊

I’m here to help you find the best villas, pools, activities, restaurants, spas, or transportation in Marrakech.

Tell me what you’re looking for: number of people, dates, budget, or the kind of experience you want.`,

    fr: `Bonjour 👋 Bienvenue chez Moorly 😊

Je suis là pour vous aider à trouver les meilleures villas, piscines, activités, restaurants, spas ou transports à Marrakech.

Dites-moi simplement ce que vous cherchez : nombre de personnes, dates, budget ou type d’expérience souhaitée.`,

    es: `Hola 👋 Bienvenido a Moorly 😊

Estoy aquí para ayudarte a encontrar villas, piscinas, actividades, restaurantes, spas o transporte en Marrakech.

Dime qué buscas: número de personas, fechas, presupuesto o tipo de experiencia.`,

    pt: `Olá 👋 Bem-vindo à Moorly 😊

Estou aqui para ajudar a encontrar villas, piscinas, atividades, restaurantes, spas ou transporte em Marraquexe.

Diga-me o que procura: número de pessoas, datas, orçamento ou tipo de experiência.`,

    it: `Ciao 👋 Benvenuto su Moorly 😊

Sono qui per aiutarti a trovare ville, piscine, attività, ristoranti, spa o trasporti a Marrakech.

Dimmi cosa cerchi: numero di persone, date, budget o tipo di esperienza.`,

    de: `Hallo 👋 Willkommen bei Moorly 😊

Ich helfe Ihnen gerne dabei, Villen, Pools, Aktivitäten, Restaurants, Spas oder Transport in Marrakesch zu finden.

Sagen Sie mir einfach, wonach Sie suchen: Personenanzahl, Daten, Budget oder gewünschtes Erlebnis.`,
  };

  return messages[lang];
}

function getMoreInfoMessage(
  language: string | undefined,
  missingInformation: MissingInformation[]
) {
  const lang = normalizeLanguage(language);

  const questions: Record<
    SupportedLanguage,
    Partial<Record<MissingInformation, string>>
  > = {
    en: {
      INTEREST:
        "What are you mainly interested in: a villa, transportation, swimming pools, activities, restaurants, spa, or a complete trip plan?",
      PEOPLE: "How many people are coming?",
      DURATION: "How many days will you stay?",
      BUDGET: "What budget should I work with?",
      BUDGET_SCOPE:
        "Is the budget for the whole group or per person?",
      BUDGET_PERIOD:
        "Is this budget per day or for the entire stay?",
      ROOM_OCCUPANCY:
        "For the bedrooms, would you prefer one room per person or a maximum of two people per room?",
      TRANSPORTATION_DAYS:
        "For how many days will you need the vehicle or driver?",
      TRANSPORTATION_SERVICE_PERIOD:
        "Will you need the vehicle and driver for a full day or only half a day?",
    },

    fr: {
      INTEREST:
        "Qu’est-ce qui vous intéresse principalement : une villa, le transport, les piscines, les activités, les restaurants, le spa ou un programme complet ?",
      PEOPLE: "Combien de personnes viennent ?",
      DURATION: "Combien de jours allez-vous rester ?",
      BUDGET: "Quel budget souhaitez-vous prévoir ?",
      BUDGET_SCOPE:
        "Le budget est-il pour tout le groupe ou par personne ?",
      BUDGET_PERIOD:
        "Ce budget est-il prévu par jour ou pour l’ensemble du séjour ?",
      ROOM_OCCUPANCY:
        "Pour les chambres, souhaitez-vous une chambre par personne ou acceptez-vous au maximum deux personnes par chambre ?",
      TRANSPORTATION_DAYS:
        "Pendant combien de jours aurez-vous besoin du véhicule ou du chauffeur ?",
      TRANSPORTATION_SERVICE_PERIOD:
        "Aurez-vous besoin du véhicule et du chauffeur pour une journée complète ou seulement une demi-journée ?",
    },

    es: {
      INTEREST:
        "¿Qué te interesa principalmente: una villa, transporte, piscinas, actividades, restaurantes, spa o un plan completo?",
      PEOPLE: "¿Cuántas personas vienen?",
      DURATION: "¿Cuántos días se quedan?",
      BUDGET: "¿Qué presupuesto tienes?",
      BUDGET_SCOPE:
        "¿El presupuesto es para todo el grupo o por persona?",
      BUDGET_PERIOD:
        "¿Este presupuesto es por día o para toda la estancia?",
      ROOM_OCCUPANCY:
        "Para las habitaciones, ¿prefieren una habitación por persona o un máximo de dos personas por habitación?",
      TRANSPORTATION_DAYS:
        "¿Durante cuántos días necesitarán el vehículo o conductor?",
      TRANSPORTATION_SERVICE_PERIOD:
        "¿Necesitarán el vehículo y conductor durante todo el día o solo medio día?",
    },

    pt: {
      INTEREST:
        "O que lhe interessa principalmente: uma villa, transporte, piscinas, atividades, restaurantes, spa ou um plano completo?",
      PEOPLE: "Quantas pessoas vêm?",
      DURATION: "Quantos dias vão ficar?",
      BUDGET: "Qual é o orçamento?",
      BUDGET_SCOPE:
        "O orçamento é para todo o grupo ou por pessoa?",
      BUDGET_PERIOD:
        "Este orçamento é por dia ou para toda a estadia?",
      ROOM_OCCUPANCY:
        "Para os quartos, prefere um quarto por pessoa ou no máximo duas pessoas por quarto?",
      TRANSPORTATION_DAYS:
        "Durante quantos dias precisarão do veículo ou motorista?",
      TRANSPORTATION_SERVICE_PERIOD:
        "Precisarão do veículo e motorista durante o dia inteiro ou apenas meio dia?",
    },

    it: {
      INTEREST:
        "Cosa ti interessa principalmente: una villa, trasporto, piscine, attività, ristoranti, spa o un programma completo?",
      PEOPLE: "Quante persone siete?",
      DURATION: "Quanti giorni resterete?",
      BUDGET: "Qual è il budget?",
      BUDGET_SCOPE:
        "Il budget è per tutto il gruppo o a persona?",
      BUDGET_PERIOD:
        "Questo budget è giornaliero o per l’intero soggiorno?",
      ROOM_OCCUPANCY:
        "Per le camere, preferite una camera per persona o un massimo di due persone per camera?",
      TRANSPORTATION_DAYS:
        "Per quanti giorni avrete bisogno del veicolo o dell’autista?",
      TRANSPORTATION_SERVICE_PERIOD:
        "Avrete bisogno del veicolo e dell’autista per l’intera giornata o solo mezza giornata?",
    },

    de: {
      INTEREST:
        "Woran sind Sie hauptsächlich interessiert: Villa, Transport, Pools, Aktivitäten, Restaurants, Spa oder ein kompletter Reiseplan?",
      PEOPLE: "Wie viele Personen reisen?",
      DURATION: "Wie viele Tage bleiben Sie?",
      BUDGET: "Wie hoch ist Ihr Budget?",
      BUDGET_SCOPE:
        "Gilt das Budget für die ganze Gruppe oder pro Person?",
      BUDGET_PERIOD:
        "Gilt dieses Budget pro Tag oder für den gesamten Aufenthalt?",
      ROOM_OCCUPANCY:
        "Möchten Sie ein Zimmer pro Person oder maximal zwei Personen pro Zimmer?",
      TRANSPORTATION_DAYS:
        "Für wie viele Tage benötigen Sie das Fahrzeug oder den Fahrer?",
      TRANSPORTATION_SERVICE_PERIOD:
        "Benötigen Sie das Fahrzeug und den Fahrer für einen ganzen oder nur einen halben Tag?",
    },
  };

  const introductions: Record<SupportedLanguage, string> = {
    en: `Of course 😊 I can help you organise your Marrakech stay.

I just need a little more information:`,

    fr: `Bien sûr 😊 Je peux vous aider à organiser votre séjour à Marrakech.

Il me manque simplement quelques informations :`,

    es: `Claro 😊 Puedo ayudarte a organizar tu estancia en Marrakech.

Solo necesito algunos detalles más:`,

    pt: `Claro 😊 Posso ajudar a organizar a sua estadia em Marraquexe.

Só preciso de mais alguns detalhes:`,

    it: `Certo 😊 Posso aiutarti a organizzare il soggiorno a Marrakech.

Mi servono solo alcuni dettagli in più:`,

    de: `Natürlich 😊 Ich helfe Ihnen gerne bei der Planung Ihres Aufenthalts in Marrakesch.

Ich benötige nur noch einige Angaben:`,
  };

  const selectedQuestions = missingInformation
    .map((field) => questions[lang][field])
    .filter((question): question is string => Boolean(question));

  if (selectedQuestions.length === 0) {
    throw new Error(
      `ERROR_MISSING_INFORMATION_MESSAGE_EMPTY: ${missingInformation.join(", ")}`
    );
  }

  return `${introductions[lang]}

${selectedQuestions.map((question) => `- ${question}`).join("\n")}`;
}

function getContactRedirectMessage(language?: string) {
  const lang = normalizeLanguage(language);
  const contactPath = buildFrontendPath("/contact", lang);

  const messages: Record<SupportedLanguage, string> = {
    en: `I can help you with tourism recommendations in Marrakech 😊

For account problems, complaints, partnerships, technical support, or requests not related to tourism, please use our [Contact page](${contactPath}).`,

    fr: `Je peux vous aider avec des recommandations touristiques à Marrakech 😊

Pour les problèmes de compte, réclamations, partenariats, support technique ou demandes non liées au tourisme, veuillez utiliser [la page Contact](${contactPath}).`,

    es: `Puedo ayudarte con recomendaciones turísticas en Marrakech 😊

Para problemas de cuenta, reclamaciones, colaboraciones, soporte técnico o solicitudes no relacionadas con turismo, utiliza [la página de contacto](${contactPath}).`,

    pt: `Posso ajudar com recomendações turísticas em Marraquexe 😊

Para problemas de conta, reclamações, parcerias, suporte técnico ou pedidos não relacionados com turismo, use [a página de contacto](${contactPath}).`,

    it: `Posso aiutarti con raccomandazioni turistiche a Marrakech 😊

Per problemi di account, reclami, partnership, supporto tecnico o richieste non legate al turismo, usa [la pagina Contatti](${contactPath}).`,

    de: `Ich kann Ihnen bei touristischen Empfehlungen in Marrakesch helfen 😊

Für Kontoprobleme, Beschwerden, Partnerschaften, technischen Support oder nicht touristische Anfragen nutzen Sie bitte [die Kontaktseite](${contactPath}).`,
  };

  return messages[lang];
}

function getNoProductMessage(
  language?: string,
  reason: NoProductReason = "UNKNOWN",
  need?: ExtractedChatNeed
) {
  const lang = normalizeLanguage(language);
  const contactPath = buildFrontendPath("/contact", lang);

  const isLargeGroup = Boolean(need?.people && need.people > 16);

  const messages: Record<
    SupportedLanguage,
    Record<NoProductReason, string>
  > = {
    en: {
      BUDGET: `I couldn’t find an option within the current budget 😕

You could adjust the budget or send us a custom request through our [Contact page](${contactPath}).`,

      CAPACITY: `I couldn’t find a single option with enough capacity for your group 😕

${isLargeGroup
  ? "For a group of this size, booking two or three villas may be more suitable."
  : "You may need to consider more than one villa to accommodate everyone comfortably."}

Our team can help you create a suitable arrangement through the [Contact page](${contactPath}).`,

      ROOMS: `I couldn’t find a villa with enough bedrooms for your requested room arrangement 😕

You may need to consider several villas or a different room-sharing arrangement. You can contact our team [here](${contactPath}) for a custom proposal.`,

      NO_MATCH: `I couldn’t find an exact option matching all your criteria 😕

The reason may be the budget, capacity, dates, or the requested number of rooms. You can adjust one of these criteria or send us a custom request through our [Contact page](${contactPath}).`,

      UNKNOWN: `I couldn’t find an exact option matching your request 😕

The issue may be related to the budget, dates, group size, capacity, or number of rooms. For larger groups, several villas may be required.

You can send us a custom request through our [Contact page](${contactPath}).`,
    },

    fr: {
      BUDGET: `Je n’ai pas trouvé d’option correspondant au budget actuel 😕

Vous pouvez ajuster le budget ou nous envoyer une demande personnalisée via [la page Contact](${contactPath}).`,

      CAPACITY: `Je n’ai pas trouvé une seule option ayant une capacité suffisante pour votre groupe 😕

${isLargeGroup
  ? "Pour un groupe de cette taille, il serait probablement plus adapté de réserver deux ou trois villas."
  : "Il peut être nécessaire de prévoir plusieurs villas afin d’accueillir tout le monde confortablement."}

Notre équipe peut vous aider à organiser une solution adaptée via [la page Contact](${contactPath}).`,

      ROOMS: `Je n’ai pas trouvé de villa avec suffisamment de chambres pour la répartition demandée 😕

Vous devrez peut-être envisager plusieurs villas ou une autre répartition des chambres. Vous pouvez contacter notre équipe [ici](${contactPath}) pour une proposition personnalisée.`,

      NO_MATCH: `Je n’ai pas trouvé d’option correspondant exactement à tous vos critères 😕

Cela peut être lié au budget, à la capacité, aux dates ou au nombre de chambres demandé. Vous pouvez ajuster l’un de ces critères ou nous envoyer une demande personnalisée via [la page Contact](${contactPath}).`,

      UNKNOWN: `Je n’ai pas trouvé d’option correspondant exactement à votre demande 😕

Cela peut être lié au budget, aux dates, à la taille du groupe, à la capacité ou au nombre de chambres. Pour les grands groupes, plusieurs villas peuvent être nécessaires.

Vous pouvez nous envoyer une demande personnalisée via [la page Contact](${contactPath}).`,
    },

    es: {
      BUDGET: `No encontré una opción dentro del presupuesto actual 😕

Puedes ajustar el presupuesto o enviarnos una solicitud personalizada desde [la página de contacto](${contactPath}).`,
      CAPACITY: `No encontré una sola opción con capacidad suficiente para el grupo 😕

Puede ser necesario reservar dos o tres villas. Nuestro equipo puede ayudarte desde [la página de contacto](${contactPath}).`,
      ROOMS: `No encontré una villa con suficientes habitaciones para la distribución solicitada 😕

Puede ser necesario reservar varias villas o modificar la distribución. Contacta con nuestro equipo [aquí](${contactPath}).`,
      NO_MATCH: `No encontré una opción que cumpla exactamente todos los criterios 😕

Puede deberse al presupuesto, capacidad, fechas o número de habitaciones. Puedes contactarnos [aquí](${contactPath}).`,
      UNKNOWN: `No encontré una opción exacta 😕

Puede deberse al presupuesto, fechas, tamaño del grupo, capacidad o habitaciones. Para grupos grandes, pueden ser necesarias varias villas. Contáctanos [aquí](${contactPath}).`,
    },

    pt: {
      BUDGET: `Não encontrei uma opção dentro do orçamento atual 😕

Pode ajustar o orçamento ou enviar um pedido personalizado pela [página de contacto](${contactPath}).`,
      CAPACITY: `Não encontrei uma única opção com capacidade suficiente para o grupo 😕

Pode ser necessário reservar duas ou três villas. A nossa equipa pode ajudar [aqui](${contactPath}).`,
      ROOMS: `Não encontrei uma villa com quartos suficientes para a distribuição pedida 😕

Pode ser necessário reservar várias villas ou alterar a distribuição. Contacte-nos [aqui](${contactPath}).`,
      NO_MATCH: `Não encontrei uma opção que corresponda exatamente a todos os critérios 😕

Pode estar relacionado com orçamento, capacidade, datas ou quartos. Contacte-nos [aqui](${contactPath}).`,
      UNKNOWN: `Não encontrei uma opção exata 😕

A razão pode ser orçamento, datas, tamanho do grupo, capacidade ou quartos. Para grupos grandes, podem ser necessárias várias villas. Contacte-nos [aqui](${contactPath}).`,
    },

    it: {
      BUDGET: `Non ho trovato un’opzione compatibile con il budget attuale 😕

Puoi modificare il budget o inviarci una richiesta personalizzata tramite [la pagina Contatti](${contactPath}).`,
      CAPACITY: `Non ho trovato un’unica soluzione con capacità sufficiente per il gruppo 😕

Potrebbe essere necessario prenotare due o tre ville. Contatta il nostro team [qui](${contactPath}).`,
      ROOMS: `Non ho trovato una villa con abbastanza camere per la sistemazione richiesta 😕

Potrebbero essere necessarie più ville o una diversa distribuzione. Contattaci [qui](${contactPath}).`,
      NO_MATCH: `Non ho trovato un’opzione che corrisponda esattamente a tutti i criteri 😕

Può dipendere da budget, capacità, date o camere. Contattaci [qui](${contactPath}).`,
      UNKNOWN: `Non ho trovato un’opzione esatta 😕

Il motivo può essere budget, date, dimensione del gruppo, capacità o camere. Per gruppi numerosi potrebbero servire più ville. Contattaci [qui](${contactPath}).`,
    },

    de: {
      BUDGET: `Ich konnte keine Option innerhalb des aktuellen Budgets finden 😕

Sie können das Budget anpassen oder uns über die [Kontaktseite](${contactPath}) eine individuelle Anfrage senden.`,
      CAPACITY: `Ich konnte keine einzelne Option mit ausreichender Kapazität für die Gruppe finden 😕

Möglicherweise müssen zwei oder drei Villen gebucht werden. Kontaktieren Sie unser Team [hier](${contactPath}).`,
      ROOMS: `Ich konnte keine Villa mit ausreichend Schlafzimmern für die gewünschte Aufteilung finden 😕

Möglicherweise sind mehrere Villen oder eine andere Zimmeraufteilung nötig. Kontaktieren Sie uns [hier](${contactPath}).`,
      NO_MATCH: `Ich konnte keine Option finden, die allen Kriterien genau entspricht 😕

Dies kann am Budget, der Kapazität, den Daten oder der Zimmeranzahl liegen. Kontaktieren Sie uns [hier](${contactPath}).`,
      UNKNOWN: `Ich konnte keine genaue Option finden 😕

Der Grund kann Budget, Daten, Gruppengröße, Kapazität oder Zimmeranzahl sein. Für große Gruppen können mehrere Villen erforderlich sein. Kontaktieren Sie uns [hier](${contactPath}).`,
    },
  };

  return messages[lang][reason];
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    const cleaned = value
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("AI JSON parse failed:", value);
    return fallback;
  }
}

function normalizeCategory(category?: string | null): ProductType | undefined {
  if (!category) return undefined;

  const upper = category.toUpperCase();

  if (upper === "VILLA") return ProductType.VILLA;
  if (upper === "SWIMMINGPOOL") return ProductType.SWIMMINGPOOL;
  if (upper === "ACTIVITY") return ProductType.ACTIVITY;
  if (upper === "SPA") return ProductType.SPA;
  if (upper === "TRANSPORTATION") return ProductType.TRANSPORTATION;
  if (upper === "RESTAURANT") return ProductType.RESTAURANT;

  return undefined;
}

function productPath(product: any, language?: string) {
  const categoryMap: Record<string, string> = {
    VILLA: "villas",
    SWIMMINGPOOL: "swimmingpools",
    ACTIVITY: "activities",
    SPA: "spa",
    TRANSPORTATION: "transportation",
    RESTAURANT: "restaurants",
  };

  const category = categoryMap[product.type] || "products";

  return buildFrontendPath(`/${category}/${product.uniqueCode}`, language);
}

function productSummary(product: any, language?: string) {
  const lang = normalizeLanguage(language).toUpperCase();

  return {
    id: product.id,
    uniqueCode: product.uniqueCode,
    type: product.type,
    priceEuro: product.priceEuro,
    thumbnail: product.thumbnail,
    title:
      product[`title${lang}`] ||
      product.titleEN ||
      product.titleFR ||
      product.uniqueCode,
    subtitle:
      product[`subtitle${lang}`] ||
      product.subtitleEN ||
      product.subtitleFR ||
      "",
    description:
      product[`description${lang}`] ||
      product.descriptionEN ||
      product.descriptionFR ||
      "",
    address:
      product[`address${lang}`] ||
      product.addressEN ||
      product.addressFR ||
      "",
    link: productPath(product, language),
  };
}

async function extractNeed(params: {
  latestMessage: string;
  language?: string;
  history?: ChatHistoryMessage[];
}): Promise<ExtractedChatNeed> {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

    input: [
      {
        role: "system",
        content: `
You extract and merge structured customer needs for a Marrakech tourism concierge assistant.

Your responsibility is only to:
1. Understand the latest user message.
2. Use the conversation history as memory.
3. Extract structured information.
4. Preserve previous information unless the latest message clearly changes it.
5. Identify the user's current intent.

Do not decide whether the extracted information is sufficient for a recommendation.
Do not apply product filtering, budget affordability, room-capacity, vehicle-capacity, or recommendation logic.

LATEST MESSAGE PRIORITY

The latest user message has priority when it clearly corrects, replaces, removes, or adds information.

Examples:

Conversation history:
- 6 people
- 2500 EUR per person
- 15 days
- interested in villas
- maximum two people per room

Latest message:
"We will stay only 5 days."

Expected extracted values:
{
  "people": 6,
  "budgetEuro": 2500,
  "budgetScope": "PER_PERSON",
  "budgetPeriod": "TOTAL_STAY",
  "durationDays": 5,
  "category": "VILLA",
  "roomOccupancy": "TWO_PER_ROOM"
}

Conversation history:
- 4 people
- 300 EUR per person per day
- 10 days
- interested in villas

Latest message:
"Actually, our budget is 140 euros per person."

Because the latest message changes only the amount and does not clearly change the budget period, preserve:
{
  "people": 4,
  "budgetEuro": 140,
  "budgetScope": "PER_PERSON",
  "budgetPeriod": "PER_DAY",
  "durationDays": 10,
  "category": "VILLA"
}

Conversation history:
- 6 people
- 2500 EUR per person
- 15 days
- interested in restaurants

Latest message:
"Show me villas instead."

Expected extracted values:
{
  "people": 6,
  "budgetEuro": 2500,
  "budgetScope": "PER_PERSON",
  "budgetPeriod": "TOTAL_STAY",
  "durationDays": 15,
  "category": "VILLA"
}

Conversation history:
- 6 people
- interested in villas
- one bedroom per person

Latest message:
"Two people can share a room."

Expected roomOccupancy:
"TWO_PER_ROOM"

CURRENT INTENT

GREETING:
- Use when the latest message is only a greeting or light small talk.
- Examples:
  - hello
  - hi
  - hello amigo
  - bonjour
  - bonjour mon ami
  - salut
  - salam
  - hola
  - ciao
  - hallo
- Do not use GREETING if the latest message also contains a tourism request.

REDIRECT_CONTACT:
- Use when the latest request concerns:
  - account problems;
  - forgotten password;
  - login or authentication;
  - complaints;
  - refunds or payment disputes;
  - partnerships or business proposals;
  - technical support;
  - legal matters;
  - requests unrelated to Marrakech tourism.
- The latest message must control this intent even when the previous conversation was about tourism.

NEEDS_MORE_INFO:
- Use when the user expresses a tourism interest or asks for recommendations, but the request is still incomplete or unclear.
- Do not invent missing values.
- Missing information will be validated separately by backend code.

TOURISM_RECOMMENDATION:
- Use when the latest message asks for a tourism recommendation, continues an existing tourism request, changes a previously supplied value, requests another product category, or asks to see alternatives.
- The backend will separately determine whether enough information exists to search products.

CATEGORY RULES

Set category to:

- VILLA:
  - villa
  - accommodation
  - place to stay
  - lodging
  - riad
  - house
  - hotel-style accommodation request

- TRANSPORTATION:
  - transportation
  - driver
  - chauffeur
  - vehicle
  - car
  - van
  - minibus
  - airport transfer
  - transfer

- SWIMMINGPOOL:
  - swimming pool
  - pool
  - pool day
  - day pass

- ACTIVITY:
  - activity
  - excursion
  - tour
  - quad
  - camel
  - hot-air balloon
  - desert experience
  - cultural visit

- RESTAURANT:
  - restaurant
  - lunch
  - dinner
  - food
  - dining
  - brunch

- SPA:
  - spa
  - hammam
  - massage
  - wellness
  - beauty treatment

MULTIPLE INTERESTS

The current schema supports one primary category and a preferences array.

When several interests are mentioned:
- Set category to the highest-priority explicit interest using this order:
  1. VILLA
  2. TRANSPORTATION
  3. SWIMMINGPOOL
  4. ACTIVITY
  5. RESTAURANT
  6. SPA
- Add all other requested interests to preferences.
- Preserve previously stated interests when the latest message adds another interest.
- If the user clearly replaces the previous category, update category accordingly.

Examples:

"We need a villa, a driver and some restaurants."

Return:
{
  "category": "VILLA",
  "preferences": [
    "TRANSPORTATION",
    "RESTAURANT"
  ]
}

"We no longer need a villa, only transportation."

Return:
{
  "category": "TRANSPORTATION",
  "preferences": []
}

CATEGORY-SPECIFIC NEEDS

Maintain a separate need object for every requested product category.
A customer can have different people counts, durations and budgets by category.

Examples:
- 12 travellers stay in a villa, but only 6 need transportation.
- The villa is required for 10 days, while transportation is required for only 7 days.
- A customer may have one budget for accommodation and another for activities.

Store these values inside categoryNeeds. Never overwrite another category's values.
The top-level fields represent the currently active category only and are kept for compatibility.

For transportation:
- durationDays means the number of days the vehicle is needed, not the total trip duration.
- transportationServicePeriod is HALF_DAY or FULL_DAY.
- HALF_DAY means the vehicle price is later calculated as 50% of the daily price.

Expected categoryNeeds example:
{
  "VILLA": {
    "people": 12,
    "durationDays": 10,
    "budgetEuro": 300,
    "budgetScope": "PER_PERSON",
    "budgetPeriod": "PER_DAY",
    "roomOccupancy": "TWO_PER_ROOM"
  },
  "TRANSPORTATION": {
    "people": 6,
    "durationDays": 7,
    "budgetEuro": 1200,
    "budgetScope": "GROUP",
    "budgetPeriod": "TOTAL_STAY",
    "transportationServicePeriod": "FULL_DAY"
  }
}

PEOPLE RULES

Extract the number of travellers or guests.

Examples:
- "We are six" => people = 6
- "We are a couple" => people = 2
- "I am alone" => people = 1
- "There are 12 of us" => people = 12

If the latest message corrects the number of people, replace the previous value.

DURATION RULES

Extract durationDays as a number of days.

Examples:
- "10 days" => 10
- "two weeks" => 14
- "one month" => 30, unless exact dates provide a more precise duration

If the latest message changes only the duration, preserve all other values.

BUDGET AMOUNT RULES

Extract only the numeric budget amount into budgetEuro.

Examples:
- "100 euros per person per day" => budgetEuro = 100
- "15000 euros for the group" => budgetEuro = 15000
- "our budget becomes 4000 euros each" => budgetEuro = 4000

Do not multiply or divide the budget.
All calculations are performed later by backend code.

BUDGET SCOPE RULES

Set budgetScope to PER_PERSON when the user says:
- per person
- each person
- each of us
- individually
- par personne
- chacun
- pour chacun
- por persona
- por pessoa
- a persona
- pro Person

Set budgetScope to GROUP when the user says:
- for the group
- group budget
- total for everyone
- total for all of us
- pour le groupe
- budget total
- pour nous tous
- para el grupo
- para o grupo
- per il gruppo
- für die Gruppe

If the latest message does not change the budget scope, preserve it from history.

BUDGET PERIOD RULES

Set budgetPeriod to PER_DAY when the user says:
- per day
- a day
- daily
- every day
- par jour
- quotidien
- chaque jour
- por día
- por dia
- al giorno
- pro Tag
- per person per day
- par personne et par jour

Set budgetPeriod to TOTAL_STAY when the user clearly says:
- for the whole stay
- total trip budget
- total holiday budget
- for all 10 days
- pour tout le séjour
- pour l'ensemble du séjour
- budget total du séjour
- para toda la estancia
- para toda a estadia
- per tutto il soggiorno
- für den gesamten Aufenthalt

Important:
- Do not assume TOTAL_STAY merely because durationDays exists.
- If the budget period is unclear and no previous value exists, return null.
- Preserve the previous budgetPeriod unless the latest message explicitly changes it.

Examples:

"100 euros per day for each person"
=> budgetEuro = 100
=> budgetScope = PER_PERSON
=> budgetPeriod = PER_DAY

"15000 euros for the group for the full 10-day stay"
=> budgetEuro = 15000
=> budgetScope = GROUP
=> budgetPeriod = TOTAL_STAY

"300 euros per person"
=> budgetEuro = 300
=> budgetScope = PER_PERSON
=> budgetPeriod = null, unless history already contains the period

ROOM OCCUPANCY RULES

roomOccupancy applies only to villa or accommodation requests.

Set ONE_PER_PERSON when the user requests:
- one bedroom per person
- one room each
- separate rooms for everyone
- chacun sa chambre
- une chambre par personne
- una habitación por persona
- um quarto por pessoa
- una camera a persona
- ein Zimmer pro Person

Set TWO_PER_ROOM when the user accepts:
- maximum two people per bedroom
- two people per room
- couples can share
- deux personnes par chambre
- maximum deux par chambre
- dos personas por habitación
- duas pessoas por quarto
- due persone per camera
- zwei Personen pro Zimmer

Do not assume a room-occupancy preference if it was never stated.
Preserve it from history unless the latest message changes it.

TRANSPORTATION SERVICE PERIOD RULES

Set transportationServicePeriod to HALF_DAY when the user says:
- half day
- morning only
- afternoon only
- demi-journée
- media jornada
- meio dia
- mezza giornata
- halber Tag

Set transportationServicePeriod to FULL_DAY when the user says:
- full day
- entire day
- all day
- journée complète
- día completo
- dia inteiro
- giornata intera
- ganzer Tag

Preserve the transportation service period in categoryNeeds.TRANSPORTATION unless the latest message changes it.

PREFERENCES

Use preferences for:
- secondary product interests;
- requested atmosphere;
- luxury level;
- location;
- amenities;
- private pool;
- nightlife;
- relaxation;
- family-oriented needs;
- romantic trip;
- accessibility;
- chef or maid;
- dietary preferences;
- any other useful customer preference.

Do not place required structured values such as people, budget, duration or roomOccupancy inside preferences.

Return ONLY valid JSON.
Do not return Markdown.
Do not add comments outside the JSON.

Required JSON shape:

{
  "intent": "GREETING" | "NEEDS_MORE_INFO" | "TOURISM_RECOMMENDATION" | "REDIRECT_CONTACT",
  "reason": "short explanation",
  "category": "VILLA" | "SWIMMINGPOOL" | "ACTIVITY" | "SPA" | "TRANSPORTATION" | "RESTAURANT" | null,
  "interests": ("VILLA" | "SWIMMINGPOOL" | "ACTIVITY" | "SPA" | "TRANSPORTATION" | "RESTAURANT")[],
  "categoryNeeds": {
    "VILLA"?: CategoryNeed,
    "SWIMMINGPOOL"?: CategoryNeed,
    "ACTIVITY"?: CategoryNeed,
    "SPA"?: CategoryNeed,
    "TRANSPORTATION"?: CategoryNeed,
    "RESTAURANT"?: CategoryNeed
  },
  "people": number | null,
  "budgetEuro": number | null,
  "budgetScope": "GROUP" | "PER_PERSON" | null,
  "budgetPeriod": "TOTAL_STAY" | "PER_DAY" | null,
  "durationDays": number | null,
  "roomOccupancy": "ONE_PER_PERSON" | "TWO_PER_ROOM" | null,
  "transportationServicePeriod": "HALF_DAY" | "FULL_DAY" | null,
  "preferences": string[]
}
        `,
      },

      {
        role: "user",
        content: JSON.stringify({
          latestMessage: params.latestMessage,
          conversationHistory: params.history || [],
        }),
      },
    ],
  });

  const parsed = safeJsonParse<any>(response.output_text, {
    intent: "NEEDS_MORE_INFO",
    reason: "The request could not be extracted reliably.",
    category: null,
    interests: [],
    categoryNeeds: {},
    people: null,
    budgetEuro: null,
    budgetScope: null,
    budgetPeriod: null,
    durationDays: null,
    roomOccupancy: null,
    transportationServicePeriod: null,
    preferences: [],
  });

  const intent: ChatIntent =
    parsed.intent === "GREETING"
      ? "GREETING"
      : parsed.intent === "TOURISM_RECOMMENDATION"
        ? "TOURISM_RECOMMENDATION"
        : parsed.intent === "REDIRECT_CONTACT"
          ? "REDIRECT_CONTACT"
          : "NEEDS_MORE_INFO";

  const people =
    typeof parsed.people === "number" &&
    Number.isFinite(parsed.people) &&
    parsed.people > 0
      ? Math.floor(parsed.people)
      : undefined;

  const budgetEuro =
    typeof parsed.budgetEuro === "number" &&
    Number.isFinite(parsed.budgetEuro) &&
    parsed.budgetEuro > 0
      ? parsed.budgetEuro
      : undefined;

  const durationDays =
    typeof parsed.durationDays === "number" &&
    Number.isFinite(parsed.durationDays) &&
    parsed.durationDays > 0
      ? Math.ceil(parsed.durationDays)
      : undefined;

  const budgetScope =
    parsed.budgetScope === "GROUP" ||
    parsed.budgetScope === "PER_PERSON"
      ? parsed.budgetScope
      : undefined;

  const budgetPeriod =
    parsed.budgetPeriod === "PER_DAY" ||
    parsed.budgetPeriod === "TOTAL_STAY"
      ? parsed.budgetPeriod
      : undefined;

  const roomOccupancy =
    parsed.roomOccupancy === "ONE_PER_PERSON" ||
    parsed.roomOccupancy === "TWO_PER_ROOM"
      ? parsed.roomOccupancy
      : undefined;

  const transportationServicePeriod =
    parsed.transportationServicePeriod === "HALF_DAY" ||
    parsed.transportationServicePeriod === "FULL_DAY"
      ? parsed.transportationServicePeriod
      : undefined;

  const parsedInterests: ProductType[] = Array.isArray(parsed.interests)
    ? parsed.interests
        .map((interest: unknown) =>
          typeof interest === "string" ? normalizeCategory(interest) : undefined
        )
        .filter((interest: ProductType | undefined): interest is ProductType =>
          Boolean(interest)
        )
    : [];

  const category = normalizeCategory(parsed.category);
  const interests: ProductType[] = Array.from(
    new Set([...(category ? [category] : []), ...parsedInterests])
  );

  const categoryNeeds: Partial<Record<ProductType, CategoryNeed>> = {};

  if (parsed.categoryNeeds && typeof parsed.categoryNeeds === "object") {
    for (const [rawType, rawNeed] of Object.entries(parsed.categoryNeeds)) {
      const type = normalizeCategory(rawType);

      if (!type || !rawNeed || typeof rawNeed !== "object") {
        continue;
      }

      const value = rawNeed as Record<string, unknown>;
      const categoryPreferences = Array.isArray(value.preferences)
        ? value.preferences.filter(
            (preference: unknown): preference is string =>
              typeof preference === "string"
          )
        : [];

      categoryNeeds[type] = {
        people:
          typeof value.people === "number" && value.people > 0
            ? Math.floor(value.people)
            : undefined,
        durationDays:
          typeof value.durationDays === "number" && value.durationDays > 0
            ? Math.ceil(value.durationDays)
            : undefined,
        budgetEuro:
          typeof value.budgetEuro === "number" && value.budgetEuro > 0
            ? value.budgetEuro
            : undefined,
        budgetScope:
          value.budgetScope === "GROUP" || value.budgetScope === "PER_PERSON"
            ? value.budgetScope
            : undefined,
        budgetPeriod:
          value.budgetPeriod === "PER_DAY" ||
          value.budgetPeriod === "TOTAL_STAY"
            ? value.budgetPeriod
            : undefined,
        roomOccupancy:
          value.roomOccupancy === "ONE_PER_PERSON" ||
          value.roomOccupancy === "TWO_PER_ROOM"
            ? value.roomOccupancy
            : undefined,
        transportationServicePeriod:
          value.transportationServicePeriod === "HALF_DAY" ||
          value.transportationServicePeriod === "FULL_DAY"
            ? value.transportationServicePeriod
            : undefined,
        preferences: categoryPreferences,
      };

      if (!interests.includes(type)) {
        interests.push(type);
      }
    }
  }

  if (category) {
    categoryNeeds[category] = {
      ...categoryNeeds[category],
      people: people ?? categoryNeeds[category]?.people,
      durationDays: durationDays ?? categoryNeeds[category]?.durationDays,
      budgetEuro: budgetEuro ?? categoryNeeds[category]?.budgetEuro,
      budgetScope: budgetScope ?? categoryNeeds[category]?.budgetScope,
      budgetPeriod: budgetPeriod ?? categoryNeeds[category]?.budgetPeriod,
      roomOccupancy: roomOccupancy ?? categoryNeeds[category]?.roomOccupancy,
      transportationServicePeriod:
        transportationServicePeriod ??
        categoryNeeds[category]?.transportationServicePeriod,
    };
  }

  const preferences : string[] = Array.isArray(parsed.preferences)
    ? Array.from(
        new Set(
          parsed.preferences
            .filter(
              (preference: unknown): preference is string =>
                typeof preference === "string"
            )
            .map((preference: string) => preference.trim())
            .filter(Boolean)
        )
      )
    : [];

  return {
    intent,

    reason:
      typeof parsed.reason === "string"
        ? parsed.reason.trim()
        : "",

    category,

    interests,

    categoryNeeds,

    people,

    budgetEuro,

    budgetScope,

    budgetPeriod,

    durationDays,

    roomOccupancy,

    transportationServicePeriod,

    preferences,
  };
}

function getDetailsByLanguage(product: any, language?: string) {
  const lang = normalizeLanguage(language).toUpperCase();

  return (
    product[`details${lang}`] ||
    product.detailsEN ||
    product.detailsFR ||
    []
  );
}

function getTechRooms(product: any, language?: string) {
  const details = getDetailsByLanguage(product, language);

  const tech = details.find(
    (detail: any) => typeof detail.techRooms === "number"
  );

  return tech?.techRooms || null;
}

function getTechSeats(product: any, language?: string) {
  const details = getDetailsByLanguage(product, language);

  const tech = details.find(
    (detail: any) => typeof detail.techSeats === "number"
  );

  return tech?.techSeats || null;
}

function getEffectiveNeedForType(
  need: ExtractedChatNeed,
  type: ProductType
): ExtractedChatNeed {
  const categoryNeed = getCategoryNeed(need, type);

  return {
    ...need,
    category: type,
    people: categoryNeed.people,
    durationDays: categoryNeed.durationDays,
    budgetEuro: categoryNeed.budgetEuro,
    budgetScope: categoryNeed.budgetScope,
    budgetPeriod: categoryNeed.budgetPeriod,
    roomOccupancy: categoryNeed.roomOccupancy,
    transportationServicePeriod:
      categoryNeed.transportationServicePeriod,
    preferences: categoryNeed.preferences ?? need.preferences,
  };
}

function getTotalBudget(
  need: ExtractedChatNeed,
  type: ProductType = need.category || ProductType.VILLA
) {
  const effectiveNeed = getEffectiveNeedForType(need, type);

  if (
    !effectiveNeed.budgetEuro ||
    !effectiveNeed.people ||
    !effectiveNeed.durationDays
  ) {
    return null;
  }

  if (effectiveNeed.budgetPeriod === "PER_DAY") {
    if (effectiveNeed.budgetScope === "PER_PERSON") {
      return (
        effectiveNeed.budgetEuro *
        effectiveNeed.people *
        effectiveNeed.durationDays
      );
    }

    return effectiveNeed.budgetEuro * effectiveNeed.durationDays;
  }

  if (effectiveNeed.budgetScope === "PER_PERSON") {
    return effectiveNeed.budgetEuro * effectiveNeed.people;
  }

  return effectiveNeed.budgetEuro;
}

function getBudgetPerPersonPerDay(
  need: ExtractedChatNeed,
  type: ProductType = need.category || ProductType.VILLA
) {
  const effectiveNeed = getEffectiveNeedForType(need, type);

  if (
    !effectiveNeed.budgetEuro ||
    !effectiveNeed.people ||
    !effectiveNeed.durationDays ||
    !effectiveNeed.budgetScope ||
    !effectiveNeed.budgetPeriod
  ) {
    return null;
  }

  if (
    effectiveNeed.budgetScope === "PER_PERSON" &&
    effectiveNeed.budgetPeriod === "PER_DAY"
  ) {
    return effectiveNeed.budgetEuro;
  }

  if (
    effectiveNeed.budgetScope === "GROUP" &&
    effectiveNeed.budgetPeriod === "PER_DAY"
  ) {
    return effectiveNeed.budgetEuro / effectiveNeed.people;
  }

  if (
    effectiveNeed.budgetScope === "PER_PERSON" &&
    effectiveNeed.budgetPeriod === "TOTAL_STAY"
  ) {
    return effectiveNeed.budgetEuro / effectiveNeed.durationDays;
  }

  return (
    effectiveNeed.budgetEuro /
    effectiveNeed.people /
    effectiveNeed.durationDays
  );
}

function getTotalDailyBudgetForGroup(
  need: ExtractedChatNeed,
  type: ProductType
) {
  const effectiveNeed = getEffectiveNeedForType(need, type);
  const budgetPerPersonPerDay = getBudgetPerPersonPerDay(need, type);

  if (!budgetPerPersonPerDay || !effectiveNeed.people) {
    return null;
  }

  return budgetPerPersonPerDay * effectiveNeed.people;
}

function getRequiredRooms(need: ExtractedChatNeed) {
  const effectiveNeed = getEffectiveNeedForType(need, ProductType.VILLA);

  if (!effectiveNeed.people || !effectiveNeed.roomOccupancy) {
    return null;
  }

  if (effectiveNeed.roomOccupancy === "ONE_PER_PERSON") {
    return effectiveNeed.people;
  }

  return Math.ceil(effectiveNeed.people / 2);
}

function getProductCostPerPersonPerDay(
  product: any,
  need: ExtractedChatNeed
) {
  const type = product.type as ProductType;
  const effectiveNeed = getEffectiveNeedForType(need, type);

  if (!effectiveNeed.people) {
    return null;
  }

  if (type === ProductType.VILLA) {
    return product.priceEuro / effectiveNeed.people;
  }

  if (type === ProductType.TRANSPORTATION) {
    const dailyPrice =
      effectiveNeed.transportationServicePeriod === "HALF_DAY"
        ? product.priceEuro / 2
        : product.priceEuro;

    return dailyPrice / effectiveNeed.people;
  }

  return product.priceEuro;
}

function isAffordable(
  product: any,
  need: ExtractedChatNeed
) {
  const budgetPerPersonPerDay = getBudgetPerPersonPerDay(
    need,
    product.type as ProductType
  );
  const costPerPersonPerDay = getProductCostPerPersonPerDay(product, need);

  if (
    budgetPerPersonPerDay === null ||
    costPerPersonPerDay === null
  ) {
    return false;
  }

  const toleranceEuro =
    product.type === ProductType.TRANSPORTATION ? 5 : 0;

  return costPerPersonPerDay <= budgetPerPersonPerDay + toleranceEuro;
}



function isVillaCapacityValid(product: any, need: ExtractedChatNeed, language?: string) {
  const villaNeed = getEffectiveNeedForType(need, ProductType.VILLA);

  if (!villaNeed.people) return true;

  const techRooms = getTechRooms(product, language);
  const requiredRooms = getRequiredRooms(need);

  console.log('techRooms', techRooms, 'requiredRooms', requiredRooms);

  if (!techRooms || !requiredRooms) return true;

  if (techRooms < requiredRooms) return false;

  if (villaNeed.people <= 2 && techRooms > 4) return false;
  if (villaNeed.people <= 4 && techRooms > 6) return false;

  return true;
}

function isTransportationCapacityValid(
  product: any,
  need: ExtractedChatNeed,
  language?: string
) {
  const transportationNeed = getEffectiveNeedForType(
    need,
    ProductType.TRANSPORTATION
  );

  if (!transportationNeed.people) return true;

  const techSeats = getTechSeats(product, language);

  if (!techSeats) return true;

  // techSeats includes the driver, so passengers must be <= techSeats - 1
  return techSeats >= transportationNeed.people + 1;
}

function isProductCapacityValid(product: any, need: ExtractedChatNeed, language?: string) {
  if (product.type === ProductType.VILLA) {
    return isVillaCapacityValid(product, need, language);
  }

  if (product.type === ProductType.TRANSPORTATION) {
    return isTransportationCapacityValid(product, need, language);
  }

  return true;
}

function getInterestedTypes(need: ExtractedChatNeed) {
  const requestedTypes = getRequestedProductTypes(need);

  if (requestedTypes.length > 0) {
    return requestedTypes;
  }

  return [
    ProductType.VILLA,
    ProductType.TRANSPORTATION,
    ProductType.SWIMMINGPOOL,
    ProductType.ACTIVITY,
    ProductType.RESTAURANT,
    ProductType.SPA,
  ];
}

function scoreProduct(product: any, need: ExtractedChatNeed, language?: string) {
  let score = 0;

  score += PRODUCT_PRIORITY[product.type as ProductType] * 1000;

  const budgetPerPersonPerDay = getBudgetPerPersonPerDay(
    need,
    product.type as ProductType
  );
  const costPerPersonPerDay = getProductCostPerPersonPerDay(product, need);

  if (budgetPerPersonPerDay) {
    const remaining = budgetPerPersonPerDay - costPerPersonPerDay;

    if (remaining >= 0) {
      score -= Math.min(remaining, 200);
    } else {
      score += Math.abs(remaining) * 20;
    }
  }

  const effectiveNeed = getEffectiveNeedForType(
    need,
    product.type as ProductType
  );

  if (product.type === ProductType.VILLA && effectiveNeed.people) {
    const techRooms = getTechRooms(product, language);
    const requiredRooms = getRequiredRooms(need);

    if (techRooms && requiredRooms) {
      score += Math.abs(techRooms - requiredRooms) * 30;
    }
  }

  return score;
}

async function findRecommendations(
  need: ExtractedChatNeed,
  language?: string
): Promise<ProductRecommendation[]> {
  const interestedTypes = getInterestedTypes(need);

  const products = await prisma.product.findMany({
    where: {
      type: {
        in: interestedTypes,
      },
    },
    take: 200,
  });

  const recommendations = products
    .map((product) =>
      buildProductRecommendation(product, need, language)
    )
    .filter(
      (
        recommendation
      ): recommendation is ProductRecommendation =>
        recommendation !== null
    )
    .filter((recommendation) => recommendation.capacityValid)
    .filter((recommendation) => recommendation.affordable)
    .sort((a, b) => a.score - b.score);

  return recommendations.slice(0, 8);
}

function buildProductRecommendation(
  product: any,
  need: ExtractedChatNeed,
  language?: string
): ProductRecommendation | null {
  const type = product.type as ProductType;
  const budgetPerPersonPerDay = getBudgetPerPersonPerDay(need, type);
  const totalDailyBudgetForGroup = getTotalDailyBudgetForGroup(need, type);
  const costPerPersonPerDay = getProductCostPerPersonPerDay(product, need);

  if (
    budgetPerPersonPerDay === null ||
    totalDailyBudgetForGroup === null ||
    costPerPersonPerDay === null
  ) {
    return null;
  }

  const techRooms =
    product.type === ProductType.VILLA
      ? getTechRooms(product, language)
      : null;

  const techSeats =
    product.type === ProductType.TRANSPORTATION
      ? getTechSeats(product, language)
      : null;

  const capacityValid = isProductCapacityValid(
    product,
    need,
    language
  );

  const affordable = isAffordable(product, need);

  const remainingBudgetPerPersonPerDay =
    budgetPerPersonPerDay - costPerPersonPerDay;

  return {
    product,

    affordable,

    productPriceEuro: product.priceEuro,

    budgetPerPersonPerDay,

    costPerPersonPerDay,

    remainingBudgetPerPersonPerDay,

    totalDailyBudgetForGroup,

    techRooms,

    techSeats,

    capacityValid,

    score: scoreProduct(product, need, language),
  };
}

async function buildRecommendationAnswer(params: {
  latestMessage: string;
  language?: string;
  history?: ChatHistoryMessage[];
  need: ExtractedChatNeed;
  recommendations: ProductRecommendation[];
}) {
  const language = normalizeLanguage(params.language);

  const formattedRecommendations = params.recommendations.map(
    (recommendation) => ({
      product: productSummary(recommendation.product, language),

      affordability: {
        affordable: recommendation.affordable,

        productPriceEuro: Number(
          recommendation.productPriceEuro.toFixed(2)
        ),

        budgetPerPersonPerDay: Number(
          recommendation.budgetPerPersonPerDay.toFixed(2)
        ),

        costPerPersonPerDay: Number(
          recommendation.costPerPersonPerDay.toFixed(2)
        ),

        remainingBudgetPerPersonPerDay: Number(
          recommendation.remainingBudgetPerPersonPerDay.toFixed(2)
        ),

        totalDailyBudgetForGroup: Number(
          recommendation.totalDailyBudgetForGroup.toFixed(2)
        ),
      },

      capacity: {
        valid: recommendation.capacityValid,
        techRooms: recommendation.techRooms ?? null,
        techSeats: recommendation.techSeats ?? null,
      },

      score: Number(recommendation.score.toFixed(2)),
    })
  );

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

    input: [
      {
        role: "system",
        content: `
You are Moorly, a friendly Marrakech tourism concierge assistant.

Your role in this step is only to format and explain recommendations that were already calculated and validated by the backend.

The backend has already:
- extracted the customer request;
- calculated the budget;
- calculated the cost per person per day;
- checked affordability;
- checked villa rooms;
- checked vehicle seats;
- filtered invalid products;
- ranked the recommendations.

You must not redo these calculations.

Rules:
- ${getLanguageInstruction(language)}
- Be warm, friendly, engaging, concise, and professional.
- Use a few relevant emojis, but do not overuse them.
- Recommend only products contained in the provided recommendations list.
- Never invent products, prices, villas, vehicles, restaurants, activities, services, or links.
- Never claim that no product exists when recommendations are provided.
- Never say that an affordable product is unaffordable.
- Never contradict the affordability or capacity values supplied by the backend.
- Never recalculate prices, budgets, costs per person, remaining budget, rooms, or seats.
- Use only the exact calculated numbers provided inside affordability.
- Use only the exact product link provided inside product.link.
- Never display raw URLs as visible text.
- Every recommended product must contain a clickable Markdown link.
- Example:
  Villa Atlas Pearl is a good fit — [view the villa here](PRODUCT_LINK)
- Mention the product price.
- Briefly explain why the product matches the budget and group.
- For villas and transportation:
  - productPriceEuro is the group price per day;
  - costPerPersonPerDay is the calculated individual daily cost.
- For swimming pools, activities, restaurants, and spa:
  - productPriceEuro is generally the price per person;
  - use the backend affordability values exactly as provided.
- If budgetScope is PER_PERSON, explain that the stated budget is per person.
- If budgetScope is GROUP, explain that the stated budget covers the whole group.
- If budgetPeriod is PER_DAY, explain that it is a daily budget.
- If budgetPeriod is TOTAL_STAY, explain that it covers the complete stay.
- If remainingBudgetPerPersonPerDay is positive, you may mention how much remains available per person and per day.
- If capacity.techRooms is available, mention the number of rooms only when useful.
- If capacity.techSeats is available, mention the number of seats only when useful.
- If several categories are included, respect this order:
  1. Villa
  2. Transportation
  3. Swimming pool
  4. Activities
  5. Restaurants
  6. Spa
- Do not repeat questions for details already available in extractedNeed.
- Keep the response reasonably short.
- End with one short and relevant follow-up question.
        `,
      },
      {
        role: "user",
        content: JSON.stringify({
          latestMessage: params.latestMessage,
          conversationHistory: params.history || [],
          extractedNeed: params.need,
          recommendations: formattedRecommendations,
        }),
      },
    ],
  });

  const reply = response.output_text?.trim();

  if (!reply) {
    throw new Error("ERROR_EMPTY_AI_RECOMMENDATION");
  }

  return reply;
}

function isPureGreeting(message: string) {
  const text = message.trim().toLowerCase();

  const greetingPatterns = [
    /^bonjour[\s!.?,]*(amigo|ami|l'ami|mon ami|hello|salut)?[\s!.?,]*$/,
    /^salut[\s!.?,]*(amigo|ami|l'ami|mon ami)?[\s!.?,]*$/,
    /^hello[\s!.?,]*(friend|amigo|bro|there)?[\s!.?,]*$/,
    /^hi[\s!.?,]*(friend|there|bro)?[\s!.?,]*$/,
    /^hey[\s!.?,]*(friend|there|bro)?[\s!.?,]*$/,
    /^salam[\s!.?,]*(alaykoum|amigo|khoya|khouya)?[\s!.?,]*$/,
    /^hola[\s!.?,]*(amigo|amiga)?[\s!.?,]*$/,
    /^olá[\s!.?,]*(amigo|amiga)?[\s!.?,]*$/,
    /^ciao[\s!.?,]*(amico|amica)?[\s!.?,]*$/,
    /^hallo[\s!.?,]*(freund)?[\s!.?,]*$/,
    /^good morning[\s!.?,]*$/,
    /^good evening[\s!.?,]*$/,
    /^bonsoir[\s!.?,]*$/,
  ];

  return greetingPatterns.some((pattern) => pattern.test(text));
}

function isClarificationQuestion(message: string) {
  const text = message.trim().toLowerCase();

  const questions = [
    // French
    "quel détail ?",
    "quels détails ?",
    "quel detail ?",
    "quels details ?",
    "de quels détails",
    "de quels details",
    "c'est quoi les détails",
    "quels sont les détails",
    "lesquels ?",
    "lesquelles ?",

    // English
    "what details",
    "which details",
    "what do you need",
    "which information",
    "what information",

    // Spanish
    "qué detalles",
    "qué información",

    // Portuguese
    "que detalhes",
    "que informação",

    // Italian
    "quali dettagli",
    "quali informazioni",

    // German
    "welche details",
    "welche informationen",
  ];

  return questions.some((q) => text.includes(q));
}

function getClarificationMessage(language?: string) {
  const lang = normalizeLanguage(language);

  const messages: Record<SupportedLanguage, string> = {
    en: `To prepare the best recommendation 😊 I still need a few details:

• How many people are travelling?
• How many days will you stay?
• What is your budget?
• Is that budget for the whole group or per person?
• What kind of trip are you looking for? (relaxation, luxury, nightlife, adventure, family, etc.)`,

    fr: `Pour vous préparer la meilleure recommandation 😊 j'ai encore besoin de quelques informations :

• Combien de personnes voyagent ?
• Combien de jours resterez-vous à Marrakech ?
• Quel est votre budget ?
• Est-ce un budget pour tout le groupe ou par personne ?
• Quel type de séjour recherchez-vous ? (détente, luxe, aventure, famille, soirées, etc.)`,

    es: `Para preparar la mejor recomendación 😊 todavía necesito algunos datos:

• ¿Cuántas personas viajan?
• ¿Cuántos días estarán?
• ¿Cuál es el presupuesto?
• ¿Es un presupuesto para todo el grupo o por persona?
• ¿Qué tipo de viaje buscan? (relax, lujo, aventura, familia, etc.)`,

    pt: `Para preparar a melhor recomendação 😊 ainda preciso de algumas informações:

• Quantas pessoas viajam?
• Quantos dias vão ficar?
• Qual é o orçamento?
• O orçamento é para todo o grupo ou por pessoa?
• Que tipo de viagem procuram? (relaxamento, luxo, aventura, família, etc.)`,

    it: `Per preparare il miglior itinerario 😊 ho ancora bisogno di alcune informazioni:

• Quante persone viaggiano?
• Quanti giorni resterete?
• Qual è il budget?
• Il budget è per tutto il gruppo o per persona?
• Che tipo di soggiorno cercate? (relax, lusso, avventura, famiglia, ecc.)`,

    de: `Damit ich die beste Empfehlung erstellen kann 😊 benötige ich noch einige Informationen:

• Wie viele Personen reisen?
• Wie viele Tage bleiben Sie?
• Wie hoch ist Ihr Budget?
• Gilt das Budget für die ganze Gruppe oder pro Person?
• Welche Art von Aufenthalt wünschen Sie? (Entspannung, Luxus, Abenteuer, Familie usw.)`,
  };

  return messages[lang];
}

export async function generateAiChatResponse(params: {
  message: string;
  language?: string;
  history?: ChatHistoryMessage[];
}) {
  const language = normalizeLanguage(params.language);
  const history = params.history || [];

  /*
   * Hard deterministic rules only.
   * These must override any previous tourism context.
   */
  if (isContactRedirectRequest(params.message)) {
    return {
      reply: getContactRedirectMessage(language),
      intent: "REDIRECT_CONTACT",
      products: [],
    };
  }

  if (isPureGreeting(params.message)) {
    return {
      reply: getGreetingMessage(language),
      intent: "GREETING",
      products: [],
    };
  }

  /*
   * Extract and merge the current need with conversation history.
   */
  const need = await extractNeed({
    latestMessage: params.message,
    language,
    history,
  });

  console.log("Extracted need:", need);

  /*
   * Respect support/contact and greeting intents.
   */
  if (need.intent === "REDIRECT_CONTACT") {
    return {
      reply: getContactRedirectMessage(language),
      intent: "REDIRECT_CONTACT",
      products: [],
    };
  }

  if (need.intent === "GREETING") {
    return {
      reply: getGreetingMessage(language),
      intent: "GREETING",
      products: [],
    };
  }

  /*
   * The backend—not OpenAI—decides whether information is missing.
   *
   * We deliberately do NOT use:
   *
   * if (need.intent === "NEEDS_MORE_INFO")
   *
   * because the AI intent may be stale or inconsistent after the user
   * provides the final missing value.
   */
  const missingInformation = getMissingInformation(need);

  console.log("Missing information:", missingInformation);

  if (missingInformation.length > 0) {
    return {
      reply: getMoreInfoMessage(
        language,
        missingInformation
      ),
      intent: "NEEDS_MORE_INFO",
      products: [],
    };
  }

  /*
   * At this point, all required information exists.
   * We must continue to recommendation generation even if OpenAI returned
   * NEEDS_MORE_INFO as the extracted intent.
   */
  const recommendations = await findRecommendations(
    need,
    language
  );

  console.log(
    "Recommendations found:",
    recommendations.length
  );

  if (recommendations.length === 0) {
    return {
      reply: getNoProductMessage(
        language,
        "UNKNOWN",
        need
      ),
      intent: "TOURISM_RECOMMENDATION",
      products: [],
    };
  }

  const aiReply = await buildRecommendationAnswer({
    latestMessage: params.message,
    language,
    history,
    need,
    recommendations,
  });

  const recommendedProducts = recommendations.map(
    (recommendation) => recommendation.product
  );

  const reply = appendProductLinksIfMissing(
    aiReply,
    recommendedProducts,
    language
  );

  return {
    reply,
    intent: "TOURISM_RECOMMENDATION",
    products: recommendedProducts.map((product) =>
      productSummary(product, language)
    ),
  };
}