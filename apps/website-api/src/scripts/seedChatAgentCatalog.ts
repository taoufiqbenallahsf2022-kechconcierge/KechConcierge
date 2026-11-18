import assert from "node:assert/strict";
import { prisma } from "../config/prisma";
import { getProductDetails, searchAgentProducts } from "../services/product.service";

// Additive development fixtures. Never invoke the general catalog-reset seed.
const PREFIX = "qa-agent-";
type Text = [string, string]; // EN, FR; other locales use the existing EN fallback.
type Plan = { code: string; title: Text; description: Text; price: number; unit: string; options: Text[]; duration?: number; minimum?: number; maximum?: number; serviceType?: string; origin?: string; destination?: string };
type Product = { type: string; delegate: string; code: string; name: string; location: Text; description: Text; tags?: Text[]; price?: number | null; driverPrice?: number; driverLabel?: Text; plans?: Plan[] };
const driver: Text = ["Professional private driver", "Chauffeur privé professionnel"];
const water: Text = ["Bottled water", "Eau en bouteille"];
const towel: Text = ["Pool towel", "Serviette de piscine"];
const pickup: Text = ["Hotel pickup and return in Marrakech", "Prise en charge et retour à l’hôtel à Marrakech"];
const transfer = (code: string, title: Text, price: number, unit: string, description: Text, options: Text[], extra: Partial<Plan> = {}): Plan => ({ code, title, price, unit, description, options, ...extra });
const medina: Text = ["Marrakech Medina", "Médina de Marrakech"];
const palmeraie: Text = ["Marrakech Palmeraie", "Palmeraie de Marrakech"];
const agafay: Text = ["Agafay Desert, near Marrakech", "Désert d’Agafay, près de Marrakech"];
const hivernage: Text = ["Marrakech Hivernage", "Hivernage, Marrakech"];

