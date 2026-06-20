import "dotenv/config";
import { PrismaClient, ProductType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const productTypes = [
  ProductType.VILLA,
  ProductType.SWIMMINGPOOL,
  ProductType.ACTIVITY,
  ProductType.SPA,
  ProductType.TRANSPORTATION,
  ProductType.RESTAURANT,
];

const imageByType: Record<ProductType, string> = {
  VILLA:
    "https://plus.unsplash.com/premium_photo-1747993829324-0fdb25190235",

  TRANSPORTATION:
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8",

  SWIMMINGPOOL:
    "https://plus.unsplash.com/premium_photo-1684175656320-5c3f701c082c",

  ACTIVITY:
    "https://images.unsplash.com/photo-1671804079626-4aaafa95184e",

  SPA:
    "https://plus.unsplash.com/premium_photo-1679430887921-31e1047e5b55",

  RESTAURANT:
    "https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b",
};

function createProduct(type: ProductType, index: number) {
  return {
    uniqueCode: `${type}_${String(index).padStart(3, "0")}`,
    type,
    priceEuro: 100 + index * 10,
    order: index <= 10 ? index : null,
    thumbnail: imageByType[type],

    titleFR: `${type} ${index}`,
    titleEN: `${type} ${index}`,
    titleDE: `${type} ${index}`,
    titleIT: `${type} ${index}`,
    titlePT: `${type} ${index}`,
    titleES: `${type} ${index}`,

    subtitleFR: `Sous-titre ${type} ${index}`,
    subtitleEN: `Subtitle ${type} ${index}`,
    subtitleDE: `Untertitel ${type} ${index}`,
    subtitleIT: `Sottotitolo ${type} ${index}`,
    subtitlePT: `Subtítulo ${type} ${index}`,
    subtitleES: `Subtítulo ${type} ${index}`,

    priceTitleFR: "À partir de",
    priceTitleEN: "From",
    priceTitleDE: "Ab",
    priceTitleIT: "Da",
    priceTitlePT: "A partir de",
    priceTitleES: "Desde",

    descriptionFR: `Description FR ${type} ${index}`,
    descriptionEN: `Description EN ${type} ${index}`,
    descriptionDE: `Description DE ${type} ${index}`,
    descriptionIT: `Description IT ${type} ${index}`,
    descriptionPT: `Description PT ${type} ${index}`,
    descriptionES: `Description ES ${type} ${index}`,

    addressFR: "Marrakech, Maroc",
    addressEN: "Marrakech, Morocco",
    addressDE: "Marrakesch, Marokko",
    addressIT: "Marrakech, Marocco",
    addressPT: "Marrakech, Marrocos",
    addressES: "Marrakech, Marruecos",

    tagsFR: ["Luxe", "Confort", "Marrakech"],
    tagsEN: ["Luxury", "Comfort", "Marrakech"],
    tagsDE: ["Luxus", "Komfort", "Marrakesch"],
    tagsIT: ["Lusso", "Comfort", "Marrakech"],
    tagsPT: ["Luxo", "Conforto", "Marrakech"],
    tagsES: ["Lujo", "Comodidad", "Marrakech"],

    detailsFR: [{ label: "Capacité", value: "10 personnes" }],
    detailsEN: [{ label: "Capacity", value: "10 guests" }],
    detailsDE: [{ label: "Kapazität", value: "10 Gäste" }],
    detailsIT: [{ label: "Capacità", value: "10 ospiti" }],
    detailsPT: [{ label: "Capacidade", value: "10 hóspedes" }],
    detailsES: [{ label: "Capacidad", value: "10 huéspedes" }],

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
    image16: imageByType[type]
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
  console.log("Products inserted:", count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });