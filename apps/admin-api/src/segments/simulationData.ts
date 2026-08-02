import { prisma } from "../lib/prisma.js";

const PREFIX = "segment-simulation";
const individualId = (index: number) => `00IS${String(index).padStart(14, "0")}`;
const dateAgo = (days: number, hours = 0) => new Date(Date.now() - ((days * 24 + hours) * 60 * 60 * 1000));

export async function generateSegmentSimulationData(adminUserId: string) {
  const firstNames = ["Amine", "Sara", "Youssef", "Emma", "Noah", "Lina", "Adam", "Sofia", "Lucas", "Maya"];
  const lastNames = ["Bennani", "Martin", "Dubois", "Rossi", "Silva", "Schmidt", "Garcia", "Alaoui", "Moreau", "Costa"];
  const languages = ["fr", "en", "fr", "en", "es", "de", "it", "pt"];
  const countries = ["MAR", "FRA", "GBR", "ESP", "DEU", "ITA", "PRT", "USA"];
  const individuals = Array.from({ length: 100 }, (_, offset) => {
    const index = offset + 1; const google = index % 3 === 0; const inactive = index % 19 === 0;
    return { id: individualId(index), firstName: firstNames[offset % firstNames.length]!, lastName: `${lastNames[offset % lastNames.length]!} ${index}`, email: `segment.simulation.${String(index).padStart(3, "0")}@example.invalid`, mobilePhone: index % 7 === 0 ? null : `+212600${String(index).padStart(6, "0")}`, googleId: google ? `${PREFIX}-google-${index}` : null, authProvider: google ? "GOOGLE" : "EMAIL", address: index % 4 ? "Marrakech" : null, birthdate: index % 5 ? new Date(1980 + (index % 24), index % 12, (index % 27) + 1) : null, country: countries[offset % countries.length]!, language: languages[offset % languages.length]!, source: google ? "GOOGLE" : index % 4 === 0 ? "ADMIN" : "WEBSITE", isActive: !inactive, emailVerified: !inactive && index % 8 !== 0, createdDate: dateAgo(index % 120, index % 20), createdBy: PREFIX, updatedBy: adminUserId, lastSuccessfulLoginDate: inactive ? null : dateAgo(index % 28, index % 12) };
  });
  const consents = individuals.flatMap((person, offset) => ["EMAIL", "WHATSAPP", "SMS"].map((channel, channelIndex) => ({ id: `${PREFIX}-consent-${offset + 1}-${channelIndex}`, individualId: person.id, channel: channel as "EMAIL" | "WHATSAPP" | "SMS", channelStatus: ((offset + channelIndex) % 9 === 0 ? "OPTOUT" : "OPTIN") as "OPTOUT" | "OPTIN", createdDate: person.createdDate, createdBy: PREFIX })));
  const pagePaths = [{ pageUrl: "/contact", pageName: "Contact" }, { pageUrl: "/villas/villa-atlas-horizon", pageName: "Villa Atlas Horizon" }, { pageUrl: "/restaurants", pageName: "Restaurants" }, { pageUrl: "/services", pageName: "Services" }, { pageUrl: "/chat", pageName: "Chat" }, { pageUrl: "/activities", pageName: "Activities" }];
  const pageVisits = individuals.flatMap((person, offset) => Array.from({ length: 2 + (offset % 5) }, (_, visitIndex) => { const page = pagePaths[(offset + visitIndex) % pagePaths.length]!; return { id: `${PREFIX}-visit-${offset + 1}-${visitIndex}`, ...page, visitorId: `${PREFIX}-visitor-${offset + 1}`, visitorStage: "ANONYMOUS" as const, individualId: person.id, visitDate: dateAgo((offset + visitIndex) % 45, visitIndex * 2), referrer: visitIndex === 0 ? (offset % 2 ? "https://www.google.com" : "https://www.instagram.com") : person.email, userAgent: offset % 3 ? "Moorish Simulation · Web" : "Moorish Simulation · Mobile", sessionId: `${PREFIX}-session-${offset + 1}` }; }));
  const villas = [
    { pageUrl: "/villas/villa-atlas-horizon", pageName: "Villa Atlas Horizon" },
    { pageUrl: "/villas/villa-majorelle", pageName: "Villa Majorelle" },
    { pageUrl: "/villas/villa-palmeraie", pageName: "Villa Palmeraie" },
    { pageUrl: "/villas/riad-royal", pageName: "Riad Royal" },
    { pageUrl: "/villas/villa-agafay", pageName: "Villa Agafay" }
  ];
  // Every profile visits at least two distinct villas. Some visit up to four,
  // which makes COUNT DISTINCT and HAVING scenarios meaningful.
  const villaVisits = individuals.flatMap((person, offset) => Array.from({ length: 2 + (offset % 3) }, (_, visitIndex) => {
    const villa = villas[(offset + visitIndex) % villas.length]!;
    return { id: `${PREFIX}-multi-villa-${offset + 1}-${visitIndex}`, ...villa, visitorId: `${PREFIX}-visitor-${offset + 1}`, visitorStage: (offset < 25 ? "LEAD" : "ANONYMOUS") as "LEAD" | "ANONYMOUS", leadId: offset < 25 ? `00LS${String(offset + 1).padStart(14, "0")}` : null, individualId: person.id, visitDate: dateAgo((offset * 3 + visitIndex) % 60, visitIndex * 3), referrer: visitIndex === 0 ? "https://www.google.com" : villas[(offset + visitIndex - 1) % villas.length]!.pageUrl, userAgent: offset % 3 ? "Moorish Simulation · Web" : "Moorish Simulation · Mobile", sessionId: `${PREFIX}-villa-session-${offset + 1}` };
  }));
  const chatOwners = individuals.filter((_, index) => index % 2 === 0);
  const chats = chatOwners.map((person, offset) => ({ id: `${PREFIX}-chat-${offset + 1}`, visitorId: `${PREFIX}-visitor-${offset * 2 + 1}`, sessionId: `${PREFIX}-session-${offset * 2 + 1}`, individualId: person.id, participantStage: "INDIVIDUAL" as const, managedBy: (offset % 4 === 0 ? "MANUAL" : "AI") as "MANUAL" | "AI", status: (["OPEN", "WAITING_FOR_ADVISOR", "WAITING_FOR_VISITOR", "CLOSED"] as const)[offset % 4], language: person.language, createdDate: dateAgo(offset % 30, offset % 12), createdBy: PREFIX, updatedBy: adminUserId }));
  const chatMessages = chats.flatMap((chat, offset) => Array.from({ length: 2 + (offset % 4) }, (_, messageIndex) => ({ id: `${PREFIX}-message-${offset + 1}-${messageIndex}`, chatId: chat.id, senderType: (messageIndex % 2 === 0 ? "INDIVIDUAL" : chat.managedBy === "AI" ? "AI" : "ADVISOR") as "INDIVIDUAL" | "AI" | "ADVISOR", senderId: messageIndex % 2 === 0 ? chat.individualId : null, message: messageIndex % 2 === 0 ? ["I would like more information about this villa.", "Can you help me make a reservation?", "What activities are available this week?"][offset % 3]! : ["Of course. I can help you with that.", "An advisor will confirm availability shortly.", "Thank you for contacting Moorish Concierge."][offset % 3]!, sendTime: new Date(chat.createdDate.getTime() + messageIndex * 8 * 60 * 1000), isRead: messageIndex < 2 || offset % 5 !== 0 })));
  const leads = individuals.slice(0, 25).map((person, index) => ({ id: `00LS${String(index + 1).padStart(14, "0")}`, firstName: person.firstName, lastName: person.lastName, email: person.email, mobilePhone: person.mobilePhone, country: person.country, language: person.language, source: index % 2 ? "Web" : "Instagram", statusDescription: index % 3 ? "New" : "Qualified", individualId: person.id, createdDate: dateAgo(index % 40), createdBy: PREFIX }));
  const prospects = individuals.slice(25, 45).map((person, index) => ({ id: `${PREFIX}-prospect-${index + 1}`, firstName: person.firstName, lastName: person.lastName, email: person.email, mobilePhone: person.mobilePhone, country: person.country, language: person.language, source: index % 2 ? "Web" : "Referral", statusDescription: index % 3 ? "Interested" : "Negotiating", individualId: person.id, createdDate: dateAgo(index % 35), createdBy: PREFIX }));
  const accounts = individuals.slice(45, 60).map((person, index) => ({ id: `${PREFIX}-account-${index + 1}`, firstName: person.firstName, lastName: person.lastName, email: person.email, mobilePhone: person.mobilePhone, country: person.country, language: person.language, source: index % 2 ? "Website" : "Advisor", statusDescription: "Client", individualId: person.id, createdDate: dateAgo(index % 25), createdBy: PREFIX }));
  await prisma.$transaction(async transaction => {
    await transaction.individual.createMany({ data: individuals, skipDuplicates: true });
    await transaction.consent.createMany({ data: consents, skipDuplicates: true });
    await transaction.lead.createMany({ data: leads, skipDuplicates: true });
    await transaction.prospect.createMany({ data: prospects, skipDuplicates: true });
    await transaction.account.createMany({ data: accounts, skipDuplicates: true });
    await transaction.pageVisit.deleteMany({ where: { id: { startsWith: `${PREFIX}-multi-villa-` } } });
    await transaction.pageVisit.createMany({ data: [...pageVisits, ...villaVisits], skipDuplicates: true });
    await transaction.chat.createMany({ data: chats, skipDuplicates: true });
    await transaction.chatMessage.createMany({ data: chatMessages, skipDuplicates: true });
  }, { timeout: 30000 });
  return { individuals: individuals.length, leads: leads.length, prospects: prospects.length, accounts: accounts.length, consents: consents.length, pageVisits: pageVisits.length + villaVisits.length, chats: chats.length, chatMessages: chatMessages.length };
}
