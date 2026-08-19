import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const languages = ["FR", "EN", "DE", "IT", "PT", "ES"] as const;
type I18n = { FR: string; EN: string; DE: string; IT: string; PT: string; ES: string };
type Plan = { code: string; price: number; cost: number; unit: string; title: I18n; options: I18n[]; duration?: number; serviceType?: string; origin?: string; destination?: string };
type Domain = { code: string; order: number; image: string; title: I18n; location: I18n; plans: Plan[] };

const tr = (EN: string, FR: string, DE: string, IT: string, PT: string, ES: string): I18n => ({ EN, FR, DE, IT, PT, ES });
const translated = (prefix: string, value: I18n) => Object.fromEntries(languages.map((language) => [`${prefix}${language}`, value[language]]));
const same = (value: string) => tr(value, value, value, value, value, value);
const locations = {
  medina: tr("Marrakech Medina", "Médina de Marrakech", "Medina von Marrakesch", "Medina di Marrakech", "Medina de Marrakech", "Medina de Marrakech"),
  palmeraie: tr("Marrakech Palmeraie", "Palmeraie de Marrakech", "Palmeraie von Marrakesch", "Palmeraie di Marrakech", "Palmeraie de Marrakech", "Palmeraie de Marrakech"),
  hivernage: same("Hivernage, Marrakech"),
  agafay: tr("Agafay Desert", "Désert d’Agafay", "Agafay-Wüste", "Deserto di Agafay", "Deserto de Agafay", "Desierto de Agafay"),
};
const subtitle = tr("A Moorish Concierge selection", "Une sélection Moorish Concierge", "Eine Moorish-Concierge-Auswahl", "Una selezione Moorish Concierge", "Uma seleção Moorish Concierge", "Una selección Moorish Concierge");
const description = tr("A carefully selected Marrakech experience known for reliable service, comfort and character.", "Une expérience à Marrakech soigneusement sélectionnée pour son service, son confort et son caractère.", "Ein sorgfältig ausgewähltes Marrakesch-Erlebnis mit zuverlässigem Service und Komfort.", "Un’esperienza a Marrakech selezionata per servizio, comfort e carattere.", "Uma experiência em Marrakech selecionada pelo serviço, conforto e carácter.", "Una experiencia en Marrakech seleccionada por su servicio, comodidad y carácter.");
const planDescription = tr("Subject to availability. Our concierge confirms every detail before booking.", "Sous réserve de disponibilité. Notre conciergerie confirme chaque détail avant réservation.", "Nach Verfügbarkeit. Unser Concierge bestätigt alle Details vor der Buchung.", "Soggetto a disponibilità. Il concierge conferma ogni dettaglio prima della prenotazione.", "Sujeito a disponibilidade. O concierge confirma todos os detalhes antes da reserva.", "Sujeto a disponibilidad. El concierge confirma todos los detalles antes de reservar.");
const inc = {
  driver: tr("Professional private driver", "Chauffeur privé professionnel", "Professioneller Privatfahrer", "Autista privato professionale", "Motorista privado profissional", "Conductor privado profesional"),
  pickup: tr("Hotel pickup and return", "Prise en charge et retour à l’hôtel", "Abholung und Rückfahrt zum Hotel", "Prelievo e rientro in hotel", "Recolha e regresso ao hotel", "Recogida y regreso al hotel"),
  water: tr("Bottled water", "Eau en bouteille", "Mineralwasser", "Acqua in bottiglia", "Água engarrafada", "Agua embotellada"),
  towels: tr("Towels and sun lounger", "Serviette et transat", "Handtuch und Sonnenliege", "Asciugamano e lettino", "Toalha e espreguiçadeira", "Toalla y tumbona"),
  lunch: tr("Three-course lunch", "Déjeuner en trois services", "Drei-Gänge-Mittagessen", "Pranzo di tre portate", "Almoço de três pratos", "Almuerzo de tres platos"),
  host: tr("Dedicated concierge host", "Hôte concierge dédié", "Persönlicher Concierge-Gastgeber", "Host concierge dedicato", "Anfitrião concierge dedicado", "Anfitrión concierge dedicado"),
  entry: tr("Confirmed priority entrance", "Entrée prioritaire confirmée", "Bestätigter bevorzugter Einlass", "Ingresso prioritario confermato", "Entrada prioritária confirmada", "Entrada prioritaria confirmada"),
  table: tr("Reserved premium table", "Table premium réservée", "Reservierter Premium-Tisch", "Tavolo premium riservato", "Mesa premium reservada", "Mesa premium reservada"),
  guide: tr("Licensed local guide", "Guide local agréé", "Lizenzierter lokaler Guide", "Guida locale autorizzata", "Guia local credenciado", "Guía local autorizado"),
  safety: tr("Safety equipment", "Équipement de sécurité", "Sicherheitsausrüstung", "Attrezzatura di sicurezza", "Equipamento de segurança", "Equipo de seguridad"),
};

