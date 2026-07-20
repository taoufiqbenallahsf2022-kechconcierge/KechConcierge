import "dotenv/config";
import { PrismaClient, ProductType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type Lang = "EN" | "FR" | "ES" | "PT" | "IT" | "DE";

type Detail = {
  label?: string;
  value?: string;
  techRooms?: number;
  techSeats?: number;
};

const productTypes = [
  ProductType.VILLA,
  ProductType.SWIMMINGPOOL,
  ProductType.ACTIVITY,
  ProductType.SPA,
  ProductType.TRANSPORTATION,
  ProductType.RESTAURANT,
];

const imageByType: Record<ProductType, string> = {
  VILLA: "https://plus.unsplash.com/premium_photo-1747993829324-0fdb25190235",
  TRANSPORTATION: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8",
  SWIMMINGPOOL: "https://plus.unsplash.com/premium_photo-1684175656320-5c3f701c082c",
  ACTIVITY: "https://images.unsplash.com/photo-1671804079626-4aaafa95184e",
  SPA: "https://plus.unsplash.com/premium_photo-1679430887921-31e1047e5b55",
  RESTAURANT: "https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b",
};

const namesByType: Record<ProductType, string[]> = {
  VILLA: [
    "Villa Atlas Pearl",
    "Villa Dar Zayna",
    "Villa Palmeraie Mirage",
    "Villa Safran Garden",
    "Villa Noor",
    "Villa Majorelle Escape",
    "Villa Bahia Palm",
    "Villa Amelkis Retreat",
    "Villa Agafay Sunset",
    "Villa Medina Sky",
    "Villa Ourika Breeze",
    "Villa Kasbah Rouge",
    "Villa Royal Palm",
    "Villa Olive Grove",
    "Villa Dar Lila",
    "Villa Menara View",
    "Villa Eden Marrakech",
    "Villa Sultana",
    "Villa Amber House",
    "Villa Palm Horizon",
    "Villa Riad Serenity",
    "Villa Nomad Luxe",
    "Villa Rose Garden",
    "Villa Terra Cotta",
    "Villa Oasis Privée",
    "Villa Jasmine Court",
    "Villa Koutoubia View",
    "Villa Desert Bloom",
    "Villa Atlas Signature",
    "Villa Almaz",
  ],

  SWIMMINGPOOL: [
    "Pool Day Pass Palmeraie",
    "Atlas Pool Club",
    "Oasis Swim Lounge",
    "Marrakech Pool Retreat",
    "Palm Garden Pool",
    "Sunset Swim Club",
    "Family Pool Escape",
    "Luxury Day Pool",
    "Agdal Pool Garden",
    "Private Pool Afternoon",
    "Red City Swim Pass",
    "Rooftop Pool Experience",
    "Resort Pool Access",
    "Pool & Lunch Escape",
    "Serenity Pool Day",
    "Hidden Garden Pool",
    "Marrakech Aqua Lounge",
    "Weekend Pool Club",
    "Pool Chill Experience",
    "Premium Pool Pass",
    "Blue Oasis Marrakech",
    "Poolside Relax Day",
    "Palmeraie Aqua Escape",
    "Sunny Pool Access",
    "Garden Swim Pass",
    "Calm Pool Retreat",
    "Moorly Pool Selection",
    "Pool & Tea Experience",
    "Desert Pool Day",
    "Signature Pool Access",
  ],

  ACTIVITY: [
    "Agafay Desert Quad",
    "Camel Ride at Sunset",
    "Hot Air Balloon Flight",
    "Ourika Valley Day Trip",
    "Medina Guided Tour",
    "Cooking Class Marrakech",
    "Agafay Dinner Show",
    "Ouzoud Waterfalls Trip",
    "Buggy Adventure",
    "Atlas Mountains Tour",
    "Marrakech Street Food Tour",
    "Horse Riding Palmeraie",
    "Desert Camp Experience",
    "Pottery Workshop",
    "Photography Walk",
    "Moroccan Tea Experience",
    "Souk Discovery Tour",
    "Luxury Picnic Agafay",
    "E-Bike Medina Tour",
    "Berber Village Visit",
    "Sunrise Balloon & Breakfast",
    "Quad & Camel Combo",
    "Private City Highlights",
    "Hammam Culture Tour",
    "Marrakech Night Tour",
    "Zipline Atlas Adventure",
    "Desert Stargazing",
    "Golf Day Marrakech",
    "Secret Gardens Tour",
    "Artisan Workshop Tour",
  ],

  SPA: [
    "Royal Hammam Ritual",
    "Argan Oil Massage",
    "Couple Spa Escape",
    "Traditional Hammam",
    "Luxury Wellness Day",
    "Deep Tissue Massage",
    "Moroccan Beauty Ritual",
    "Private Spa Suite",
    "Relaxing Massage",
    "Oriental Hammam",
    "Spa & Tea Ceremony",
    "Four Hands Massage",
    "Detox Hammam Experience",
    "Facial Glow Treatment",
    "Body Scrub Ritual",
    "Aromatherapy Massage",
    "Moorly Signature Spa",
    "Pool & Spa Day",
    "Bridal Beauty Package",
    "After-Flight Recovery",
    "Hot Stone Massage",
    "Atlas Wellness Ritual",
    "Luxury Facial Care",
    "Hammam & Massage Combo",
    "Couple Hammam Ritual",
    "Rose Water Treatment",
    "Relaxation Half Day",
    "Premium Spa Escape",
    "Moroccan Black Soap Ritual",
    "Serenity Wellness",
  ],

  TRANSPORTATION: [
    "Airport Transfer Sedan",
    "Luxury SUV Transfer",
    "Private Van Transfer",
    "Chauffeur Service Half Day",
    "Chauffeur Service Full Day",
    "Mercedes V-Class Transfer",
    "Group Minibus Transfer",
    "Agafay Private Driver",
    "Atlas Day Driver",
    "Medina Pickup Service",
    "VIP Airport Welcome",
    "Luxury Car With Driver",
    "Private Shopping Driver",
    "Restaurant Transfer",
    "Event Transfer",
    "Golf Transfer",
    "Wedding Guest Transfer",
    "Night Driver Service",
    "Day Trip Vehicle",
    "Executive Transfer",
    "Family Van Transfer",
    "Premium SUV Day Hire",
    "Business Class Transfer",
    "Private Driver Marrakech",
    "Hotel Transfer",
    "Palmeraie Transfer",
    "Ourika Valley Driver",
    "Desert Camp Transfer",
    "City-to-City Transfer",
    "Moorly Signature Transfer",
  ],

  RESTAURANT: [
    "Dar Zellij Dinner",
    "Nomad Rooftop Table",
    "La Maison Arabe Experience",
    "Palmeraie Garden Lunch",
    "Medina Tasting Menu",
    "Moroccan Dinner Show",
    "Fine Dining Marrakech",
    "Rooftop Sunset Dinner",
    "Traditional Riad Dinner",
    "Agafay Desert Dinner",
    "Family Moroccan Lunch",
    "Romantic Dinner Setup",
    "International Fusion Table",
    "Luxury Brunch Marrakech",
    "Poolside Lunch",
    "Hidden Medina Restaurant",
    "Garden Dinner Experience",
    "Tagine & Couscous Table",
    "Private Chef Dinner",
    "Marrakech Food Evening",
    "Terrace Dinner Booking",
    "Moroccan Tea & Pastries",
    "Live Music Dinner",
    "Gueliz Modern Table",
    "Hivernage Fine Table",
    "Vegetarian Moroccan Menu",
    "Seafood Dinner Marrakech",
    "Birthday Dinner Setup",
    "Corporate Dinner Booking",
    "Moorly Restaurant Selection",
  ],
};

function getName(type: ProductType, index: number) {
  return namesByType[type][index - 1];
}

function getPrice(type: ProductType, index: number) {
  if (type === ProductType.VILLA) return 300 + ((index * 37) % 701);
  if (type === ProductType.RESTAURANT) return 20 + ((index * 9) % 131);
  if (type === ProductType.SWIMMINGPOOL) return 120 + ((index * 12) % 181);
  if (type === ProductType.TRANSPORTATION) return 100 + ((index * 7) % 51);
  if (type === ProductType.ACTIVITY) return 50 + ((index * 11) % 151);
  if (type === ProductType.SPA) return 45 + ((index * 8) % 136);

  return 100;
}

function getSubtitle(type: ProductType, lang: Lang) {
  const subtitles: Record<ProductType, Record<Lang, string>> = {
    VILLA: {
      EN: "Private Marrakech villa with pool, garden, refined interiors, and optional staff service.",
      FR: "Villa privée à Marrakech avec piscine, jardin, intérieur raffiné et service de personnel en option.",
      ES: "Villa privada en Marrakech con piscina, jardín, interiores refinados y servicio de personal opcional.",
      PT: "Villa privada em Marraquexe com piscina, jardim, interiores elegantes e serviço de equipa opcional.",
      IT: "Villa privata a Marrakech con piscina, giardino, interni raffinati e servizio di personale opzionale.",
      DE: "Private Villa in Marrakesch mit Pool, Garten, edlem Interieur und optionalem Personalservice.",
    },

    SWIMMINGPOOL: {
      EN: "Pool access experience for a relaxed sunny day with comfort, service, and Marrakech atmosphere.",
      FR: "Accès piscine pour une journée ensoleillée avec confort, service et ambiance marrakchie.",
      ES: "Acceso a piscina para un día soleado y relajado con comodidad, servicio y ambiente de Marrakech.",
      PT: "Acesso à piscina para um dia ensolarado e relaxante com conforto, serviço e ambiente de Marraquexe.",
      IT: "Accesso piscina per una giornata di sole e relax con comfort, servizio e atmosfera di Marrakech.",
      DE: "Pool-Zugang für einen entspannten sonnigen Tag mit Komfort, Service und Marrakesch-Atmosphäre.",
    },

    ACTIVITY: {
      EN: "Curated Marrakech experience with local guidance, flexible timing, and private booking options.",
      FR: "Expérience sélectionnée à Marrakech avec accompagnement local, horaires flexibles et options privées.",
      ES: "Experiencia seleccionada en Marrakech con guía local, horarios flexibles y opciones privadas.",
      PT: "Experiência selecionada em Marraquexe com orientação local, horários flexíveis e opções privadas.",
      IT: "Esperienza selezionata a Marrakech con guida locale, orari flessibili e opzioni private.",
      DE: "Ausgewähltes Marrakesch-Erlebnis mit lokaler Begleitung, flexiblen Zeiten und privaten Optionen.",
    },

    SPA: {
      EN: "Wellness ritual inspired by Moroccan hammam traditions, oils, massage, and deep relaxation.",
      FR: "Rituel bien-être inspiré du hammam marocain, des huiles, du massage et de la relaxation profonde.",
      ES: "Ritual de bienestar inspirado en el hammam marroquí, aceites, masajes y relajación profunda.",
      PT: "Ritual de bem-estar inspirado no hammam marroquino, óleos, massagens e relaxamento profundo.",
      IT: "Rituale benessere ispirato all’hammam marocchino, oli, massaggi e profondo relax.",
      DE: "Wellness-Ritual inspiriert von marokkanischem Hammam, Ölen, Massage und tiefer Entspannung.",
    },

    TRANSPORTATION: {
      EN: "Private transportation with reliable driver, clean vehicle, and flexible pickup coordination.",
      FR: "Transport privé avec chauffeur fiable, véhicule propre et organisation flexible de la prise en charge.",
      ES: "Transporte privado con conductor fiable, vehículo limpio y coordinación flexible de recogida.",
      PT: "Transporte privado com motorista confiável, veículo limpo e recolha flexível.",
      IT: "Trasporto privato con autista affidabile, veicolo pulito e coordinamento flessibile del pickup.",
      DE: "Privater Transport mit zuverlässigem Fahrer, sauberem Fahrzeug und flexibler Abholung.",
    },

    RESTAURANT: {
      EN: "Selected Marrakech table for lunch, dinner, celebration, or a refined local dining experience.",
      FR: "Table sélectionnée à Marrakech pour déjeuner, dîner, célébration ou expérience culinaire raffinée.",
      ES: "Mesa seleccionada en Marrakech para almuerzo, cena, celebración o experiencia gastronómica refinada.",
      PT: "Mesa selecionada em Marraquexe para almoço, jantar, celebração ou experiência gastronómica refinada.",
      IT: "Tavolo selezionato a Marrakech per pranzo, cena, celebrazione o esperienza gastronomica raffinata.",
      DE: "Ausgewählter Tisch in Marrakesch für Mittagessen, Abendessen, Feier oder feines lokales Dining.",
    },
  };

  return subtitles[type][lang];
}

function getDescription(type: ProductType, index: number, lang: Lang) {
  const name = getName(type, index);

  const descriptions: Record<ProductType, Record<Lang, string>> = {
    VILLA: {
      EN: `${name} is designed for guests who want privacy, comfort, and a premium Marrakech stay. The property may include a private swimming pool, landscaped garden, terrace areas, spacious bedrooms, air conditioning, Wi-Fi, and optional services such as chef, maid, breakfast preparation, airport transfer, and concierge support.`,
      FR: `${name} est pensée pour les voyageurs qui recherchent intimité, confort et séjour premium à Marrakech. La propriété peut inclure une piscine privée, un jardin paysager, des terrasses, de grandes chambres, la climatisation, le Wi-Fi et des services optionnels comme chef, femme de ménage, petit-déjeuner, transfert aéroport et conciergerie.`,
      ES: `${name} está pensada para huéspedes que buscan privacidad, comodidad y una estancia premium en Marrakech. La propiedad puede incluir piscina privada, jardín, terrazas, habitaciones amplias, aire acondicionado, Wi-Fi y servicios opcionales como chef, personal de limpieza, desayuno, traslado al aeropuerto y asistencia de conserjería.`,
      PT: `${name} foi pensada para hóspedes que procuram privacidade, conforto e uma estadia premium em Marraquexe. A propriedade pode incluir piscina privada, jardim, terraços, quartos espaçosos, ar condicionado, Wi-Fi e serviços opcionais como chef, empregada, pequeno-almoço, transfer do aeroporto e apoio de concierge.`,
      IT: `${name} è pensata per ospiti che cercano privacy, comfort e un soggiorno premium a Marrakech. La proprietà può includere piscina privata, giardino, terrazze, camere spaziose, aria condizionata, Wi-Fi e servizi opzionali come chef, personale domestico, colazione, transfer aeroportuale e supporto concierge.`,
      DE: `${name} ist für Gäste gedacht, die Privatsphäre, Komfort und einen Premium-Aufenthalt in Marrakesch suchen. Die Unterkunft kann privaten Pool, Garten, Terrassen, geräumige Schlafzimmer, Klimaanlage, WLAN und optionale Services wie Koch, Haushaltshilfe, Frühstück, Flughafentransfer und Concierge-Unterstützung bieten.`,
    },

    SWIMMINGPOOL: {
      EN: `${name} gives guests access to a comfortable swimming pool setting in Marrakech. Depending on the selected option, the experience may include sunbeds, towels, lunch access, drinks, shaded areas, music, family-friendly spaces, and private relaxation zones.`,
      FR: `${name} donne accès à un espace piscine confortable à Marrakech. Selon l’option choisie, l’expérience peut inclure transats, serviettes, déjeuner, boissons, espaces ombragés, musique, zones familiales et espaces privés de détente.`,
      ES: `${name} ofrece acceso a una piscina cómoda en Marrakech. Según la opción elegida, la experiencia puede incluir tumbonas, toallas, almuerzo, bebidas, zonas de sombra, música, espacios familiares y áreas privadas de relajación.`,
      PT: `${name} oferece acesso a uma piscina confortável em Marraquexe. Dependendo da opção escolhida, a experiência pode incluir espreguiçadeiras, toalhas, almoço, bebidas, zonas de sombra, música, espaços familiares e áreas privadas de relaxamento.`,
      IT: `${name} offre accesso a una piscina confortevole a Marrakech. A seconda dell’opzione scelta, l’esperienza può includere lettini, asciugamani, pranzo, bevande, zone d’ombra, musica, spazi per famiglie e aree relax private.`,
      DE: `${name} bietet Zugang zu einem komfortablen Poolbereich in Marrakesch. Je nach Option können Liegen, Handtücher, Mittagessen, Getränke, Schattenbereiche, Musik, familienfreundliche Bereiche und private Entspannungszonen enthalten sein.`,
    },

    ACTIVITY: {
      EN: `${name} is a curated local experience for travelers who want to discover Marrakech and its surroundings with comfort and support. The activity may include pickup coordination, local guide, private or shared format, equipment, refreshments, scenic stops, and flexible timing.`,
      FR: `${name} est une expérience locale sélectionnée pour découvrir Marrakech et ses alentours avec confort et accompagnement. L’activité peut inclure prise en charge, guide local, format privé ou partagé, équipement, rafraîchissements, arrêts panoramiques et horaires flexibles.`,
      ES: `${name} es una experiencia local seleccionada para descubrir Marrakech y sus alrededores con comodidad y apoyo. La actividad puede incluir recogida, guía local, formato privado o compartido, equipo, bebidas, paradas panorámicas y horarios flexibles.`,
      PT: `${name} é uma experiência local selecionada para descobrir Marraquexe e arredores com conforto e apoio. A atividade pode incluir recolha, guia local, formato privado ou partilhado, equipamento, bebidas, paragens panorâmicas e horários flexíveis.`,
      IT: `${name} è un’esperienza locale selezionata per scoprire Marrakech e dintorni con comfort e supporto. L’attività può includere pickup, guida locale, formato privato o condiviso, attrezzatura, bevande, soste panoramiche e orari flessibili.`,
      DE: `${name} ist ein ausgewähltes lokales Erlebnis, um Marrakesch und Umgebung komfortabel zu entdecken. Es kann Abholung, lokalen Guide, private oder geteilte Option, Ausrüstung, Erfrischungen, Panoramastopps und flexible Zeiten enthalten.`,
    },

    SPA: {
      EN: `${name} offers a relaxing Moroccan wellness experience with hammam inspiration, traditional black soap, argan oil, massage techniques, beauty care, and calm spa atmosphere.`,
      FR: `${name} propose une expérience bien-être marocaine avec inspiration hammam, savon noir traditionnel, huile d’argan, techniques de massage, soins beauté et atmosphère apaisante.`,
      ES: `${name} ofrece una experiencia de bienestar marroquí con inspiración de hammam, jabón negro tradicional, aceite de argán, técnicas de masaje, cuidados de belleza y ambiente relajante.`,
      PT: `${name} oferece uma experiência de bem-estar marroquina com inspiração no hammam, sabão negro tradicional, óleo de argão, técnicas de massagem, cuidados de beleza e ambiente relaxante.`,
      IT: `${name} offre un’esperienza benessere marocchina con ispirazione hammam, sapone nero tradizionale, olio di argan, tecniche di massaggio, trattamenti di bellezza e atmosfera rilassante.`,
      DE: `${name} bietet ein entspannendes marokkanisches Wellness-Erlebnis mit Hammam-Inspiration, traditioneller schwarzer Seife, Arganöl, Massagetechniken, Beauty-Pflege und ruhiger Spa-Atmosphäre.`,
    },

    TRANSPORTATION: {
      EN: `${name} is a private transportation service in Marrakech for airport transfers, city rides, restaurant transfers, events, day trips, and group movements. Vehicles are selected for comfort and reliability, with driver coordination, pickup planning, luggage support, and flexible itinerary options.`,
      FR: `${name} est un service de transport privé à Marrakech pour transferts aéroport, trajets en ville, restaurants, événements, excursions et déplacements de groupe. Les véhicules sont choisis pour leur confort et fiabilité, avec coordination chauffeur, prise en charge, bagages et itinéraire flexible.`,
      ES: `${name} es un servicio de transporte privado en Marrakech para traslados al aeropuerto, trayectos urbanos, restaurantes, eventos, excursiones y grupos. Los vehículos se seleccionan por comodidad y fiabilidad, con coordinación del conductor, recogida, equipaje e itinerario flexible.`,
      PT: `${name} é um serviço de transporte privado em Marraquexe para transfers do aeroporto, deslocações urbanas, restaurantes, eventos, excursões e grupos. Os veículos são escolhidos pelo conforto e fiabilidade, com coordenação do motorista, recolha, bagagem e itinerário flexível.`,
      IT: `${name} è un servizio di trasporto privato a Marrakech per transfer aeroportuali, spostamenti in città, ristoranti, eventi, escursioni e gruppi. I veicoli sono selezionati per comfort e affidabilità, con coordinamento autista, pickup, bagagli e itinerario flessibile.`,
      DE: `${name} ist ein privater Transportservice in Marrakesch für Flughafentransfers, Stadtfahrten, Restauranttransfers, Events, Tagesausflüge und Gruppenfahrten. Fahrzeuge werden nach Komfort und Zuverlässigkeit ausgewählt, mit Fahrerkoordination, Abholung, Gepäckhilfe und flexiblem Ablauf.`,
    },

    RESTAURANT: {
      EN: `${name} is a selected restaurant experience in Marrakech for guests looking for Moroccan cuisine, international dining, rooftop views, garden atmosphere, music, celebration setup, or private table booking.`,
      FR: `${name} est une expérience restaurant sélectionnée à Marrakech pour découvrir cuisine marocaine, table internationale, rooftop, jardin, musique, célébration ou réservation privée.`,
      ES: `${name} es una experiencia gastronómica seleccionada en Marrakech para cocina marroquí, restaurante internacional, terraza, jardín, música, celebración o reserva privada.`,
      PT: `${name} é uma experiência gastronómica selecionada em Marraquexe para cozinha marroquina, mesa internacional, rooftop, jardim, música, celebração ou reserva privada.`,
      IT: `${name} è un’esperienza ristorante selezionata a Marrakech per cucina marocchina, dining internazionale, rooftop, giardino, musica, celebrazioni o prenotazione privata.`,
      DE: `${name} ist ein ausgewähltes Restaurant-Erlebnis in Marrakesch für marokkanische Küche, internationale Gastronomie, Rooftop, Gartenambiente, Musik, Feiern oder private Tischreservierung.`,
    },
  };

  return descriptions[type][lang];
}

function getAddress(lang: Lang) {
  const addresses: Record<Lang, string> = {
    EN: "Marrakech, Morocco",
    FR: "Marrakech, Maroc",
    ES: "Marrakech, Marruecos",
    PT: "Marrakech, Marrocos",
    IT: "Marrakech, Marocco",
    DE: "Marrakesch, Marokko",
  };

  return addresses[lang];
}

function getPriceTitle(lang: Lang) {
  const priceTitles: Record<Lang, string> = {
    EN: "From",
    FR: "À partir de",
    ES: "Desde",
    PT: "A partir de",
    IT: "Da",
    DE: "Ab",
  };

  return priceTitles[lang];
}

function getTags(type: ProductType, lang: Lang) {
  const commonTags: Record<Lang, string[]> = {
    EN: ["Luxury", "Comfort", "Marrakech"],
    FR: ["Luxe", "Confort", "Marrakech"],
    ES: ["Lujo", "Comodidad", "Marrakech"],
    PT: ["Luxo", "Conforto", "Marrakech"],
    IT: ["Lusso", "Comfort", "Marrakech"],
    DE: ["Luxus", "Komfort", "Marrakesch"],
  };

  if (type === ProductType.VILLA) {
    return {
      EN: ["Private pool", "Chef option", "Luxury"],
      FR: ["Piscine privée", "Chef en option", "Luxe"],
      ES: ["Piscina privada", "Chef opcional", "Lujo"],
      PT: ["Piscina privada", "Chef opcional", "Luxo"],
      IT: ["Piscina privata", "Chef opzionale", "Lusso"],
      DE: ["Privater Pool", "Koch optional", "Luxus"],
    }[lang];
  }

  return commonTags[lang];
}

function getVillaTechRooms(index: number) {
  return 3 + (index % 6);
}

function getTransportationTechSeats(index: number) {
  const seatsPattern = [4, 4, 7, 4, 4, 7, 14, 4, 4, 4, 4, 5, 4, 4, 7, 4, 14, 4, 7, 4, 7, 5, 4, 4, 4, 4, 7, 7, 14, 5];
  return seatsPattern[index - 1] || 4;
}

function getDetails(type: ProductType, index: number, lang: Lang): Detail[] {
  const details: Record<ProductType, Record<Lang, Detail[]>> = {
    VILLA: {
      EN: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Capacity", value: `${8 + (index % 8)} guests` },
        { label: "Bedrooms", value: `${getVillaTechRooms(index)} bedrooms` },
        { label: "Pool", value: "Private swimming pool" },
        { label: "Services", value: index % 2 === 0 ? "Chef and maid available" : "Breakfast and housekeeping available" },
        { label: "Outdoor spaces", value: index % 3 === 0 ? "Garden, terrace and tennis court" : "Garden, terrace and lounge area" },
      ],
      FR: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Capacité", value: `${8 + (index % 8)} personnes` },
        { label: "Chambres", value: `${getVillaTechRooms(index)} chambres` },
        { label: "Piscine", value: "Piscine privée" },
        { label: "Services", value: index % 2 === 0 ? "Chef et femme de ménage disponibles" : "Petit-déjeuner et ménage disponibles" },
        { label: "Extérieurs", value: index % 3 === 0 ? "Jardin, terrasse et court de tennis" : "Jardin, terrasse et salon extérieur" },
      ],
      ES: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Capacidad", value: `${8 + (index % 8)} huéspedes` },
        { label: "Dormitorios", value: `${getVillaTechRooms(index)} dormitorios` },
        { label: "Piscina", value: "Piscina privada" },
        { label: "Servicios", value: index % 2 === 0 ? "Chef y limpieza disponibles" : "Desayuno y limpieza disponibles" },
        { label: "Exteriores", value: index % 3 === 0 ? "Jardín, terraza y pista de tenis" : "Jardín, terraza y zona lounge" },
      ],
      PT: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Capacidade", value: `${8 + (index % 8)} hóspedes` },
        { label: "Quartos", value: `${getVillaTechRooms(index)} quartos` },
        { label: "Piscina", value: "Piscina privada" },
        { label: "Serviços", value: index % 2 === 0 ? "Chef e empregada disponíveis" : "Pequeno-almoço e limpeza disponíveis" },
        { label: "Exterior", value: index % 3 === 0 ? "Jardim, terraço e campo de ténis" : "Jardim, terraço e zona lounge" },
      ],
      IT: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Capacità", value: `${8 + (index % 8)} ospiti` },
        { label: "Camere", value: `${getVillaTechRooms(index)} camere` },
        { label: "Piscina", value: "Piscina privata" },
        { label: "Servizi", value: index % 2 === 0 ? "Chef e personale disponibili" : "Colazione e pulizie disponibili" },
        { label: "Spazi esterni", value: index % 3 === 0 ? "Giardino, terrazza e campo da tennis" : "Giardino, terrazza e area lounge" },
      ],
      DE: [
        { techRooms: getVillaTechRooms(index) },
        { label: "Kapazität", value: `${8 + (index % 8)} Gäste` },
        { label: "Schlafzimmer", value: `${getVillaTechRooms(index)} Schlafzimmer` },
        { label: "Pool", value: "Privater Swimmingpool" },
        { label: "Services", value: index % 2 === 0 ? "Koch und Haushaltshilfe verfügbar" : "Frühstück und Reinigung verfügbar" },
        { label: "Außenbereiche", value: index % 3 === 0 ? "Garten, Terrasse und Tennisplatz" : "Garten, Terrasse und Lounge-Bereich" },
      ],
    },

    SWIMMINGPOOL: {
      EN: [
        { label: "Access", value: "Day pass" },
        { label: "Best for", value: "Couples, families and groups" },
        { label: "Included", value: "Sunbed access and pool area" },
        { label: "Optional", value: "Lunch, drinks and private cabana" },
        { label: "Timing", value: "Flexible daytime access" },
      ],
      FR: [
        { label: "Accès", value: "Pass journée" },
        { label: "Idéal pour", value: "Couples, familles et groupes" },
        { label: "Inclus", value: "Transat et accès piscine" },
        { label: "Optionnel", value: "Déjeuner, boissons et cabana privée" },
        { label: "Horaires", value: "Accès flexible en journée" },
      ],
      ES: [
        { label: "Acceso", value: "Pase diario" },
        { label: "Ideal para", value: "Parejas, familias y grupos" },
        { label: "Incluido", value: "Tumbona y acceso a la piscina" },
        { label: "Opcional", value: "Almuerzo, bebidas y cabana privada" },
        { label: "Horario", value: "Acceso flexible durante el día" },
      ],
      PT: [
        { label: "Acesso", value: "Passe diário" },
        { label: "Ideal para", value: "Casais, famílias e grupos" },
        { label: "Incluído", value: "Espreguiçadeira e acesso à piscina" },
        { label: "Opcional", value: "Almoço, bebidas e cabana privada" },
        { label: "Horário", value: "Acesso flexível durante o dia" },
      ],
      IT: [
        { label: "Accesso", value: "Pass giornaliero" },
        { label: "Ideale per", value: "Coppie, famiglie e gruppi" },
        { label: "Incluso", value: "Lettino e accesso piscina" },
        { label: "Opzionale", value: "Pranzo, bevande e cabana privata" },
        { label: "Orari", value: "Accesso flessibile durante il giorno" },
      ],
      DE: [
        { label: "Zugang", value: "Tagespass" },
        { label: "Ideal für", value: "Paare, Familien und Gruppen" },
        { label: "Inklusive", value: "Liegen und Poolbereich" },
        { label: "Optional", value: "Mittagessen, Getränke und private Cabana" },
        { label: "Zeit", value: "Flexibler Zugang tagsüber" },
      ],
    },

    ACTIVITY: {
      EN: [
        { label: "Duration", value: index % 3 === 0 ? "Full day" : "Half day" },
        { label: "Pickup", value: "Pickup coordination available" },
        { label: "Format", value: index % 2 === 0 ? "Private option available" : "Shared or private experience" },
        { label: "Included", value: "Local guidance and activity support" },
        { label: "Best for", value: "Couples, friends and families" },
      ],
      FR: [
        { label: "Durée", value: index % 3 === 0 ? "Journée complète" : "Demi-journée" },
        { label: "Prise en charge", value: "Coordination disponible" },
        { label: "Format", value: index % 2 === 0 ? "Option privée disponible" : "Expérience partagée ou privée" },
        { label: "Inclus", value: "Accompagnement local et assistance activité" },
        { label: "Idéal pour", value: "Couples, amis et familles" },
      ],
      ES: [
        { label: "Duración", value: index % 3 === 0 ? "Día completo" : "Medio día" },
        { label: "Recogida", value: "Coordinación disponible" },
        { label: "Formato", value: index % 2 === 0 ? "Opción privada disponible" : "Experiencia compartida o privada" },
        { label: "Incluido", value: "Guía local y asistencia" },
        { label: "Ideal para", value: "Parejas, amigos y familias" },
      ],
      PT: [
        { label: "Duração", value: index % 3 === 0 ? "Dia completo" : "Meio dia" },
        { label: "Recolha", value: "Coordenação disponível" },
        { label: "Formato", value: index % 2 === 0 ? "Opção privada disponível" : "Experiência partilhada ou privada" },
        { label: "Incluído", value: "Guia local e apoio" },
        { label: "Ideal para", value: "Casais, amigos e famílias" },
      ],
      IT: [
        { label: "Durata", value: index % 3 === 0 ? "Giornata intera" : "Mezza giornata" },
        { label: "Pickup", value: "Coordinamento disponibile" },
        { label: "Formato", value: index % 2 === 0 ? "Opzione privata disponibile" : "Esperienza condivisa o privata" },
        { label: "Incluso", value: "Guida locale e supporto attività" },
        { label: "Ideale per", value: "Coppie, amici e famiglie" },
      ],
      DE: [
        { label: "Dauer", value: index % 3 === 0 ? "Ganztägig" : "Halbtägig" },
        { label: "Abholung", value: "Koordination verfügbar" },
        { label: "Format", value: index % 2 === 0 ? "Private Option verfügbar" : "Geteiltes oder privates Erlebnis" },
        { label: "Inklusive", value: "Lokale Begleitung und Unterstützung" },
        { label: "Ideal für", value: "Paare, Freunde und Familien" },
      ],
    },

    SPA: {
      EN: [
        { label: "Duration", value: `${60 + (index % 4) * 30} minutes` },
        { label: "Includes", value: "Hammam, massage or wellness treatment" },
        { label: "Products", value: "Argan oil and Moroccan black soap" },
        { label: "Option", value: index % 2 === 0 ? "Couple room available" : "Private treatment room" },
        { label: "Atmosphere", value: "Calm Moroccan spa setting" },
      ],
      FR: [
        { label: "Durée", value: `${60 + (index % 4) * 30} minutes` },
        { label: "Comprend", value: "Hammam, massage ou soin bien-être" },
        { label: "Produits", value: "Huile d’argan et savon noir marocain" },
        { label: "Option", value: index % 2 === 0 ? "Salle couple disponible" : "Salle privée de soin" },
        { label: "Ambiance", value: "Atmosphère spa marocaine apaisante" },
      ],
      ES: [
        { label: "Duración", value: `${60 + (index % 4) * 30} minutos` },
        { label: "Incluye", value: "Hammam, masaje o tratamiento wellness" },
        { label: "Productos", value: "Aceite de argán y jabón negro marroquí" },
        { label: "Opción", value: index % 2 === 0 ? "Sala para pareja disponible" : "Sala privada de tratamiento" },
        { label: "Ambiente", value: "Ambiente tranquilo de spa marroquí" },
      ],
      PT: [
        { label: "Duração", value: `${60 + (index % 4) * 30} minutos` },
        { label: "Inclui", value: "Hammam, massagem ou tratamento wellness" },
        { label: "Produtos", value: "Óleo de argão e sabão negro marroquino" },
        { label: "Opção", value: index % 2 === 0 ? "Sala de casal disponível" : "Sala privada de tratamento" },
        { label: "Ambiente", value: "Ambiente calmo de spa marroquino" },
      ],
      IT: [
        { label: "Durata", value: `${60 + (index % 4) * 30} minuti` },
        { label: "Include", value: "Hammam, massaggio o trattamento wellness" },
        { label: "Prodotti", value: "Olio di argan e sapone nero marocchino" },
        { label: "Opzione", value: index % 2 === 0 ? "Sala coppia disponibile" : "Sala trattamento privata" },
        { label: "Atmosfera", value: "Ambiente spa marocchino rilassante" },
      ],
      DE: [
        { label: "Dauer", value: `${60 + (index % 4) * 30} Minuten` },
        { label: "Enthält", value: "Hammam, Massage oder Wellnessbehandlung" },
        { label: "Produkte", value: "Arganöl und marokkanische schwarze Seife" },
        { label: "Option", value: index % 2 === 0 ? "Paarraum verfügbar" : "Privater Behandlungsraum" },
        { label: "Atmosphäre", value: "Ruhige marokkanische Spa-Atmosphäre" },
      ],
    },

    TRANSPORTATION: {
      EN: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Service", value: "Private driver" },
        { label: "Vehicle", value: index % 3 === 0 ? "Van or minibus" : "Sedan or SUV" },
        { label: "Pickup", value: "Hotel, airport or villa pickup" },
        { label: "Included", value: "Driver coordination and luggage support" },
        { label: "Best for", value: "Airport, city rides and day trips" },
      ],
      FR: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Service", value: "Chauffeur privé" },
        { label: "Véhicule", value: index % 3 === 0 ? "Van ou minibus" : "Berline ou SUV" },
        { label: "Prise en charge", value: "Hôtel, aéroport ou villa" },
        { label: "Inclus", value: "Coordination chauffeur et assistance bagages" },
        { label: "Idéal pour", value: "Aéroport, trajets ville et excursions" },
      ],
      ES: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Servicio", value: "Conductor privado" },
        { label: "Vehículo", value: index % 3 === 0 ? "Van o minibús" : "Sedán o SUV" },
        { label: "Recogida", value: "Hotel, aeropuerto o villa" },
        { label: "Incluido", value: "Coordinación del conductor y ayuda con equipaje" },
        { label: "Ideal para", value: "Aeropuerto, ciudad y excursiones" },
      ],
      PT: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Serviço", value: "Motorista privado" },
        { label: "Veículo", value: index % 3 === 0 ? "Van ou minibus" : "Sedan ou SUV" },
        { label: "Recolha", value: "Hotel, aeroporto ou villa" },
        { label: "Incluído", value: "Coordenação do motorista e apoio com bagagem" },
        { label: "Ideal para", value: "Aeroporto, cidade e excursões" },
      ],
      IT: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Servizio", value: "Autista privato" },
        { label: "Veicolo", value: index % 3 === 0 ? "Van o minibus" : "Berlina o SUV" },
        { label: "Pickup", value: "Hotel, aeroporto o villa" },
        { label: "Incluso", value: "Coordinamento autista e supporto bagagli" },
        { label: "Ideale per", value: "Aeroporto, città ed escursioni" },
      ],
      DE: [
        { techSeats: getTransportationTechSeats(index) },
        { label: "Service", value: "Privater Fahrer" },
        { label: "Fahrzeug", value: index % 3 === 0 ? "Van oder Minibus" : "Limousine oder SUV" },
        { label: "Abholung", value: "Hotel, Flughafen oder Villa" },
        { label: "Inklusive", value: "Fahrerkoordination und Gepäckhilfe" },
        { label: "Ideal für", value: "Flughafen, Stadtfahrten und Tagesausflüge" },
      ],
    },

    RESTAURANT: {
      EN: [
        { label: "Cuisine", value: index % 2 === 0 ? "Moroccan and international" : "Traditional Moroccan" },
        { label: "Best for", value: "Lunch, dinner and celebrations" },
        { label: "Booking", value: "Table reservation support" },
        { label: "Options", value: "Rooftop, garden or riad atmosphere" },
        { label: "Dietary needs", value: "Vegetarian options on request" },
      ],
      FR: [
        { label: "Cuisine", value: index % 2 === 0 ? "Marocaine et internationale" : "Marocaine traditionnelle" },
        { label: "Idéal pour", value: "Déjeuner, dîner et célébrations" },
        { label: "Réservation", value: "Assistance réservation de table" },
        { label: "Options", value: "Rooftop, jardin ou ambiance riad" },
        { label: "Régimes", value: "Options végétariennes sur demande" },
      ],
      ES: [
        { label: "Cocina", value: index % 2 === 0 ? "Marroquí e internacional" : "Marroquí tradicional" },
        { label: "Ideal para", value: "Almuerzo, cena y celebraciones" },
        { label: "Reserva", value: "Apoyo para reservar mesa" },
        { label: "Opciones", value: "Rooftop, jardín o ambiente riad" },
        { label: "Dietas", value: "Opciones vegetarianas bajo petición" },
      ],
      PT: [
        { label: "Cozinha", value: index % 2 === 0 ? "Marroquina e internacional" : "Marroquina tradicional" },
        { label: "Ideal para", value: "Almoço, jantar e celebrações" },
        { label: "Reserva", value: "Apoio na reserva de mesa" },
        { label: "Opções", value: "Rooftop, jardim ou ambiente riad" },
        { label: "Dietas", value: "Opções vegetarianas mediante pedido" },
      ],
      IT: [
        { label: "Cucina", value: index % 2 === 0 ? "Marocchina e internazionale" : "Marocchina tradizionale" },
        { label: "Ideale per", value: "Pranzo, cena e celebrazioni" },
        { label: "Prenotazione", value: "Supporto prenotazione tavolo" },
        { label: "Opzioni", value: "Rooftop, giardino o atmosfera riad" },
        { label: "Esigenze alimentari", value: "Opzioni vegetariane su richiesta" },
      ],
      DE: [
        { label: "Küche", value: index % 2 === 0 ? "Marokkanisch und international" : "Traditionell marokkanisch" },
        { label: "Ideal für", value: "Mittagessen, Abendessen und Feiern" },
        { label: "Buchung", value: "Unterstützung bei Tischreservierung" },
        { label: "Optionen", value: "Rooftop, Garten oder Riad-Ambiente" },
        { label: "Ernährung", value: "Vegetarische Optionen auf Anfrage" },
      ],
    },
  };

  return details[type][lang];
}

function createProduct(type: ProductType, index: number) {
  const name = getName(type, index);

  return {
    uniqueCode: `${type}_${String(index).padStart(3, "0")}`,
    type,
    priceEuro: getPrice(type, index),
    order: index <= 10 ? index : null,
    thumbnail: imageByType[type],

    titleFR: name,
    titleEN: name,
    titleDE: name,
    titleIT: name,
    titlePT: name,
    titleES: name,

    subtitleFR: getSubtitle(type, "FR"),
    subtitleEN: getSubtitle(type, "EN"),
    subtitleDE: getSubtitle(type, "DE"),
    subtitleIT: getSubtitle(type, "IT"),
    subtitlePT: getSubtitle(type, "PT"),
    subtitleES: getSubtitle(type, "ES"),

    priceTitleFR: getPriceTitle("FR"),
    priceTitleEN: getPriceTitle("EN"),
    priceTitleDE: getPriceTitle("DE"),
    priceTitleIT: getPriceTitle("IT"),
    priceTitlePT: getPriceTitle("PT"),
    priceTitleES: getPriceTitle("ES"),

    descriptionFR: getDescription(type, index, "FR"),
    descriptionEN: getDescription(type, index, "EN"),
    descriptionDE: getDescription(type, index, "DE"),
    descriptionIT: getDescription(type, index, "IT"),
    descriptionPT: getDescription(type, index, "PT"),
    descriptionES: getDescription(type, index, "ES"),

    addressFR: getAddress("FR"),
    addressEN: getAddress("EN"),
    addressDE: getAddress("DE"),
    addressIT: getAddress("IT"),
    addressPT: getAddress("PT"),
    addressES: getAddress("ES"),

    tagsFR: getTags(type, "FR"),
    tagsEN: getTags(type, "EN"),
    tagsDE: getTags(type, "DE"),
    tagsIT: getTags(type, "IT"),
    tagsPT: getTags(type, "PT"),
    tagsES: getTags(type, "ES"),

    detailsFR: getDetails(type, index, "FR"),
    detailsEN: getDetails(type, index, "EN"),
    detailsDE: getDetails(type, index, "DE"),
    detailsIT: getDetails(type, index, "IT"),
    detailsPT: getDetails(type, index, "PT"),
    detailsES: getDetails(type, index, "ES"),

    image1: imageByType[type],
    image2: imageByType[type],
    image3: imageByType[type],
    image4: imageByType[type],
    image5: imageByType[type],
    image6: imageByType[type],
    image7: imageByType[type],
    image8: imageByType[type],
    image9: imageByType[type],
    image10: imageByType[type],
    image11: imageByType[type],
    image12: imageByType[type],
    image13: imageByType[type],
    image14: imageByType[type],
    image15: imageByType[type],
    image16: imageByType[type],
  };
}

async function main() {
  await prisma.product.deleteMany();

  for (const type of productTypes) {
    for (let i = 1; i <= 30; i++) {
      await prisma.product.create({
        data: createProduct(type, i),
      });
    }
  }

  const count = await prisma.product.count();
  console.log(`Seed completed. Inserted ${count} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });