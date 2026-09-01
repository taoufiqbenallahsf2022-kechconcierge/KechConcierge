type SupportedLanguage =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "de";

type ContactRequestEmailTranslation = {
  subject: string;
  eyebrow: string;
  title: string;
  greeting: string;
  line1: string;
  line2: string;
  summaryTitle: string;
  requestType: string;
  subjectLabel: string;
  messageLabel: string;
  referenceLabel: string;
  footer: string;
  tripSubject: string;
  tripTitle: string;
  tripLine1: string;
  tripLine2: string;
  tripSummaryTitle: string;
  tripPlanLabel: string;
  tripDatesLabel: string;
};

const translations: Record<
  SupportedLanguage,
  ContactRequestEmailTranslation
> = {
  en: {
    subject:
      "We received your request — Moorish Concierge",
    eyebrow:
      "Request received",
    title:
      "Thank you for contacting us",
    greeting:
      "Hello",
    line1:
      "Your request has been successfully received by Moorish Concierge.",
    line2:
      "Our team will review the details and contact you as soon as possible.",
    summaryTitle:
      "Your request",
    requestType:
      "Request type",
    subjectLabel:
      "Subject",
    messageLabel:
      "Message",
    referenceLabel:
      "Reference",
    footer:
      "Moorish Concierge — Marrakech, through Moroccan eyes.",
    tripSubject: "We received your trip request — Moorish Concierge",
    tripTitle: "We’re checking your trip",
    tripLine1: "We have received your availability request for the following selection.",
    tripLine2: "A Moorish Concierge advisor will check each item and get back to you with a response within one day.",
    tripSummaryTitle: "Your requested trip",
    tripPlanLabel: "Selected plan",
    tripDatesLabel: "Requested dates",
  },

  fr: {
    subject:
      "Nous avons reçu votre demande — Moorish Concierge",
    eyebrow:
      "Demande reçue",
    title:
      "Merci de nous avoir contactés",
    greeting:
      "Bonjour",
    line1:
      "Votre demande a bien été reçue par Moorish Concierge.",
    line2:
      "Notre équipe examinera les informations et vous contactera dans les meilleurs délais.",
    summaryTitle:
      "Votre demande",
    requestType:
      "Type de demande",
    subjectLabel:
      "Objet",
    messageLabel:
      "Message",
    referenceLabel:
      "Référence",
    footer:
      "Moorish Concierge — Marrakech, à travers un regard marocain.",
    tripSubject: "Nous avons reçu votre demande de voyage — Moorish Concierge",
    tripTitle: "Nous vérifions votre voyage",
    tripLine1: "Nous avons reçu votre demande de disponibilité pour la sélection suivante.",
    tripLine2: "Un conseiller Moorish Concierge vérifiera chaque élément et vous répondra sous un jour.",
    tripSummaryTitle: "Votre voyage demandé",
    tripPlanLabel: "Formule sélectionnée",
    tripDatesLabel: "Dates demandées",
  },

  es: {
    subject:
      "Hemos recibido tu solicitud — Moorish Concierge",
    eyebrow:
      "Solicitud recibida",
    title:
      "Gracias por contactarnos",
    greeting:
      "Hola",
    line1:
      "Moorish Concierge ha recibido correctamente tu solicitud.",
    line2:
      "Nuestro equipo revisará los detalles y se pondrá en contacto contigo lo antes posible.",
    summaryTitle:
      "Tu solicitud",
    requestType:
      "Tipo de solicitud",
    subjectLabel:
      "Asunto",
    messageLabel:
      "Mensaje",
    referenceLabel:
      "Referencia",
    footer:
      "Moorish Concierge — Marrakech, a través de una mirada marroquí.",
    tripSubject: "Hemos recibido tu solicitud de viaje — Moorish Concierge",
    tripTitle: "Estamos comprobando tu viaje",
    tripLine1: "Hemos recibido tu solicitud de disponibilidad para la siguiente selección.",
    tripLine2: "Un asesor de Moorish Concierge comprobará cada elemento y te responderá en menos de un día.",
    tripSummaryTitle: "Tu viaje solicitado",
    tripPlanLabel: "Plan seleccionado",
    tripDatesLabel: "Fechas solicitadas",
  },

  pt: {
    subject:
      "Recebemos o seu pedido — Moorish Concierge",
    eyebrow:
      "Pedido recebido",
    title:
      "Obrigado por nos contactar",
    greeting:
      "Olá",
    line1:
      "O seu pedido foi recebido com sucesso pela Moorish Concierge.",
    line2:
      "A nossa equipa irá analisar os detalhes e entrará em contacto consigo assim que possível.",
    summaryTitle:
      "O seu pedido",
    requestType:
      "Tipo de pedido",
    subjectLabel:
      "Assunto",
    messageLabel:
      "Mensagem",
    referenceLabel:
      "Referência",
    footer:
      "Moorish Concierge — Marraquexe, através de um olhar marroquino.",
    tripSubject: "Recebemos o seu pedido de viagem — Moorish Concierge",
    tripTitle: "Estamos a verificar a sua viagem",
    tripLine1: "Recebemos o seu pedido de disponibilidade para a seguinte seleção.",
    tripLine2: "Um consultor da Moorish Concierge verificará cada item e responderá no prazo de um dia.",
    tripSummaryTitle: "A sua viagem solicitada",
    tripPlanLabel: "Plano selecionado",
    tripDatesLabel: "Datas solicitadas",
  },

  it: {
    subject:
      "Abbiamo ricevuto la tua richiesta — Moorish Concierge",
    eyebrow:
      "Richiesta ricevuta",
    title:
      "Grazie per averci contattato",
    greeting:
      "Ciao",
    line1:
      "Moorish Concierge ha ricevuto correttamente la tua richiesta.",
    line2:
      "Il nostro team esaminerà i dettagli e ti contatterà il prima possibile.",
    summaryTitle:
      "La tua richiesta",
    requestType:
      "Tipo di richiesta",
    subjectLabel:
      "Oggetto",
    messageLabel:
      "Messaggio",
    referenceLabel:
      "Riferimento",
    footer:
      "Moorish Concierge — Marrakech, attraverso uno sguardo marocchino.",
    tripSubject: "Abbiamo ricevuto la tua richiesta di viaggio — Moorish Concierge",
    tripTitle: "Stiamo verificando il tuo viaggio",
    tripLine1: "Abbiamo ricevuto la tua richiesta di disponibilità per la seguente selezione.",
    tripLine2: "Un consulente Moorish Concierge verificherà ogni elemento e ti risponderà entro un giorno.",
    tripSummaryTitle: "Il viaggio richiesto",
    tripPlanLabel: "Piano selezionato",
    tripDatesLabel: "Date richieste",
  },

  de: {
    subject:
      "Wir haben Ihre Anfrage erhalten — Moorish Concierge",
    eyebrow:
      "Anfrage erhalten",
    title:
      "Vielen Dank für Ihre Nachricht",
    greeting:
      "Hallo",
    line1:
      "Ihre Anfrage ist erfolgreich bei Moorish Concierge eingegangen.",
    line2:
      "Unser Team wird die Angaben prüfen und sich so bald wie möglich bei Ihnen melden.",
    summaryTitle:
      "Ihre Anfrage",
    requestType:
      "Art der Anfrage",
    subjectLabel:
      "Betreff",
    messageLabel:
      "Nachricht",
    referenceLabel:
      "Referenz",
    footer:
      "Moorish Concierge — Marrakesch, mit marokkanischem Blick.",
    tripSubject: "Wir haben Ihre Reiseanfrage erhalten — Moorish Concierge",
    tripTitle: "Wir prüfen Ihre Reise",
    tripLine1: "Wir haben Ihre Verfügbarkeitsanfrage für die folgende Auswahl erhalten.",
    tripLine2: "Ein Berater von Moorish Concierge prüft jeden Eintrag und antwortet Ihnen innerhalb eines Tages.",
    tripSummaryTitle: "Ihre angefragte Reise",
    tripPlanLabel: "Gewähltes Angebot",
    tripDatesLabel: "Angefragte Termine",
  },
};

function normalizeLanguage(
  language?: string
): SupportedLanguage {
  const value =
    (language || "en")
      .trim()
      .toLowerCase();

  if (
    value === "en" ||
    value === "fr" ||
    value === "es" ||
    value === "pt" ||
    value === "it" ||
    value === "de"
  ) {
    return value;
  }

  return "en";
}

export function getContactRequestEmailTranslation(
  language?: string
) {
  return translations[
    normalizeLanguage(language)
  ];
}