const villas = [
  ["villa-azur", 1, 680, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", same("Villa Azur"), locations.palmeraie, 10],
  ["villa-des-oliviers", 2, 520, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", same("Villa des Oliviers"), locations.palmeraie, 8],
  ["riad-sienna", 3, 390, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3", same("Riad Sienna"), locations.medina, 6],
  ["villa-atlas-view", 4, 850, "https://images.unsplash.com/photo-1600607688969-a5bfcd646154", tr("Villa Atlas View", "Villa Vue Atlas", "Villa Atlasblick", "Villa Vista Atlante", "Villa Vista Atlas", "Villa Vista Atlas"), locations.palmeraie, 12],
] as const;
const restaurants = [
  ["dar-zellij", 1, 55, "https://images.unsplash.com/photo-1552566626-52f8b828add9", same("Dar Zellij"), locations.medina],
  ["nomad-rooftop", 2, 35, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", same("Nomad Rooftop"), locations.medina],
  ["atlas-table", 3, 70, "https://images.unsplash.com/photo-1414235077428-338989a2e8c0", tr("The Atlas Table", "La Table de l’Atlas", "Der Atlas-Tisch", "La Tavola dell’Atlante", "A Mesa do Atlas", "La Mesa del Atlas"), locations.hivernage],
  ["secret-garden-dining", 4, 48, "https://images.unsplash.com/photo-1559339352-11d035aa65de", tr("Secret Garden Dining", "Dîner au Jardin Secret", "Dinner im Geheimen Garten", "Cena nel Giardino Segreto", "Jantar no Jardim Secreto", "Cena en el Jardín Secreto"), locations.medina],
] as const;

const transport: Domain[] = [
  { code: "mercedes-v-class", order: 1, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8", title: tr("Mercedes V-Class Private Driver", "Chauffeur privé Mercedes Classe V", "Privatfahrer Mercedes V-Klasse", "Autista privato Mercedes Classe V", "Motorista privado Mercedes Classe V", "Conductor privado Mercedes Clase V"), location: locations.medina, plans: [
    { code: "airport-medina", price: 350, cost: 220, unit: "PER_TRIP", title: tr("Airport to Medina", "Aéroport vers Médina", "Flughafen zur Medina", "Aeroporto alla Medina", "Aeroporto para a Medina", "Aeropuerto a la Medina"), options: [inc.driver, inc.water], duration: 30, serviceType: "AIRPORT_TRANSFER", origin: "Marrakech Airport", destination: "Marrakech Medina" },
    { code: "half-day", price: 900, cost: 600, unit: "HALF_DAY", title: tr("Private driver — half day", "Chauffeur privé — demi-journée", "Privatfahrer — halber Tag", "Autista privato — mezza giornata", "Motorista privado — meio dia", "Conductor privado — medio día"), options: [inc.driver, inc.pickup, inc.water], duration: 240, serviceType: "PRIVATE_HIRE" },
    { code: "full-day", price: 1600, cost: 1050, unit: "FULL_DAY", title: tr("Private driver — full day", "Chauffeur privé — journée complète", "Privatfahrer — ganzer Tag", "Autista privato — giornata intera", "Motorista privado — dia inteiro", "Conductor privado — día completo"), options: [inc.driver, inc.pickup, inc.water], duration: 480, serviceType: "PRIVATE_HIRE" },
  ]},
  { code: "range-rover-chauffeur", order: 2, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6", title: tr("Range Rover Chauffeur", "Range Rover avec chauffeur", "Range Rover mit Chauffeur", "Range Rover con autista", "Range Rover com motorista", "Range Rover con chófer"), location: locations.hivernage, plans: [
    { code: "evening", price: 750, cost: 480, unit: "PER_TRIP", title: tr("Evening city service", "Service soirée en ville", "Abendlicher Stadtservice", "Servizio serale in città", "Serviço noturno na cidade", "Servicio nocturno en ciudad"), options: [inc.driver, inc.water], duration: 240, serviceType: "EVENING" },
    { code: "ourika-day", price: 1900, cost: 1250, unit: "FULL_DAY", title: tr("Ourika Valley day", "Journée vallée de l’Ourika", "Tag im Ourika-Tal", "Giornata nella Valle dell’Ourika", "Dia no Vale de Ourika", "Día en el Valle de Ourika"), options: [inc.driver, inc.pickup, inc.water], duration: 540, serviceType: "EXCURSION" },
  ]},
];

const beach: Domain[] = [
  { code: "beldi-country-club", order: 1, image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7", title: same("Beldi Country Club"), location: locations.palmeraie, plans: [
    { code: "pool-access", price: 450, cost: 280, unit: "PER_PERSON", title: tr("Pool access", "Accès piscine", "Poolzugang", "Accesso piscina", "Acesso à piscina", "Acceso a la piscina"), options: [inc.towels, inc.water] },
    { code: "pool-lunch", price: 750, cost: 480, unit: "PER_PERSON", title: tr("Pool and lunch", "Piscine et déjeuner", "Pool und Mittagessen", "Piscina e pranzo", "Piscina e almoço", "Piscina y almuerzo"), options: [inc.towels, inc.lunch, inc.water] },
    { code: "private-cabana", price: 1800, cost: 1150, unit: "PER_CABANA", title: tr("Private cabana", "Cabana privée", "Private Cabana", "Cabana privata", "Cabana privada", "Cabaña privada"), options: [inc.towels, inc.host, inc.water] },
  ]},
  { code: "agafay-pool-retreat", order: 2, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945", title: tr("Agafay Pool Retreat", "Retraite piscine Agafay", "Agafay Pool Retreat", "Ritiro piscina Agafay", "Retiro com piscina Agafay", "Retiro con piscina Agafay"), location: locations.agafay, plans: [
    { code: "day-pass", price: 550, cost: 340, unit: "PER_PERSON", title: tr("Desert pool day", "Journée piscine désert", "Pooltag in der Wüste", "Giornata piscina nel deserto", "Dia de piscina no deserto", "Día de piscina en el desierto"), options: [inc.towels, inc.water] },
    { code: "sunset-dinner", price: 980, cost: 640, unit: "PER_PERSON", title: tr("Pool, sunset and dinner", "Piscine, coucher de soleil et dîner", "Pool, Sonnenuntergang und Dinner", "Piscina, tramonto e cena", "Piscina, pôr do sol e jantar", "Piscina, atardecer y cena"), options: [inc.towels, inc.lunch, inc.host] },
  ]},
];

