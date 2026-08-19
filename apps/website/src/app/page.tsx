import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";
import Link from "next/link";
import HomePageContact from "@/components/HomePageContact";

export default function Home() {

  return (
    <>
      <Hero />

      <HorizontalSection category="villas" />
      <HorizontalSection category="transportation" />
      <HorizontalSection category="restaurants" />
      <HorizontalSection category="nightclubs" />
      <HorizontalSection category="beachclubs" />
      <HorizontalSection category="activities" />
      <HorizontalSection category="packs" />

      <HomePageContact />
    </>
  );
}
