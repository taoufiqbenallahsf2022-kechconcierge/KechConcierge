import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";
import Link from "next/link";
import Highlights from "@/components/Highlights";
import HomePageContact from "@/components/HomePageContact";

export default function Home() {

  return (
    <>
      <Hero />

      <Highlights />

      <HorizontalSection category="villas" />
      <HorizontalSection category="swimmingpools" />
      <HorizontalSection category="activities" />
      <HorizontalSection category="transportation" />
      <HorizontalSection category="spa" />
      <HorizontalSection category="restaurants" />

      <HomePageContact />
    </>
  );
}