const night: Domain[] = [
  { code: "theatro-marrakech", order: 1, image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a8e", title: same("Theatro Marrakech"), location: locations.hivernage, plans: [
    { code: "priority-entry", price: 400, cost: 250, unit: "PER_PERSON", title: tr("Priority entry", "Entrée prioritaire", "Bevorzugter Einlass", "Ingresso prioritario", "Entrada prioritária", "Entrada prioritaria"), options: [inc.entry, inc.host] },
    { code: "premium-table", price: 3500, cost: 2600, unit: "PER_TABLE", title: tr("Premium table", "Table premium", "Premium-Tisch", "Tavolo premium", "Mesa premium", "Mesa premium"), options: [inc.entry, inc.table, inc.host] },
  ]},
  { code: "555-famous-club", order: 2, image: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2", title: same("555 Famous Club"), location: locations.hivernage, plans: [
    { code: "couple-entry", price: 700, cost: 450, unit: "FIXED", title: tr("Couple entry", "Entrée couple", "Eintritt für zwei", "Ingresso coppia", "Entrada para casal", "Entrada para pareja"), options: [inc.entry, inc.host] },
    { code: "vip-table", price: 4200, cost: 3100, unit: "PER_TABLE", title: same("VIP Table"), options: [inc.entry, inc.table, inc.host] },
  ]},
];