const products: Product[] = [
  { type: "VILLA", delegate: "villa", code: "villa-saffron", name: "Villa Saffron", location: palmeraie, price: 320, driverPrice: 400,
    driverLabel: ["Seven-seat van and driver for 8 hours / 100 km per day included", "Van sept places et chauffeur pendant 8 heures / 100 km par jour inclus"],
    description: ["A family villa with 3 bedrooms and 3 bathrooms for up to 6 guests. Private pool with a gated pool area, enclosed garden, equipped kitchen, fibre Wi-Fi and daily housekeeping. Breakfast, groceries and pool heating are not included. Minimum stay: 2 nights. No parties. The optional driver package includes a seven-seat van, driver, fuel and up to 8 hours / 100 km per day; intercity travel is excluded.", "Villa familiale avec 3 chambres et 3 salles de bains pour 6 personnes maximum. Piscine privée avec accès fermé par un portillon, jardin clos, cuisine équipée, Wi-Fi fibre et ménage quotidien. Petit-déjeuner, courses et chauffage de la piscine non inclus. Séjour minimum : 2 nuits. Fêtes interdites. La formule avec chauffeur comprend un van sept places, le chauffeur, le carburant et jusqu’à 8 heures / 100 km par jour ; trajets interurbains exclus."],
    tags: [["Family friendly", "Adaptée aux familles"], ["Gated private pool", "Piscine privée avec portillon"], ["3 bedrooms · 6 guests", "3 chambres · 6 personnes"], ["Kitchen", "Cuisine équipée"]] },
  { type: "VILLA", delegate: "villa", code: "villa-palm-serenity", name: "Villa Palm Serenity", location: palmeraie, price: 750, driverPrice: 850,
    driverLabel: ["Seven-seat van and driver for 8 hours / 100 km per day included", "Van sept places et chauffeur pendant 8 heures / 100 km par jour inclus"],
    description: ["A quiet 5-bedroom villa for up to 10 guests, with 5 bathrooms, two ground-floor bedrooms, step-free entrance and a private pool heated from October to March. Continental breakfast, daily housekeeping, fibre Wi-Fi and a cot on request are included. Lunch, dinner and a private chef are not included. Minimum stay: 3 nights. No amplified outdoor music. Driver package: one seven-seat van for 8 hours / 100 km daily; it cannot carry all ten guests at once.", "Villa calme de 5 chambres pour 10 personnes maximum, avec 5 salles de bains, deux chambres au rez-de-chaussée, entrée sans marche et piscine privée chauffée d’octobre à mars. Petit-déjeuner continental, ménage quotidien, Wi-Fi fibre et lit bébé sur demande inclus. Déjeuner, dîner et chef privé non inclus. Séjour minimum : 3 nuits. Musique amplifiée en extérieur interdite. Formule chauffeur : un van sept places pendant 8 heures / 100 km par jour ; il ne peut pas transporter dix personnes simultanément."],
    tags: [["Heated pool October–March", "Piscine chauffée octobre–mars"], ["Breakfast included", "Petit-déjeuner inclus"], ["Step-free entrance", "Entrée sans marche"], ["5 bedrooms · 10 guests", "5 chambres · 10 personnes"]] },
  { type: "VILLA", delegate: "villa", code: "villa-atlas-horizon", name: "Villa Atlas Horizon", location: ["Route de l’Ourika, Marrakech", "Route de l’Ourika, Marrakech"], price: 1100, driverPrice: 1250,
    driverLabel: ["Two seven-seat vans and drivers for 8 hours / 100 km per day included", "Deux vans sept places avec chauffeurs pendant 8 heures / 100 km par jour inclus"],
    description: ["A 6-bedroom, 6-bathroom retreat for up to 12 guests with Atlas Mountain views, a private padel court, cinema room and an unheated pool. Daily housekeeping and breakfast are included. Pool heating is unavailable. Minimum stay: 3 nights. Private dinners are allowed but DJ events and parties are not. The driver package includes two seven-seat vans, two drivers and fuel for 8 hours / 100 km per vehicle daily. Airport transfers outside those hours are not included.", "Retraite de 6 chambres et 6 salles de bains pour 12 personnes maximum, avec vue sur l’Atlas, terrain de padel privé, salle de cinéma et piscine non chauffée. Ménage quotidien et petit-déjeuner inclus. Le chauffage de la piscine n’est pas proposé. Séjour minimum : 3 nuits. Dîners privés autorisés, soirées DJ et fêtes interdites. La formule chauffeur comprend deux vans sept places, deux chauffeurs et le carburant pendant 8 heures / 100 km par véhicule et par jour. Transferts aéroport hors de ces horaires non inclus."],
    tags: [["Mountain views", "Vue sur l’Atlas"], ["Private padel court", "Padel privé"], ["Cinema room", "Salle de cinéma"], ["6 bedrooms · 12 guests", "6 chambres · 12 personnes"]] },
  { type: "VILLA", delegate: "villa", code: "riad-jasmine", name: "Riad Jasmine", location: medina, price: 180,
    description: ["An intimate 2-bedroom, 2-bathroom riad for up to 4 guests aged 12 or over. Rooftop terrace, small unheated plunge pool, Wi-Fi and daily housekeeping. Access includes eight steep stairs; there is no lift or step-free access. No on-site parking. Breakfast and driver services are not included, and no driver-inclusive price is published. Minimum stay: 2 nights. Quiet hours from 22:00.", "Riad intimiste de 2 chambres et 2 salles de bains pour 4 personnes maximum âgées de 12 ans ou plus. Terrasse sur le toit, petit bassin non chauffé, Wi-Fi et ménage quotidien. L’accès comprend huit marches raides ; ni ascenseur ni accès sans marche. Aucun parking sur place. Petit-déjeuner et chauffeur non inclus ; aucun tarif avec chauffeur n’est publié. Séjour minimum : 2 nuits. Calme demandé à partir de 22 h."],
    tags: [["Adults and teenagers 12+", "Adultes et adolescents de 12 ans et plus"], ["Rooftop terrace", "Terrasse sur le toit"], ["Stairs required", "Escaliers obligatoires"], ["2 bedrooms · 4 guests", "2 chambres · 4 personnes"]] },

  { type: "TRANSPORTATION", delegate: "transportation", code: "city-sedan", name: "City Sedan", location: medina,
    description: ["Private air-conditioned sedan for up to 3 passengers and 2 large suitcases. A child seat can be requested; confirmation is handled by the advisor. Not wheelchair-accessible. Airport plans include 60 minutes of waiting after landing; other journeys, extra stops and intercity trips are excluded unless listed in a plan.", "Berline privée climatisée pour 3 passagers et 2 grandes valises maximum. Siège enfant sur demande, à confirmer par la conseillère. Véhicule non adapté aux fauteuils roulants. Les transferts aéroport incluent 60 minutes d’attente après l’atterrissage ; autres trajets, arrêts supplémentaires et déplacements interurbains exclus sauf mention dans la formule."],
    plans: [
      transfer("airport-medina", ["Airport to Medina", "Aéroport vers Médina"], 28, "PER_VEHICLE", ["One-way airport transfer for up to 3 passengers and 2 large suitcases. Includes parking and 60 minutes of airport waiting. Return journey excluded.", "Transfert aéroport aller simple pour 3 passagers et 2 grandes valises maximum. Parking et 60 minutes d’attente inclus. Retour exclu."], [driver, water], { duration: 30, serviceType: "AIRPORT_TRANSFER", origin: "Marrakech Airport", destination: "Marrakech Medina" }),
      transfer("half-day", ["Half-day city driver", "Chauffeur en ville — demi-journée"], 90, "HALF_DAY", ["4 hours and 60 km within Marrakech for up to 3 passengers. Extra time, intercity travel and meals excluded.", "4 heures et 60 km dans Marrakech pour 3 passagers maximum. Heures supplémentaires, trajets interurbains et repas exclus."], [driver, water, pickup], { duration: 240, serviceType: "PRIVATE_HIRE" }),
      transfer("full-day", ["Full-day city driver", "Chauffeur en ville — journée"], 155, "FULL_DAY", ["8 hours and 120 km within Marrakech for up to 3 passengers. Extra time and intercity travel excluded.", "8 heures et 120 km dans Marrakech pour 3 passagers maximum. Heures supplémentaires et trajets interurbains exclus."], [driver, water, pickup], { duration: 480, serviceType: "PRIVATE_HIRE" }),
    ] },
  { type: "TRANSPORTATION", delegate: "transportation", code: "family-van", name: "Family Van", location: palmeraie,
    description: ["Air-conditioned seven-seat passenger van for up to 7 guests and 7 medium suitcases. Two child seats may be requested in advance, subject to advisor confirmation. Sliding doors and generous luggage space; no wheelchair ramp. Fuel and driver are included in every published plan.", "Van climatisé pour 7 passagers et 7 valises moyennes maximum. Deux sièges enfants peuvent être demandés à l’avance, à confirmer par la conseillère. Portes coulissantes et grand coffre, sans rampe pour fauteuil roulant. Carburant et chauffeur inclus dans chaque formule publiée."],
    plans: [
      transfer("airport-palmeraie", ["Airport to Palmeraie", "Aéroport vers Palmeraie"], 45, "PER_VEHICLE", ["One-way transfer for up to 7 passengers; parking and 60 minutes of waiting included. Return excluded.", "Transfert aller simple pour 7 passagers maximum ; parking et 60 minutes d’attente inclus. Retour exclu."], [driver, water], { duration: 45, serviceType: "AIRPORT_TRANSFER", origin: "Marrakech Airport", destination: "Marrakech Palmeraie" }),
      transfer("half-day", ["Family half-day driver", "Chauffeur famille — demi-journée"], 130, "HALF_DAY", ["4 hours / 80 km within Marrakech, up to 7 passengers. Meals and extra time excluded.", "4 heures / 80 km dans Marrakech, 7 passagers maximum. Repas et heures supplémentaires exclus."], [driver, water, pickup], { duration: 240, serviceType: "PRIVATE_HIRE" }),
      transfer("full-day", ["Family full-day driver", "Chauffeur famille — journée"], 220, "FULL_DAY", ["8 hours / 140 km within Marrakech, up to 7 passengers. Intercity journeys excluded.", "8 heures / 140 km dans Marrakech, 7 passagers maximum. Trajets interurbains exclus."], [driver, water, pickup], { duration: 480, serviceType: "PRIVATE_HIRE" }),
    ] },
  { type: "TRANSPORTATION", delegate: "transportation", code: "executive-electric", name: "Executive Electric", location: hivernage,
    description: ["Quiet premium electric sedan for up to 3 passengers and 2 medium suitcases. Air conditioning, onboard Wi-Fi and bottled water. Driver and charging costs are included. No child seat is carried as standard; request one through the advisor. No wheelchair ramp.", "Berline électrique premium silencieuse pour 3 passagers et 2 valises moyennes maximum. Climatisation, Wi-Fi à bord et eau en bouteille. Chauffeur et recharge inclus. Aucun siège enfant de série ; demande à transmettre à la conseillère. Pas de rampe pour fauteuil roulant."],
    plans: [
      transfer("airport-hivernage", ["Executive airport transfer", "Transfert aéroport exécutif"], 55, "PER_TRIP", ["One-way airport to Hivernage transfer, up to 3 passengers; 60 minutes of waiting and parking included.", "Transfert aller simple de l’aéroport à l’Hivernage, 3 passagers maximum ; 60 minutes d’attente et parking inclus."], [driver, water, ["Onboard Wi-Fi", "Wi-Fi à bord"]], { duration: 35, serviceType: "AIRPORT_TRANSFER", origin: "Marrakech Airport", destination: "Hivernage" }),
      transfer("hourly", ["Hourly executive driver", "Chauffeur exécutif à l’heure"], 45, "PER_HOUR", ["Published rate is per hour, with a minimum hire of 2 hours. Includes 20 km per booked hour within Marrakech. Extra kilometres and intercity trips excluded.", "Tarif publié par heure, avec location minimum de 2 heures. Inclut 20 km par heure réservée dans Marrakech. Kilomètres supplémentaires et trajets interurbains exclus."], [driver, water], { duration: 60, serviceType: "PRIVATE_HIRE" }),
      transfer("full-day", ["Executive full-day driver", "Chauffeur exécutif — journée"], 320, "FULL_DAY", ["8 hours / 120 km in Marrakech, up to 3 passengers. Meals, intercity trips and extra time excluded.", "8 heures / 120 km dans Marrakech, 3 passagers maximum. Repas, trajets interurbains et heures supplémentaires exclus."], [driver, water, pickup], { duration: 480, serviceType: "PRIVATE_HIRE" }),
    ] },
  { type: "TRANSPORTATION", delegate: "transportation", code: "atlas-minibus", name: "Atlas Minibus", location: medina,
    description: ["Private air-conditioned minibus for up to 15 passengers and 12 large suitcases. Suitable for groups, airport transfers and excursions. No wheelchair lift. Guide services, meals and attraction entry tickets are not included in transport prices.", "Minibus privé climatisé pour 15 passagers et 12 grandes valises maximum. Adapté aux groupes, transferts aéroport et excursions. Sans élévateur pour fauteuil roulant. Guide, repas et billets d’entrée aux attractions non inclus dans les tarifs de transport."],
    plans: [
      transfer("airport-group", ["Group airport transfer", "Transfert aéroport groupe"], 85, "PER_VEHICLE", ["One-way airport transfer to central Marrakech, up to 15 passengers. Parking and 60 minutes of waiting included.", "Transfert aéroport aller simple vers le centre de Marrakech, 15 passagers maximum. Parking et 60 minutes d’attente inclus."], [driver, water], { duration: 45, serviceType: "AIRPORT_TRANSFER", origin: "Marrakech Airport", destination: "Central Marrakech" }),
      transfer("ourika-day", ["Ourika Valley group day", "Journée groupe vallée de l’Ourika"], 280, "FULL_DAY", ["Private return excursion for up to 15 guests: 9 hours / 180 km. Driver, fuel and hotel pickup included. Guide, lunch and entry tickets excluded.", "Excursion privée aller-retour pour 15 personnes maximum : 9 heures / 180 km. Chauffeur, carburant et prise en charge à l’hôtel inclus. Guide, déjeuner et entrées exclus."], [driver, water, pickup], { duration: 540, serviceType: "EXCURSION", origin: "Marrakech", destination: "Ourika Valley" }),
      transfer("essaouira-one-way", ["One-way Essaouira transfer", "Transfert Essaouira aller simple"], 420, "PER_VEHICLE", ["One-way private intercity transfer for up to 15 guests. Approximate driving time 3.5 hours. Return transfer, sightseeing guide and meals excluded.", "Transfert interurbain privé aller simple pour 15 personnes maximum. Trajet d’environ 3 h 30. Retour, guide touristique et repas exclus."], [driver, water], { duration: 210, serviceType: "INTERCITY_TRANSFER", origin: "Marrakech", destination: "Essaouira" }),
    ] },

  { type: "SWIMMINGPOOL", delegate: "beachClub", code: "azure-family-club", name: "Azure Family Club", location: palmeraie,
    description: ["Family-friendly beach club with an unheated main pool and a shallow children's pool. Open 10:00–18:00. Child access plan applies to ages 4–11; ages 12+ use adult plans. Ask the advisor about children under 4. Swimwear is required. Outside food, overnight stays and transfers are not included. Lunch is included only in the adult pool-and-lunch plan.", "Beach club familial avec grande piscine non chauffée et bassin peu profond pour enfants. Ouvert de 10 h à 18 h. Formule enfant pour les 4–11 ans ; tarif adulte dès 12 ans. Consulter la conseillère pour les moins de 4 ans. Maillot de bain obligatoire. Nourriture extérieure, nuitées et transferts non inclus. Déjeuner inclus uniquement dans la formule adulte piscine et déjeuner."],
    plans: [
      transfer("adult-access", ["Adult pool access", "Accès piscine adulte"], 45, "PER_ADULT", ["For ages 12+, one sunbed, pool towel and one soft drink. Lunch excluded.", "Dès 12 ans, un transat, une serviette et une boisson sans alcool. Déjeuner exclu."], [towel, ["One sunbed", "Un transat"], ["One soft drink", "Une boisson sans alcool"]]),
      transfer("child-access", ["Child pool access, ages 4–11", "Accès piscine enfant, 4–11 ans"], 25, "PER_CHILD", ["For children aged 4–11 accompanied by an adult. Pool towel included; no separate sunbed, meal or transfer.", "Enfants de 4 à 11 ans accompagnés d’un adulte. Serviette incluse ; ni transat individuel, ni repas, ni transfert."], [towel, ["Children’s pool access", "Accès au bassin enfants"]]),
      transfer("adult-lunch", ["Adult pool and lunch", "Piscine et déjeuner adulte"], 70, "PER_ADULT", ["For ages 12+, pool access, one sunbed, towel and a two-course lunch. Alcohol and transfers excluded.", "Dès 12 ans, accès piscine, un transat, serviette et déjeuner deux plats. Alcool et transferts exclus."], [towel, ["One sunbed", "Un transat"], ["Two-course lunch", "Déjeuner deux plats"]]),
    ] },
  { type: "SWIMMINGPOOL", delegate: "beachClub", code: "dune-quiet-retreat", name: "Dune Quiet Retreat", location: agafay,
    description: ["Quiet adults-only pool retreat, minimum age 18, with desert views and no DJ. Main pool is heated November–February. Day access 10:00–18:00; sunset dinner access 17:00–22:00. Swimwear required; no outside food. Transport and overnight accommodation are excluded from every pool plan.", "Retraite piscine calme réservée aux adultes dès 18 ans, vue sur le désert et sans DJ. Piscine chauffée de novembre à février. Accès journée de 10 h à 18 h ; formule dîner de 17 h à 22 h. Maillot obligatoire, nourriture extérieure interdite. Transport et hébergement exclus de toutes les formules piscine."],
    plans: [
      transfer("quiet-day", ["Quiet pool day", "Journée piscine au calme"], 75, "PER_PERSON", ["One adult: sunbed, towel and mint tea. Lunch excluded.", "Un adulte : transat, serviette et thé à la menthe. Déjeuner exclu."], [towel, ["Sunbed and mint tea", "Transat et thé à la menthe"]]),
      transfer("sunset-dinner", ["Sunset pool and dinner", "Piscine au coucher du soleil et dîner"], 120, "PER_PERSON", ["One adult, 17:00–22:00: pool access, towel and three-course dinner. Alcohol excluded.", "Un adulte, de 17 h à 22 h : piscine, serviette et dîner trois plats. Alcool exclu."], [towel, ["Three-course dinner", "Dîner trois plats"]]),
      transfer("private-cabana", ["Private cabana, up to 4 adults", "Cabana privée, 4 adultes maximum"], 260, "PER_CABANA", ["One cabana for up to 4 adults from 10:00–18:00. Four towels and bottled water included; meals excluded. The rate is per cabana, not per person.", "Une cabana pour 4 adultes maximum de 10 h à 18 h. Quatre serviettes et eau incluses ; repas exclus. Tarif par cabana, pas par personne."], [["Private cabana for four", "Cabana privée pour quatre"], ["Four towels", "Quatre serviettes"], water]),
    ] },
  { type: "SWIMMINGPOOL", delegate: "beachClub", code: "oasis-social-club", name: "Oasis Social Club", location: hivernage,
    description: ["Lively adults-only beach club, ages 18+, with a resident DJ and an unheated pool. Open 11:00–19:00. Daybeds, lunch packages and six-person cabanas are separate options. Outside food and drinks are not allowed. No overnight accommodation or transport is included.", "Beach club animé réservé aux adultes dès 18 ans, avec DJ résident et piscine non chauffée. Ouvert de 11 h à 19 h. Transats, formules déjeuner et cabanas six personnes sont des options distinctes. Nourriture et boissons extérieures interdites. Hébergement et transport non inclus."],
    plans: [
      transfer("daybed", ["Single daybed", "Transat individuel"], 60, "PER_SUNBED", ["One sunbed for one adult, with pool access and towel. Meals and drinks excluded.", "Un transat pour un adulte, avec piscine et serviette. Repas et boissons exclus."], [towel, ["One sunbed for one adult", "Un transat pour un adulte"]]),
      transfer("lunch-day", ["Pool day with lunch", "Journée piscine avec déjeuner"], 95, "PER_PERSON", ["One adult: sunbed, towel, main course and dessert. Drinks excluded.", "Un adulte : transat, serviette, plat et dessert. Boissons exclues."], [towel, ["Main course and dessert", "Plat et dessert"]]),
      transfer("social-cabana", ["Social cabana, up to 6 adults", "Cabana conviviale, 6 adultes maximum"], 360, "PER_CABANA", ["One cabana for up to 6 adults, with six towels and pool access. Food, drinks and transport excluded.", "Une cabana pour 6 adultes maximum, avec six serviettes et accès piscine. Repas, boissons et transport exclus."], [["Private cabana for six", "Cabana privée pour six"], ["Six towels", "Six serviettes"]]),
    ] },

  { type: "NIGHTCLUB", delegate: "nightClub", code: "velvet-lounge", name: "Velvet Lounge", location: hivernage,
    description: ["Late-night lounge with soul and house music, open 22:00–03:00. Minimum age 21; original photo ID required. Smart-casual dress, no sportswear. Admission is subject to the venue's door policy and advisor confirmation. No transport included.", "Lounge nocturne soul et house, ouvert de 22 h à 3 h. Âge minimum 21 ans ; pièce d’identité originale avec photo obligatoire. Tenue chic décontractée, vêtements de sport interdits. Admission soumise au règlement d’entrée et à confirmation par la conseillère. Transport non inclus."],
    plans: [
      transfer("entry", ["Individual entry", "Entrée individuelle"], 30, "PER_PERSON", ["Admission for one guest aged 21+. Drinks and reserved seating excluded.", "Entrée pour une personne de 21 ans ou plus. Boissons et place réservée exclues."], [["Venue admission", "Entrée à l’établissement"]]),
      transfer("table-four", ["Lounge table for four", "Table lounge pour quatre"], 300, "PER_TABLE", ["Reserved table and admission for up to 4 guests aged 21+. One house bottle and mixers included. Extra guests and transport excluded.", "Table réservée et entrée pour 4 personnes maximum de 21 ans ou plus. Une bouteille maison et accompagnements inclus. Personnes supplémentaires et transport exclus."], [["Reserved table for four", "Table réservée pour quatre"], ["Admission for four", "Entrée pour quatre"], ["House bottle and mixers", "Bouteille maison et accompagnements"]]),
    ] },
  { type: "NIGHTCLUB", delegate: "nightClub", code: "pulse-rooftop", name: "Pulse Rooftop", location: hivernage,
    description: ["Rooftop electronic-music venue, open 21:00–02:00, minimum age 18. Photo ID and closed shoes required. Smart-casual dress. Outdoor terrace can close in bad weather. Admission and tables require advisor confirmation; transport is not included.", "Rooftop de musique électronique, ouvert de 21 h à 2 h, dès 18 ans. Pièce d’identité avec photo et chaussures fermées obligatoires. Tenue chic décontractée. Terrasse susceptible de fermer par mauvais temps. Entrées et tables à confirmer par la conseillère ; transport non inclus."],
    plans: [
      transfer("entry", ["Rooftop entry", "Entrée rooftop"], 25, "PER_PERSON", ["One adult entry; no drink or reserved table included.", "Entrée pour un adulte ; sans boisson ni table réservée."], [["Venue admission", "Entrée à l’établissement"]]),
      transfer("vip-six", ["VIP table for six", "Table VIP pour six"], 240, "PER_TABLE", ["Reserved table and admission for up to 6 adults. Bottled water and fruit platter included; alcoholic drinks excluded.", "Table réservée et entrée pour 6 adultes maximum. Eau et plateau de fruits inclus ; boissons alcoolisées exclues."], [["Table and entry for six", "Table et entrée pour six"], water, ["Fruit platter", "Plateau de fruits"]]),
    ] },

  { type: "ACTIVITY", delegate: "activity", code: "atlas-kitchen", name: "Atlas Kitchen Workshop", location: medina,
    description: ["Hands-on Moroccan cooking workshop with a market walk, seasonal ingredients and lunch from the dishes prepared. Minimum age 8. Vegetarian menus can be requested in advance; an allergen-free kitchen is not guaranteed. Hotel transport is excluded.", "Atelier pratique de cuisine marocaine avec visite du marché, ingrédients de saison et déjeuner composé des plats préparés. Dès 8 ans. Menu végétarien sur demande préalable ; cuisine sans allergènes non garantie. Transport depuis l’hôtel exclu."],
    plans: [
      transfer("shared", ["Shared cooking workshop", "Atelier cuisine partagé"], 65, "PER_PERSON", ["4 hours, minimum 2 and maximum 8 guests, ages 8+. Market walk, ingredients, cooking guidance, lunch and recipe sheet included.", "4 heures, de 2 à 8 personnes, dès 8 ans. Marché, ingrédients, cours, déjeuner et fiche recettes inclus."], [["Market walk and ingredients", "Marché et ingrédients"], ["Cooking lesson and lunch", "Cours de cuisine et déjeuner"], ["Recipe sheet", "Fiche recettes"]], { duration: 240, minimum: 2, maximum: 8 }),
      transfer("private", ["Private cooking workshop, up to four", "Atelier cuisine privé, jusqu’à quatre"], 280, "PER_GROUP", ["3 hours for a private group of 1–4 guests aged 8+. Ingredients, private instructor, lunch and recipes included. Market walk excluded.", "3 heures pour un groupe privé de 1 à 4 personnes dès 8 ans. Ingrédients, professeur privé, déjeuner et recettes inclus. Visite du marché exclue."], [["Private instructor", "Professeur privé"], ["Ingredients, lunch and recipes", "Ingrédients, déjeuner et recettes"]], { duration: 180, minimum: 1, maximum: 4 }),
    ] },
  { type: "ACTIVITY", delegate: "activity", code: "desert-buggy", name: "Desert Buggy Trail", location: agafay,
    description: ["Guided two-seat buggy ride on a marked desert trail. Drivers must be 18+ with a valid driving licence; passengers must be 12+. Helmets and goggles are mandatory and included. Bumpy terrain; activity is not offered to pregnant guests. Meals and hotel transfers are excluded.", "Balade guidée en buggy deux places sur piste balisée dans le désert. Conducteurs dès 18 ans avec permis valide ; passagers dès 12 ans. Casques et lunettes obligatoires et inclus. Terrain accidenté ; activité non proposée aux personnes enceintes. Repas et transferts depuis l’hôtel exclus."],
    plans: [
      transfer("shared-trail", ["Shared buggy trail", "Balade buggy en groupe"], 90, "PER_PERSON", ["2 hours, group of 2–8 guests, two riders per buggy. Safety briefing, guide, helmet, goggles and water included. Driver and passenger age rules apply.", "2 heures, groupe de 2 à 8 personnes, deux participants par buggy. Briefing, guide, casque, lunettes et eau inclus. Conditions d’âge conducteur et passager applicables."], [["Guide and safety briefing", "Guide et briefing sécurité"], ["Helmet and goggles", "Casque et lunettes"], water], { duration: 120, minimum: 2, maximum: 8 }),
      transfer("private-buggy", ["Private buggy for two", "Buggy privé pour deux"], 155, "PER_GROUP", ["2 hours, one private two-seat buggy for 1–2 guests with a guide. Rate is per buggy/group, not per person. Licence and age requirements still apply.", "2 heures, un buggy privé deux places pour 1 à 2 personnes avec guide. Tarif par buggy/groupe, pas par personne. Permis et conditions d’âge obligatoires."], [["Private two-seat buggy", "Buggy privé deux places"], ["Guide, helmet and goggles", "Guide, casque et lunettes"], water], { duration: 120, minimum: 1, maximum: 2 }),
    ] },
  { type: "ACTIVITY", delegate: "activity", code: "sunrise-balloon", name: "Sunrise Balloon Journey", location: palmeraie,
    description: ["Sunrise hot-air balloon experience, minimum age 6. Total outing about 4 hours, with approximately 45–60 minutes in the air when conditions permit. Flight departure, route and duration depend on weather and pilot approval. Never guaranteed by the catalog. Marrakech hotel transfers and breakfast are included.", "Expérience en montgolfière au lever du soleil, dès 6 ans. Sortie d’environ 4 heures, dont 45 à 60 minutes de vol si les conditions le permettent. Départ, itinéraire et durée dépendent de la météo et de l’accord du pilote ; jamais garantis par le catalogue. Transferts depuis l’hôtel à Marrakech et petit-déjeuner inclus."],
    plans: [
      transfer("shared-flight", ["Shared sunrise flight", "Vol partagé au lever du soleil"], 210, "PER_PERSON", ["One guest aged 6+, shared basket with up to 12 guests. Approximate outing 4 hours. Weather-dependent flight, hotel pickup and breakfast included.", "Une personne dès 6 ans, nacelle partagée de 12 personnes maximum. Sortie d’environ 4 heures. Vol selon météo, prise en charge à l’hôtel et petit-déjeuner inclus."], [pickup, ["Breakfast", "Petit-déjeuner"], ["Weather-dependent balloon flight", "Vol en montgolfière selon météo"]], { duration: 240, minimum: 1, maximum: 12 }),
      transfer("private-flight", ["Private balloon, up to six", "Montgolfière privée, jusqu’à six"], 1250, "PER_GROUP", ["Private basket for 1–6 guests aged 6+. Approximate outing 4 hours; flight subject to weather and pilot approval. Transfers and breakfast included.", "Nacelle privée pour 1 à 6 personnes dès 6 ans. Sortie d’environ 4 heures ; vol selon météo et accord du pilote. Transferts et petit-déjeuner inclus."], [pickup, ["Private basket for six", "Nacelle privée pour six"], ["Breakfast", "Petit-déjeuner"]], { duration: 240, minimum: 1, maximum: 6 }),
    ] },
  { type: "ACTIVITY", delegate: "activity", code: "medina-photo-walk", name: "Medina Photo Walk", location: medina,
    description: ["Private guided photography walk through Medina lanes, with digital edited photographs delivered within 72 hours. Uneven paths and stairs mean this route is not step-free. Attraction entrance tickets, meals and hotel transport are excluded. Local photo etiquette and consent are respected.", "Balade photo privée et guidée dans les ruelles de la Médina, avec photographies numériques retouchées livrées sous 72 heures. Sol irrégulier et escaliers : itinéraire non accessible sans marche. Entrées aux monuments, repas et transport depuis l’hôtel exclus. Respect des usages locaux et du consentement pour les photos."],
    plans: [
      transfer("classic", ["Classic photo walk", "Balade photo classique"], 110, "PER_GROUP", ["2 hours for a private group of 1–6 guests. Guide/photographer and 20 edited digital photographs included, delivered within 72 hours.", "2 heures pour un groupe privé de 1 à 6 personnes. Guide/photographe et 20 photos numériques retouchées inclus, livrés sous 72 heures."], [["Private guide/photographer", "Guide/photographe privé"], ["20 edited digital photos", "20 photos numériques retouchées"]], { duration: 120, minimum: 1, maximum: 6 }),
      transfer("golden-hour", ["Golden-hour photo walk", "Balade photo à la lumière dorée"], 180, "PER_GROUP", ["3 hours for a private group of 1–4 guests around sunset. Guide/photographer and 40 edited digital photographs included, delivered within 72 hours. Rooftop entry fees excluded.", "3 heures pour un groupe privé de 1 à 4 personnes autour du coucher du soleil. Guide/photographe et 40 photos numériques retouchées inclus, livrés sous 72 heures. Entrées aux rooftops exclues."], [["Private guide/photographer", "Guide/photographe privé"], ["40 edited digital photos", "40 photos numériques retouchées"]], { duration: 180, minimum: 1, maximum: 4 }),
    ] },

  { type: "RESTAURANT", delegate: "restaurant", code: "garden-table", name: "Garden Table", location: palmeraie, price: 35,
    description: ["Relaxed family-friendly garden restaurant with Moroccan and Mediterranean food. Published starting price is for a two-course set menu per person; drinks excluded. Vegetarian and vegan dishes are listed. High chairs available on request. Open 12:00–22:00. Kitchen handles nuts and gluten; allergen-free preparation is not guaranteed. Reservations require advisor confirmation.", "Restaurant de jardin familial, cuisine marocaine et méditerranéenne. Tarif publié à partir d’un menu deux plats par personne, boissons exclues. Plats végétariens et végétaliens proposés. Chaises hautes sur demande. Ouvert de 12 h à 22 h. Cuisine utilisant fruits à coque et gluten ; préparation sans allergènes non garantie. Réservations à confirmer par la conseillère."],
    tags: [["Vegetarian and vegan options", "Options végétariennes et végétaliennes"], ["Family friendly", "Adapté aux familles"], ["Garden dining", "Repas dans le jardin"]] },
  { type: "RESTAURANT", delegate: "restaurant", code: "ember-rooftop", name: "Ember Rooftop", location: medina, price: 57,
    description: ["Intimate rooftop grill with views over the Medina. Starting price is a three-course dinner menu per person, excluding drinks. Open 18:00–23:00. Smart-casual dress; access is via two flights of stairs with no lift. Vegetarian menu on advance request. No DJ or party events. Table availability must be checked by the advisor.", "Grill intimiste en rooftop avec vue sur la Médina. Tarif à partir d’un dîner trois plats par personne, boissons exclues. Ouvert de 18 h à 23 h. Tenue chic décontractée ; accès par deux étages d’escaliers, sans ascenseur. Menu végétarien sur demande préalable. Ni DJ ni événements festifs. Disponibilité des tables à vérifier par la conseillère."],
    tags: [["Rooftop views", "Vue depuis le rooftop"], ["Three-course dinner", "Dîner trois plats"], ["Stairs required", "Escaliers obligatoires"]] },
  { type: "RESTAURANT", delegate: "restaurant", code: "chefs-counter", name: "Chef’s Counter", location: hivernage, price: null,
    description: ["Private chef's counter tasting experience for 2–8 adults, ages 18+. Seasonal menu tailored after discussion of preferences. No public starting price or discount is listed. Drinks and transport are not included unless explicitly agreed. Menu requests and table/date availability require human confirmation. Open for dinner by appointment only.", "Dégustation privée au comptoir du chef pour 2 à 8 adultes dès 18 ans. Menu de saison personnalisé après échange sur les préférences. Aucun prix public de départ ni remise n’est publié. Boissons et transport non inclus sauf accord explicite. Menu et disponibilité des dates à confirmer par une personne. Dîner uniquement sur rendez-vous."],
    tags: [["Private tasting", "Dégustation privée"], ["No published price", "Sans prix public"], ["Adults only 18+", "Réservé aux adultes dès 18 ans"]] },
];

