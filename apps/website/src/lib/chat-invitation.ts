import type { Locale } from "./i18n";

export const CHAT_INVITATION_SESSION_KEY = "moorish.cecile-invitation.v1";
export const CHAT_INVITATION_DELAY_MS = 3000;
export const CHAT_INVITATION_VISITOR_KEY = "moorish.cecile-invitation.visitor.v1";
export const chatInvitationKey = (visitorId: string) => CHAT_INVITATION_VISITOR_KEY + ":" + visitorId;
type InvitationStorage = Pick<Storage, "getItem" | "setItem">;
export function chatInvitationSeen(storage: InvitationStorage, visitorId: string) {
  try { return storage.getItem(chatInvitationKey(visitorId)) !== null; } catch { return true; }
}
export function claimChatInvitation(storage: InvitationStorage, visitorId: string) {
  try {
    if (chatInvitationSeen(storage, visitorId)) return false;
    storage.setItem(chatInvitationKey(visitorId), "shown");
    return true;
  } catch { return false; }
}
export type InvitationTopic = "general" | "villas" | "beachclubs" | "nightclubs" | "transportation" | "experiences" | "restaurants";

// Only public discovery pages invite a conversation. Forms, accounts and checkout stay uninterrupted.
export function invitationTopic(pathname: string): InvitationTopic | null {
  const path = pathname.replace(/^\/(en|fr|es|pt|it|de)(?=\/|$)/, "");
  const category = path.split("/").filter(Boolean)[0] ?? "";
  if (["", "services", "about"].includes(category)) return "general";
  if (["villas", "beachclubs", "nightclubs", "transportation", "restaurants"].includes(category)) return category as InvitationTopic;
  if (["experiences", "activities"].includes(category)) return "experiences";
  return null;
}

type InvitationCopy = { assistant: string; cta: string; later: string; close: string; messages: Record<InvitationTopic, string> };
export const invitationCopy: Record<Locale, InvitationCopy> = {
  en: {
    assistant: "Your AI concierge", cta: "Chat with Cécile", later: "Maybe later", close: "Close invitation",
    messages: {
      general: "A little Marrakech magic? 😉 Tell me what you love — let’s find something for you!",
      villas: "Pool days or a dreamy villa hideaway? 😉 Tell me your wish list — let’s find your match!",
      beachclubs: "Sunbed, poolside lunch or a lively beach club? ☀️ Tell me your vibe — let’s find your kind of fun!",
      nightclubs: "Your evening deserves a little sparkle 😉 Tell me your music and mood — let’s find your night out!",
      transportation: "Airport arrival or an Atlas escape? 😊 Tell me where you’re heading — I’ll help you find your ride!",
      experiences: "How about a Marrakech story worth telling? 😉 Mountains, desert or a sunrise balloon — what tempts you?",
      restaurants: "A romantic rooftop or Moroccan flavours? 😊 Tell me what you’re craving — let’s find your table!",
    },
  },
  fr: {
    assistant: "Votre concierge IA", cta: "Discuter avec Cécile", later: "Plus tard", close: "Fermer l’invitation",
    messages: {
      general: "Une petite touche de magie à Marrakech ? 😉 Dites-moi ce qui vous fait envie, on trouve votre bonheur !",
      villas: "Piscine au soleil ou villa de rêve ? 😉 Racontez-moi vos envies, on cherche votre coup de cœur !",
      beachclubs: "Transat, déjeuner au bord de l’eau ou ambiance festive ? ☀️ Dites-moi votre style, on trouve votre dose de fun !",
      nightclubs: "Et si votre soirée brillait un peu plus ? 😉 Dites-moi votre musique et votre humeur, on cherche où sortir !",
      transportation: "Arrivée à l’aéroport ou escapade dans l’Atlas ? 😊 Dites-moi votre trajet, je vous aide à choisir !",
      experiences: "Envie d’une histoire à raconter ? 😉 Montagne, désert ou montgolfière au lever du soleil : qu’est-ce qui vous tente ?",
      restaurants: "Un rooftop romantique ou des saveurs marocaines ? 😊 Dites-moi ce qui vous fait envie, on cherche votre table !",
    },
  },
  es: {
    assistant: "Tu concierge de IA", cta: "Hablar con Cécile", later: "Más tarde", close: "Cerrar invitación",
    messages: {
      general: "¿Un toque de magia en Marrakech? 😉 Cuéntame qué te gusta y buscamos algo para ti.",
      villas: "¿Piscina al sol o una villa de ensueño? 😉 Cuéntame tus deseos y buscamos tu favorita.",
      beachclubs: "¿Hamaca, almuerzo junto a la piscina o ambiente animado? ☀️ Cuéntame tu estilo y buscamos tu plan ideal.",
      nightclubs: "Tu noche merece un poco de chispa 😉 Dime tu música y tu ambiente y buscamos dónde salir.",
      transportation: "¿Llegada al aeropuerto o escapada al Atlas? 😊 Dime adónde vas y te ayudo a elegir tu traslado.",
      experiences: "¿Una aventura que merezca la pena contar? 😉 Montaña, desierto o globo al amanecer: ¿qué te tienta?",
      restaurants: "¿Una terraza romántica o sabores marroquíes? 😊 Dime qué te apetece y buscamos tu mesa.",
    },
  },
  it: {
    assistant: "La tua concierge IA", cta: "Chatta con Cécile", later: "Più tardi", close: "Chiudi invito",
    messages: {
      general: "Un pizzico di magia a Marrakech? 😉 Raccontami cosa ami e cerchiamo qualcosa per te!",
      villas: "Piscina al sole o una villa da sogno? 😉 Raccontami i tuoi desideri e cerchiamo quella giusta!",
      beachclubs: "Lettino, pranzo in piscina o atmosfera vivace? ☀️ Dimmi il tuo stile e cerchiamo il divertimento per te!",
      nightclubs: "La tua serata merita un po’ di scintille 😉 Dimmi musica e atmosfera e cerchiamo dove uscire!",
      transportation: "Arrivo in aeroporto o fuga sull’Atlante? 😊 Dimmi dove vai e ti aiuto a scegliere il trasferimento!",
      experiences: "Un’avventura da raccontare? 😉 Montagna, deserto o mongolfiera all’alba: cosa ti tenta?",
      restaurants: "Terrazza romantica o sapori marocchini? 😊 Dimmi cosa ti va e cerchiamo il tuo tavolo!",
    },
  },
  de: {
    assistant: "Deine KI-Concierge", cta: "Mit Cécile chatten", later: "Vielleicht später", close: "Einladung schließen",
    messages: {
      general: "Ein bisschen Marrakesch-Magie? 😉 Verrate mir, was du liebst — wir suchen etwas für dich!",
      villas: "Pooltage oder eine traumhafte Villa? 😉 Erzähl mir deine Wünsche — wir suchen deinen Favoriten!",
      beachclubs: "Sonnenliege, Mittagessen am Pool oder lebhafte Stimmung? ☀️ Verrate mir deinen Stil — wir suchen deinen Spaß!",
      nightclubs: "Dein Abend verdient etwas Glanz 😉 Welche Musik und Stimmung magst du? Wir suchen deinen Abendplan!",
      transportation: "Ankunft am Flughafen oder Ausflug ins Atlasgebirge? 😊 Sag mir dein Ziel — ich helfe bei der Fahrt!",
      experiences: "Lust auf eine Geschichte zum Weitererzählen? 😉 Berge, Wüste oder Ballonfahrt bei Sonnenaufgang — was reizt dich?",
      restaurants: "Romantische Dachterrasse oder marokkanische Küche? 😊 Worauf hast du Lust? Wir suchen deinen Tisch!",
    },
  },
  pt: {
    assistant: "A sua concierge IA", cta: "Conversar com Cécile", later: "Mais tarde", close: "Fechar convite",
    messages: {
      general: "Um toque de magia em Marraquexe? 😉 Diga-me do que gosta e procuramos algo para si!",
      villas: "Piscina ao sol ou uma villa de sonho? 😉 Conte-me os seus desejos e procuramos a ideal!",
      beachclubs: "Espreguiçadeira, almoço junto à piscina ou ambiente animado? ☀️ Diga-me o seu estilo e procuramos a sua diversão!",
      nightclubs: "A sua noite merece um pouco de brilho 😉 Diga-me a música e o ambiente que procura e encontramos onde sair!",
      transportation: "Chegada ao aeroporto ou escapadinha ao Atlas? 😊 Diga-me para onde vai e ajudo a escolher o transporte!",
      experiences: "Uma aventura para contar? 😉 Montanha, deserto ou balão ao nascer do sol: o que lhe apetece?",
      restaurants: "Um terraço romântico ou sabores marroquinos? 😊 Diga-me o que lhe apetece e procuramos a sua mesa!",
    },
  },
};