const activities: Domain[] = [
  { code: "atlas-balloon-flight", order: 1, image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee", title: tr("Atlas Hot-Air Balloon", "Montgolfière face à l’Atlas", "Heißluftballon am Atlas", "Mongolfiera sull’Atlante", "Balão sobre o Atlas", "Globo sobre el Atlas"), location: locations.palmeraie, plans: [
    { code: "shared-flight", price: 2100, cost: 1550, unit: "PER_PERSON", title: tr("Shared sunrise flight", "Vol partagé au lever du soleil", "Gemeinsamer Sonnenaufgangsflug", "Volo condiviso all’alba", "Voo partilhado ao nascer do sol", "Vuelo compartido al amanecer"), options: [inc.pickup, inc.guide, inc.lunch], duration: 240 },
    { code: "private-flight", price: 12500, cost: 9200, unit: "PER_GROUP", title: tr("Private balloon flight", "Vol privé en montgolfière", "Privater Ballonflug", "Volo privato in mongolfiera", "Voo privado de balão", "Vuelo privado en globo"), options: [inc.pickup, inc.guide, inc.lunch, inc.host], duration: 240 },
  ]},
  { code: "agafay-quad", order: 2, image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833", title: tr("Agafay Quad Adventure", "Aventure quad à Agafay", "Quad-Abenteuer in Agafay", "Avventura in quad ad Agafay", "Aventura de quad em Agafay", "Aventura en quad por Agafay"), location: locations.agafay, plans: [
    { code: "two-hours", price: 750, cost: 480, unit: "PER_PERSON", title: tr("Two-hour quad ride", "Balade quad de deux heures", "Zweistündige Quad-Tour", "Tour in quad di due ore", "Passeio de quad de duas horas", "Ruta en quad de dos horas"), options: [inc.safety, inc.guide, inc.water], duration: 120 },
    { code: "sunset-dinner", price: 1450, cost: 950, unit: "PER_PERSON", title: tr("Quad, sunset and dinner", "Quad, coucher de soleil et dîner", "Quad, Sonnenuntergang und Dinner", "Quad, tramonto e cena", "Quad, pôr do sol e jantar", "Quad, atardecer y cena"), options: [inc.pickup, inc.safety, inc.guide, inc.lunch], duration: 360 },
  ]},
];

const packs: Domain[] = [
  { code: "marrakech-signature-day", order: 1, image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b", title: tr("Marrakech Signature Day", "Journée Signature Marrakech", "Marrakesch Signature-Tag", "Giornata Signature Marrakech", "Dia Signature Marrakech", "Día Signature Marrakech"), location: locations.medina, plans: [
    { code: "essential", price: 2200, cost: 1450, unit: "PER_PERSON", title: tr("Essential experience", "Expérience essentielle", "Essential-Erlebnis", "Esperienza essenziale", "Experiência essencial", "Experiencia esencial"), options: [inc.driver, inc.guide, inc.lunch, inc.water], duration: 480, serviceType: "CITY_PACKAGE" },
    { code: "private", price: 6200, cost: 4100, unit: "PER_GROUP", title: tr("Private signature experience", "Expérience signature privée", "Privates Signature-Erlebnis", "Esperienza signature privata", "Experiência signature privada", "Experiencia signature privada"), options: [inc.driver, inc.pickup, inc.guide, inc.lunch, inc.host], duration: 600, serviceType: "PRIVATE_PACKAGE" },
  ]},
  { code: "agafay-luxury-escape", order: 2, image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429", title: tr("Agafay Luxury Escape", "Escapade luxe à Agafay", "Luxus-Auszeit in Agafay", "Fuga di lusso ad Agafay", "Escapadinha de luxo em Agafay", "Escapada de lujo en Agafay"), location: locations.agafay, plans: [
    { code: "sunset", price: 1800, cost: 1150, unit: "PER_PERSON", title: tr("Sunset escape", "Escapade coucher de soleil", "Sonnenuntergang-Auszeit", "Fuga al tramonto", "Escapadinha ao pôr do sol", "Escapada al atardecer"), options: [inc.pickup, inc.driver, inc.lunch, inc.host], duration: 360, serviceType: "DESERT_PACKAGE" },
    { code: "overnight", price: 4800, cost: 3200, unit: "PER_PERSON", title: tr("Luxury overnight", "Nuitée de luxe", "Luxus-Übernachtung", "Pernottamento di lusso", "Noite de luxo", "Noche de lujo"), options: [inc.pickup, inc.driver, inc.lunch, inc.host], duration: 1440, serviceType: "OVERNIGHT_PACKAGE" },
  ]},
];