function localized(prefix: string, value: Text) { return { [`${prefix}EN`]: value[0], [`${prefix}FR`]: value[1] }; }
const notice: Text = ["Development test product: illustrative details and prices, not a real offer. Availability requires advisor confirmation.", "Produit de test local : informations et prix fictifs, pas une offre réelle. Disponibilité à confirmer par la conseillère."];

function assertLocalDevelopment() {
  const url = new URL(process.env.DATABASE_URL || "");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Only a local database is allowed");
  assert.equal(url.pathname.replace(/^\//, ""), "kechconcierge", "Expected the local kechconcierge development database");
  assert.ok(["local", "development"].includes(process.env.NODE_ENV || "local"), "Only development environments are allowed");
}

async function main() {
  assertLocalDevelopment();
  const types = [...new Set(products.map(p => p.delegate))];
  const before: Record<string, number> = {}, sources = new Map<string, any>(), originals = new Map<string, unknown>();
  for (const type of types) {
    const delegate = (prisma as any)[type];
    before[type] = await delegate.count();
    originals.set(type, await delegate.findMany({ where: { NOT: { uniqueCode: { startsWith: PREFIX } } }, select: { id: true, updatedAt: true }, orderBy: { id: "asc" } }));
    const source = await delegate.findFirst({ where: { isActive: true, NOT: { uniqueCode: { startsWith: PREFIX } }, thumbnail: { not: "" } }, include: { images: { orderBy: { order: "asc" }, take: 3 } }, orderBy: { createdAt: "asc" } });
    assert.ok(source?.thumbnail, `An existing ${type} image is needed; no image URL will be invented`);
    sources.set(type, source);
  }
  console.log("Existing local catalog:", before);
  console.log("Fixtures:", { products: products.length, plans: products.reduce((count, p) => count + (p.plans?.length || 0), 0) });
  if (!process.argv.includes("--apply")) { console.log("Inspection only. Pass --apply to insert these additive development fixtures."); return; }

  let inserted = 0;
  await prisma.$transaction(async tx => {
    for (const [index, p] of products.entries()) {
      const uniqueCode = PREFIX + p.code, delegate = (tx as any)[p.delegate];
      if (await delegate.findUnique({ where: { uniqueCode } })) continue;
      const source = sources.get(p.delegate), title: Text = [`TEST · ${p.name}`, `TEST · ${p.name}`];
      const images = [...new Set([source.thumbnail, ...source.images.map((image: any) => image.url)])].slice(0, 3);
      const data: any = { uniqueCode, order: 100 + index, isActive: true, thumbnail: source.thumbnail,
        ...localized("title", title), ...localized("subtitle", [p.description[0].split(". ")[0] + ".", p.description[1].split(". ")[0] + "."]),
        ...localized("description", [`${notice[0]}\n\n${p.description[0]}`, `${notice[1]}\n\n${p.description[1]}`]),
        ...localized(p.type === "VILLA" || p.type === "RESTAURANT" ? "address" : "location", p.location),
        images: { create: images.map((url, order) => ({ url, order, ...localized("alt", title) })) },
      };
      if (p.type === "VILLA" || p.type === "RESTAURANT") {
        data.priceEuro = p.price ?? null;
        Object.assign(data, localized("priceTitle", p.type === "VILLA" ? ["Per night, from", "Par nuit, à partir de"] : ["Set menu per person, from", "Menu par personne, à partir de"]));
        for (const [language, position] of [["EN", 0], ["FR", 1]] as const) {
          data[`tags${language}`] = p.tags?.map(tag => tag[position]) || [];
          data[`details${language}`] = [{ label: language === "EN" ? "Test information" : "Informations de test", value: p.description[position] }];
        }
        if (p.type === "VILLA") { data.priceWithDriverEuro = p.driverPrice ?? null; if (p.driverLabel) Object.assign(data, localized("priceWithDriverLabel", p.driverLabel)); }
      }
      if (p.plans) data.plans = { create: p.plans.map((plan, order) => {
        const row: any = { uniqueCode: plan.code, salePrice: plan.price, internalCost: Math.round(plan.price * 60) / 100, currency: "EUR", pricingUnit: plan.unit, order: order + 1, isActive: true,
          ...localized("title", plan.title), ...localized("description", plan.description),
          options: { create: plan.options.map((option, optionOrder) => ({ order: optionOrder + 1, isActive: true, ...localized("title", option) })) },
        };
        if (p.type !== "SWIMMINGPOOL") row.durationMinutes = plan.duration ?? null;
        if (p.type === "ACTIVITY") { row.minimumGuests = plan.minimum; row.maximumGuests = plan.maximum; }
        if (p.type === "TRANSPORTATION") { row.serviceType = plan.serviceType; row.origin = plan.origin; row.destination = plan.destination; }
        return row;
      }) };
      await delegate.create({ data }); inserted++;
    }
  }, { timeout: 30000 });

  // Verify the exact public retrieval path used by Cécile, including plan
  // inclusions, EUR prices and exclusion of internal supplier costs.
  for (const p of products) {
    const code = PREFIX + p.code, publicProduct: any = await getProductDetails(code, "en", p.type);
    assert.ok(publicProduct?.isActive !== false && publicProduct?.uniqueCode === code);
    assert.ok(publicProduct.description.includes(p.description[0]));
    assert.equal(publicProduct.priceEuro, p.plans ? Math.min(...p.plans.map(plan => plan.price)) : p.price ?? null);
    assert.equal(publicProduct.plans?.length || 0, p.plans?.length || 0);
    for (const plan of p.plans || []) {
      const actual = publicProduct.plans.find((item: any) => item.uniqueCode === plan.code);
      assert.equal(actual?.salePrice, plan.price); assert.equal(actual?.pricingUnit, plan.unit); assert.equal(actual?.options.length, plan.options.length);
    }
    assert.ok(!JSON.stringify(publicProduct).includes("internalCost"));
    assert.ok((await searchAgentProducts(code, p.type, "en")).some(item => item.uniqueCode === code));
    const frenchProduct: any = await getProductDetails(code, "fr", p.type);
    assert.ok(frenchProduct?.description?.includes(p.description[1]));
  }
  const after: Record<string, number> = {};
  for (const type of types) {
    after[type] = await (prisma as any)[type].count();
    assert.deepEqual(await (prisma as any)[type].findMany({ where: { NOT: { uniqueCode: { startsWith: PREFIX } } }, select: { id: true, updatedAt: true }, orderBy: { id: "asc" } }), originals.get(type), `Existing ${type} records must remain unchanged`);
  }
  console.log("Inserted:", inserted, "Existing fixture codes skipped:", products.length - inserted);
  console.log("Verified local catalog:", after);
  console.log("Verified all 20 fixtures through public product retrieval. Existing catalog records were preserved.");
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
