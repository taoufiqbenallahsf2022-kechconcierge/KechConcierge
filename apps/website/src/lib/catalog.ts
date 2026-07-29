import { CatalogItem, Category } from "@/types/catalog";

export const categoryLabels: Record<Category, string> = {
  villas: "Villas",
  activities: "Activities",
  transportation: "Transportation",
  spa: "SPA",
  restaurants: "Restaurants",
  swimmingpools: "Swimming pools"
};

export const categoryDescriptions: Record<Category, string> = {
  villas: "Private villas in Marrakech with pools, gardens, staff options, and premium comfort.",
  activities: "Quad, camel rides, desert trips, city tours, hot air balloon, and local experiences.",
  swimmingpools: "Quad, camel rides, desert trips, city tours, hot air balloon, and local experiences.",
  transportation: "Private cars, luxury vehicles, vans, and group transfers with reliable drivers.",
  spa: "Hammam, massage, beauty, and wellness experiences.",
  restaurants: "Selected Moroccan and international restaurants for memorable evenings."
};

const img = {
  villaA: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  villaB: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
  villaC: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
  villaD: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
  villaE: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
  villaF: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68",
  swimmingpoolA: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  swimmingpoolB: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  swimmingpoolC: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  swimmingpoolD: "https://images.unsplash.com/photo-1560448075-bb485b067938",
  swimmingpoolE: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
  activityA: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3",
  activityB: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  activityC: "https://images.unsplash.com/photo-1548013146-72479768bada",
  activityD: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2",
  activityE: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  carA: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
  carB: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341",
  carC: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
  spaA: "https://images.unsplash.com/photo-1540555700478-4be289fbecef",
  spaB: "https://images.unsplash.com/photo-1515377905703-c4788e51af15",
  spaC: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1",
  restaurantA: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  restaurantB: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
  restaurantC: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
  restaurantD: "https://images.unsplash.com/photo-1544148103-0773bf10d330"
};

const gallery = (...images: string[]) => images;

export const catalogItems: CatalogItem[] = [
  {
    id: "v1",
    category: "villas",
    slug: "palmeraie-private-villa",
    title: "Palmeraie Private Villa",
    location: "Palmeraie, Marrakech",
    price: "From €280 / night",
    images: gallery(img.villaA, img.villaB, img.villaC, img.villaD, img.villaE),
    shortDescription: "Elegant villa with private pool, garden, and optional housekeeper.",
    description: "A calm private villa designed for families and groups who want space, privacy, and a premium Marrakech experience.",
    highlights: ["Private pool", "Garden", "4 bedrooms", "Housekeeper option", "Airport transfer"],
    details: { Bedrooms: "4", Capacity: "Up to 8 guests", Pool: "Private", Staff: "Housekeeper and cook available", Area: "Palmeraie" }
  },
  {
    id: "v2",
    category: "villas",
    slug: "red-city-family-villa",
    title: "Red City Family Villa",
    location: "Route de l’Ourika",
    price: "From €220 / night",
    images: gallery(img.villaB, img.villaD, img.villaA, img.villaF),
    shortDescription: "Family villa with mountain views and outdoor dining space.",
    description: "A warm villa close to Marrakech with a relaxed atmosphere, outdoor dining, and enough room for families traveling together.",
    highlights: ["Mountain view", "Outdoor dining", "3 bedrooms", "Pool", "Family friendly"],
    details: { Bedrooms: "3", Capacity: "Up to 6 guests", Pool: "Private", Kitchen: "Fully equipped", Area: "Route de l’Ourika" }
  },
  {
    id: "v3",
    category: "villas",
    slug: "luxury-oasis-villa",
    title: "Luxury Oasis Villa",
    location: "Targa, Marrakech",
    price: "From €340 / night",
    images: gallery(img.villaC, img.villaE, img.villaB, img.villaA),
    shortDescription: "Premium villa with pool, lounge areas, and concierge support.",
    description: "A high-comfort villa for guests who want premium service, privacy, and easy access to Marrakech attractions.",
    highlights: ["Concierge", "Private pool", "5 bedrooms", "Large terrace", "Premium comfort"],
    details: { Bedrooms: "5", Capacity: "Up to 10 guests", Pool: "Private", Service: "Concierge support", Area: "Targa" }
  },
  {
    id: "v4",
    category: "villas",
    slug: "atlas-view-villa",
    title: "Atlas View Villa",
    location: "Amizmiz Road",
    price: "From €310 / night",
    images: gallery(img.villaD, img.villaA, img.villaF, img.villaB),
    shortDescription: "Quiet villa with Atlas Mountain view and outdoor lounge.",
    description: "A peaceful property for guests who want to stay outside the city noise while remaining close enough to Marrakech.",
    highlights: ["Atlas view", "Pool", "Outdoor lounge", "4 bedrooms", "Private garden"],
    details: { Bedrooms: "4", Capacity: "Up to 9 guests", View: "Atlas Mountains", Pool: "Private", Distance: "25 min from Marrakech" }
  },
  {
    id: "v5",
    category: "villas",
    slug: "medina-riad-villa",
    title: "Medina Riad Villa",
    location: "Medina, Marrakech",
    price: "From €190 / night",
    images: gallery(img.villaE, img.villaC, img.villaA, img.villaD),
    shortDescription: "Traditional riad-style villa close to the old city.",
    description: "A Moroccan-style property for travelers who want charm, local atmosphere, and easy access to the Medina.",
    highlights: ["Traditional style", "Patio", "Rooftop", "3 bedrooms", "Medina access"],
    details: { Bedrooms: "3", Capacity: "Up to 6 guests", Style: "Riad", Rooftop: "Yes", Area: "Medina" }
  },
  {
    id: "v6",
    category: "villas",
    slug: "golf-resort-villa",
    title: "Golf Resort Villa",
    location: "Agdal, Marrakech",
    price: "From €260 / night",
    images: gallery(img.villaF, img.villaB, img.villaD, img.villaC),
    shortDescription: "Comfort villa near golf areas and resort facilities.",
    description: "A clean and comfortable villa for guests who want resort-style surroundings and easy city access.",
    highlights: ["Golf area", "Pool", "3 bedrooms", "Terrace", "Secure residence"],
    details: { Bedrooms: "3", Capacity: "Up to 6 guests", Residence: "Secure", Pool: "Shared or private option", Area: "Agdal" }
  },

  {
    id: "a1",
    category: "swimmingpools",
    slug: "gueliz-modern-swimmingpool",
    title: "Gueliz Modern Apartment",
    location: "Gueliz, Marrakech",
    price: "From €75 / night",
    images: gallery(img.swimmingpoolA, img.swimmingpoolB, img.swimmingpoolC, img.swimmingpoolD),
    shortDescription: "Central swimmingpool with air conditioning and modern comfort.",
    description: "A practical city swimmingpool close to restaurants, cafés, shops, and transport.",
    highlights: ["Air conditioning", "2 bedrooms", "Wi-Fi", "Central location", "Equipped kitchen"],
    details: { Bedrooms: "2", Capacity: "Up to 4 guests", Climate: "Air conditioning", Kitchen: "Equipped", Area: "Gueliz" }
  },
  {
    id: "a2",
    category: "swimmingpools",
    slug: "hivernage-studio",
    title: "Hivernage Studio",
    location: "Hivernage, Marrakech",
    price: "From €55 / night",
    images: gallery(img.swimmingpoolB, img.swimmingpoolA, img.swimmingpoolE, img.swimmingpoolC),
    shortDescription: "Clean studio for short stays near premium city spots.",
    description: "A simple, clean studio for guests who want location, comfort, and good value in Marrakech.",
    highlights: ["Studio", "Air conditioning", "Wi-Fi", "Elevator", "Secure building"],
    details: { Type: "Studio", Capacity: "Up to 2 guests", Climate: "Air conditioning", Building: "Secure residence", Area: "Hivernage" }
  },
  {
    id: "a3",
    category: "swimmingpools",
    slug: "majorelle-one-bedroom",
    title: "Majorelle One Bedroom",
    location: "Majorelle, Marrakech",
    price: "From €65 / night",
    images: gallery(img.swimmingpoolC, img.swimmingpoolD, img.swimmingpoolA, img.swimmingpoolB),
    shortDescription: "One-bedroom swimmingpool near Majorelle Garden.",
    description: "A bright swimmingpool for couples or solo travelers who want a comfortable stay near popular Marrakech spots.",
    highlights: ["1 bedroom", "Air conditioning", "Near Majorelle", "Balcony", "Wi-Fi"],
    details: { Bedrooms: "1", Capacity: "Up to 2 guests", Climate: "Air conditioning", Balcony: "Yes", Area: "Majorelle" }
  },
  {
    id: "a4",
    category: "swimmingpools",
    slug: "family-swimmingpool-agdal",
    title: "Family Apartment Agdal",
    location: "Agdal, Marrakech",
    price: "From €90 / night",
    images: gallery(img.swimmingpoolD, img.swimmingpoolE, img.swimmingpoolB, img.swimmingpoolC),
    shortDescription: "Spacious swimmingpool for families with two bedrooms.",
    description: "A practical swimmingpool for families needing space, kitchen, air conditioning, and easy access to the city.",
    highlights: ["2 bedrooms", "Family friendly", "Air conditioning", "Kitchen", "Parking"],
    details: { Bedrooms: "2", Capacity: "Up to 5 guests", Parking: "Available", Kitchen: "Equipped", Area: "Agdal" }
  },
  {
    id: "a5",
    category: "swimmingpools",
    slug: "premium-hivernage-flat",
    title: "Premium Hivernage Flat",
    location: "Hivernage, Marrakech",
    price: "From €110 / night",
    images: gallery(img.swimmingpoolE, img.swimmingpoolA, img.swimmingpoolD, img.swimmingpoolC),
    shortDescription: "Premium flat with stylish design and central location.",
    description: "A higher-comfort swimmingpool for guests who want style, comfort, and premium surroundings.",
    highlights: ["Premium area", "2 bedrooms", "Stylish design", "Wi-Fi", "Air conditioning"],
    details: { Bedrooms: "2", Capacity: "Up to 4 guests", Climate: "Air conditioning", Style: "Premium", Area: "Hivernage" }
  },

  {
    id: "act1",
    category: "activities",
    slug: "quad-adventure",
    title: "Quad Adventure",
    location: "Agafay / Palmeraie",
    price: "From €45 / person",
    images: gallery(img.activityA, img.activityB, img.activityD, img.activityE),
    shortDescription: "Quad ride with guide, equipment, and photo stops.",
    description: "An exciting guided quad experience through desert-style landscapes near Marrakech.",
    highlights: ["Guide included", "Helmet included", "Photo stops", "Pickup option", "Beginner friendly"],
    details: { Duration: "2 hours", Pickup: "Available", Level: "Beginner friendly", Includes: "Guide and equipment", Group: "Private or shared" }
  },
  {
    id: "act2",
    category: "activities",
    slug: "ourika-day-trip",
    title: "Ourika Valley Day Trip",
    location: "Atlas Mountains",
    price: "From €35 / person",
    images: gallery(img.activityB, img.activityC, img.activityE, img.activityA),
    shortDescription: "Day trip to the Atlas Mountains with scenic stops.",
    description: "A relaxing day outside Marrakech with mountain landscapes, traditional villages, and local food options.",
    highlights: ["Atlas Mountains", "Private transport option", "Local guide option", "Scenic stops", "Family friendly"],
    details: { Duration: "Full day", Pickup: "Available", Guide: "Optional", Destination: "Ourika Valley", Meals: "Optional" }
  },
  {
    id: "act3",
    category: "activities",
    slug: "camel-ride-palmeraie",
    title: "Camel Ride Palmeraie",
    location: "Palmeraie",
    price: "From €25 / person",
    images: gallery(img.activityC, img.activityA, img.activityB, img.activityD),
    shortDescription: "Camel ride experience with tea break option.",
    description: "A simple and popular Marrakech activity for couples, families, and first-time visitors.",
    highlights: ["Camel ride", "Tea option", "Traditional clothes", "Photo moments", "Pickup option"],
    details: { Duration: "1 hour", Pickup: "Optional", Location: "Palmeraie", Includes: "Guide", BestFor: "Families and couples" }
  },
  {
    id: "act4",
    category: "activities",
    slug: "agafay-dinner-show",
    title: "Agafay Dinner Show",
    location: "Agafay Desert",
    price: "From €65 / person",
    images: gallery(img.activityD, img.activityE, img.activityB, img.activityA),
    shortDescription: "Desert dinner with music and night atmosphere.",
    description: "An evening in Agafay with transport option, dinner, music, and desert atmosphere.",
    highlights: ["Dinner", "Music", "Desert setting", "Pickup option", "Couple friendly"],
    details: { Duration: "Evening", Pickup: "Available", Meal: "Included", Location: "Agafay", Atmosphere: "Desert night" }
  },
  {
    id: "act5",
    category: "activities",
    slug: "marrakech-guided-tour",
    title: "Marrakech Guided Tour",
    location: "Medina",
    price: "From €30 / person",
    images: gallery(img.activityE, img.activityB, img.activityC, img.activityA),
    shortDescription: "Guided Medina tour with local insights.",
    description: "A cultural walking tour for guests who want to understand Marrakech, its souks, monuments, and history.",
    highlights: ["Local guide", "Medina", "Souks", "History", "Flexible route"],
    details: { Duration: "3 hours", Guide: "Included", Language: "French / English", Area: "Medina", Group: "Private option" }
  },

  {
    id: "t1",
    category: "transportation",
    slug: "mercedes-private-driver",
    title: "Mercedes Private Driver",
    location: "Marrakech",
    price: "From €60 / transfer",
    images: gallery(img.carA, img.carB, img.carC),
    shortDescription: "Comfort private transfers with professional driver.",
    description: "Reliable private transport for airport transfers, city rides, and daily chauffeur service.",
    highlights: ["Mercedes option", "Airport transfer", "Professional driver", "Air conditioning", "Private ride"],
    details: { Vehicle: "Mercedes or similar", Capacity: "Up to 3 guests", Driver: "Included", Use: "Transfer or daily booking", Comfort: "Premium" }
  },
  {
    id: "t2",
    category: "transportation",
    slug: "hyundai-van",
    title: "Hyundai Van",
    location: "Marrakech",
    price: "From €85 / transfer",
    images: gallery(img.carB, img.carA, img.carC),
    shortDescription: "Van option for families and medium groups.",
    description: "Comfortable van with driver for airport pickup, excursions, and daily transport.",
    highlights: ["Group friendly", "Air conditioning", "Driver included", "Airport transfer", "Excursions"],
    details: { Vehicle: "Hyundai van or similar", Capacity: "Up to 6 guests", Driver: "Included", Use: "Transfer or day trip", Comfort: "Standard plus" }
  },
  {
    id: "t3",
    category: "transportation",
    slug: "large-group-minibus",
    title: "Large Group Minibus",
    location: "Marrakech",
    price: "From €120 / transfer",
    images: gallery(img.carC, img.carB, img.carA),
    shortDescription: "Large vehicle for groups up to 12 people.",
    description: "A practical group transport solution for families, friends, events, and day trips.",
    highlights: ["Up to 12 guests", "Driver included", "Group trips", "Airport option", "Comfort seats"],
    details: { Vehicle: "Minibus", Capacity: "Up to 12 guests", Driver: "Included", Use: "Group transfer or day trip", BestFor: "Groups" }
  },
  {
    id: "t4",
    category: "transportation",
    slug: "airport-transfer",
    title: "Airport Transfer",
    location: "Marrakech Airport",
    price: "From €25 / transfer",
    images: gallery(img.carA, img.carC, img.carB),
    shortDescription: "Simple airport pickup or drop-off service.",
    description: "A reliable transfer between Marrakech airport and your accommodation.",
    highlights: ["Airport pickup", "Drop-off", "Driver included", "Flight tracking later", "Private ride"],
    details: { Vehicle: "Car or van", Capacity: "Depends on group size", Driver: "Included", Use: "Airport transfer", Area: "Marrakech" }
  },

  {
    id: "s1",
    category: "spa",
    slug: "traditional-hammam-massage",
    title: "Traditional Hammam & Massage",
    location: "Marrakech",
    price: "From €50 / person",
    images: gallery(img.spaA, img.spaB, img.spaC),
    shortDescription: "Relaxing Moroccan hammam and massage experience.",
    description: "A wellness experience with hammam, massage, and calm atmosphere after a day exploring Marrakech.",
    highlights: ["Hammam", "Massage", "Relaxation", "Couple option", "Hotel pickup option"],
    details: { Duration: "90 minutes", Service: "Hammam and massage", Pickup: "Optional", Guests: "Solo or couple", Style: "Traditional Moroccan" }
  },
  {
    id: "s2",
    category: "spa",
    slug: "couple-spa-package",
    title: "Couple SPA Package",
    location: "Marrakech",
    price: "From €120 / couple",
    images: gallery(img.spaB, img.spaA, img.spaC),
    shortDescription: "Private couple wellness package.",
    description: "A relaxing option for couples who want hammam, massage, and calm time together.",
    highlights: ["Couple package", "Massage", "Hammam", "Tea", "Reservation support"],
    details: { Duration: "2 hours", Guests: "2", Service: "Hammam and massage", Pickup: "Optional", Style: "Wellness" }
  },
  {
    id: "s3",
    category: "spa",
    slug: "luxury-massage",
    title: "Luxury Massage",
    location: "Marrakech",
    price: "From €70 / person",
    images: gallery(img.spaC, img.spaB, img.spaA),
    shortDescription: "Premium massage reservation support.",
    description: "A premium massage experience for guests looking for relaxation and quality service.",
    highlights: ["Premium massage", "Relaxing atmosphere", "Reservation support", "Solo or couple", "Hotel option later"],
    details: { Duration: "60-90 minutes", Service: "Massage", Guests: "Solo or couple", Booking: "Reservation support", Style: "Premium" }
  },

  {
    id: "r1",
    category: "restaurants",
    slug: "moroccan-rooftop-dinner",
    title: "Moroccan Rooftop Dinner",
    location: "Medina, Marrakech",
    price: "From €40 / person",
    images: gallery(img.restaurantA, img.restaurantB, img.restaurantC, img.restaurantD),
    shortDescription: "Selected rooftop dinner experience in the Medina.",
    description: "A curated restaurant experience for guests who want a memorable dinner with Moroccan atmosphere.",
    highlights: ["Rooftop", "Moroccan cuisine", "Medina", "Reservation support", "Couple friendly"],
    details: { Cuisine: "Moroccan", Area: "Medina", Booking: "Reservation support", BestFor: "Dinner", Atmosphere: "Rooftop" }
  },
  {
    id: "r2",
    category: "restaurants",
    slug: "fine-dining-evening",
    title: "Fine Dining Evening",
    location: "Hivernage",
    price: "From €80 / person",
    images: gallery(img.restaurantB, img.restaurantC, img.restaurantA, img.restaurantD),
    shortDescription: "Premium dinner reservation for special evenings.",
    description: "A refined dining option for couples, business guests, or special celebrations.",
    highlights: ["Fine dining", "Reservation support", "Premium area", "Couple friendly", "Dinner"],
    details: { Cuisine: "International / Moroccan", Area: "Hivernage", Booking: "Reservation support", BestFor: "Special evening", Atmosphere: "Premium" }
  },
  {
    id: "r3",
    category: "restaurants",
    slug: "family-moroccan-lunch",
    title: "Family Moroccan Lunch",
    location: "Marrakech",
    price: "From €25 / person",
    images: gallery(img.restaurantC, img.restaurantD, img.restaurantA, img.restaurantB),
    shortDescription: "Family-friendly Moroccan lunch option.",
    description: "A comfortable restaurant selection for families who want Moroccan dishes and easy logistics.",
    highlights: ["Family friendly", "Moroccan cuisine", "Reservation support", "Lunch", "Group option"],
    details: { Cuisine: "Moroccan", Booking: "Reservation support", BestFor: "Families", Meal: "Lunch", Area: "Marrakech" }
  },
  {
    id: "r4",
    category: "restaurants",
    slug: "show-dinner",
    title: "Dinner with Show",
    location: "Marrakech",
    price: "From €55 / person",
    images: gallery(img.restaurantD, img.restaurantB, img.restaurantA, img.restaurantC),
    shortDescription: "Dinner experience with entertainment.",
    description: "A dinner experience for guests who want food, music, and a lively Marrakech evening.",
    highlights: ["Dinner", "Show", "Music", "Group friendly", "Reservation support"],
    details: { Cuisine: "Moroccan", Atmosphere: "Lively", Booking: "Reservation support", BestFor: "Groups", Meal: "Dinner" }
  }
];

export function getItemsByCategory(category: Category) {
  return catalogItems.filter((item) => item.category === category);
}

export function getFeaturedItems(category: Category, limit = 10) {
  return getItemsByCategory(category).slice(0, limit);
}

export function getItem(category: string, slug: string) {
  return catalogItems.find((item) => item.category === category && item.slug === slug);
}

export function isCategory(value: string): value is Category {
  return Object.keys(categoryLabels).includes(value);
}