const galleryPools = {
  villa: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde", "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea"],
  restaurant: ["https://images.unsplash.com/photo-1515003197210-e0cd71810b5f", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", "https://images.unsplash.com/photo-1544148103-0773bf10d330", "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c"],
  transportation: ["https://images.unsplash.com/photo-1563720223185-11003d516935", "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2", "https://images.unsplash.com/photo-1551830820-330a71b99659", "https://images.unsplash.com/photo-1503376780353-7e6692767b70"],
  beach: ["https://images.unsplash.com/photo-1572331165267-854da2b10ccc", "https://images.unsplash.com/photo-1540555700478-4be289fbecef", "https://images.unsplash.com/photo-1564501049412-61c2a3083791", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"],
  night: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819", "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30", "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"],
  activity: ["https://images.unsplash.com/photo-1516026672322-bc52d61a55d5", "https://images.unsplash.com/photo-1489493585363-d69421e0edd3", "https://images.unsplash.com/photo-1530789253388-582c481c54b0", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"],
  pack: ["https://images.unsplash.com/photo-1539020140153-e479b8c22e70", "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43", "https://images.unsplash.com/photo-1528127269322-539801943592", "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5"],
} as const;
const imageData = (url: string, title: I18n, order: number) => ({ url, order, ...translated("alt", title) });
const galleryData = (primary: string, title: I18n, pool: readonly string[]) => [...new Set([primary, ...pool])].slice(0, 5).map((url, order) => imageData(url, title, order));
const planData = (plan: Plan, index: number) => ({ uniqueCode: plan.code, salePrice: Math.round(plan.price / 10), internalCost: Math.round(plan.cost / 10), currency: "EUR", pricingUnit: plan.unit as never, order: index + 1, durationMinutes: plan.duration, serviceType: plan.serviceType, origin: plan.origin, destination: plan.destination, ...translated("title", plan.title), ...translated("description", planDescription), options: { create: plan.options.map((item, optionIndex) => ({ order: optionIndex + 1, ...translated("title", item) })) } });
const domainData = (item: Domain, pool: readonly string[]) => ({ uniqueCode: item.code, order: item.order, thumbnail: item.image, ...translated("title", item.title), ...translated("subtitle", subtitle), ...translated("description", description), ...translated("location", item.location), images: { create: galleryData(item.image, item.title, pool) }, plans: { create: item.plans.map(planData) } });

async function main() {
  await prisma.$transaction(async (tx) => {
    // Catalog-only reset. CRM users, contacts, chats and operational records remain untouched.
    await tx.beachClub.deleteMany();
    await tx.nightClub.deleteMany();
    await tx.activity.deleteMany();
    await tx.pack.deleteMany();
    await tx.transportation.deleteMany();
    await tx.villa.deleteMany();
    await tx.restaurant.deleteMany();
    await tx.product.deleteMany();

    for (const [code, order, price, thumbnail, title, address, guests] of villas) await tx.villa.create({ data: { uniqueCode: code, order, priceEuro: price, thumbnail, ...translated("title", title), ...translated("subtitle", subtitle), ...translated("description", description), ...translated("address", address), ...translated("priceTitle", tr("Starting from", "À partir de", "Ab", "A partire da", "A partir de", "Desde")), tagsEN: ["Private pool", "Daily housekeeping"], tagsFR: ["Piscine privée", "Ménage quotidien"], detailsEN: [{ label: "Capacity", value: `${guests} guests` }], detailsFR: [{ label: "Capacité", value: `${guests} personnes` }], images: { create: galleryData(thumbnail, title, galleryPools.villa) } } });
    for (const [code, order, price, thumbnail, title, address] of restaurants) await tx.restaurant.create({ data: { uniqueCode: code, order, priceEuro: price, thumbnail, ...translated("title", title), ...translated("subtitle", subtitle), ...translated("description", description), ...translated("address", address), ...translated("priceTitle", tr("Average menu from", "Menu moyen à partir de", "Menü ab", "Menu medio da", "Menu médio desde", "Menú medio desde")), tagsEN: ["Reservation recommended"], tagsFR: ["Réservation conseillée"], detailsEN: [{ label: "Cuisine", value: "Moroccan and contemporary" }], detailsFR: [{ label: "Cuisine", value: "Marocaine et contemporaine" }], images: { create: galleryData(thumbnail, title, galleryPools.restaurant) } } });
    for (const item of transport) await tx.transportation.create({ data: domainData(item, galleryPools.transportation) as never });
    for (const item of beach) await tx.beachClub.create({ data: domainData(item, galleryPools.beach) as never });
    for (const item of night) await tx.nightClub.create({ data: domainData(item, galleryPools.night) as never });
    for (const item of activities) await tx.activity.create({ data: domainData(item, galleryPools.activity) as never });
    for (const item of packs) await tx.pack.create({ data: domainData(item, galleryPools.pack) as never });
  }, { timeout: 30_000 });

  const [villasCount, transportCount, beachCount, nightCount, activityCount, packCount, restaurantCount, plans, options] = await Promise.all([
    prisma.villa.count(), prisma.transportation.count(), prisma.beachClub.count(), prisma.nightClub.count(), prisma.activity.count(), prisma.pack.count(), prisma.restaurant.count(),
    Promise.all([prisma.transportationPlan.count(), prisma.beachClubPlan.count(), prisma.nightClubPlan.count(), prisma.activityPlan.count(), prisma.packPlan.count()]).then((values) => values.reduce((a, b) => a + b, 0)),
    Promise.all([prisma.transportationPlanOption.count(), prisma.beachClubPlanOption.count(), prisma.nightClubPlanOption.count(), prisma.activityPlanOption.count(), prisma.packPlanOption.count()]).then((values) => values.reduce((a, b) => a + b, 0)),
  ]);
  console.log({ villas: villasCount, transportation: transportCount, beachClubs: beachCount, nightClubs: nightCount, activities: activityCount, packs: packCount, restaurants: restaurantCount, plans, options });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
