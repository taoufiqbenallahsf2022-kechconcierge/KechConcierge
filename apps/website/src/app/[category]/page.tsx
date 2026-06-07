import { notFound } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import { categoryDescriptions, categoryLabels, getItemsByCategory, isCategory } from "@/lib/catalog";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 12;

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { page } = await searchParams;

  if (!isCategory(category)) notFound();

  const currentPage = Math.max(Number(page || "1"), 1);
  const items = getItemsByCategory(category);
  const totalPages = Math.max(Math.ceil(items.length / PAGE_SIZE), 1);
  const visibleItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">Catalog</p>
      <h1 className="mt-3 text-5xl font-black text-zinc-950">{categoryLabels[category]}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">{categoryDescriptions[category]}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        {Array.from({ length: totalPages }).map((_, index) => {
          const value = index + 1;
          return (
            <a key={value} href={`/${category}?page=${value}`} className={`grid h-11 w-11 place-items-center rounded-full font-black ${currentPage === value ? "bg-orange-600 text-white" : "bg-white text-zinc-900"}`}>
              {value}
            </a>
          );
        })}
      </div>
    </section>
  );
}
