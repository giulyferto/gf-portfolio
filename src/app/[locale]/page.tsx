import Hero from "@/components/Hero";
import About from "@/components/About";
import RacketIntro from "@/components/RacketIntro";
import Contact from "@/components/Contact";
import HashSectionSettle from "@/components/HashSectionSettle";

export default function HomePage() {
  return (
    <>
      <HashSectionSettle />
      <Hero />
      <About />
      <RacketIntro />
      <Contact />
    </>
  );
}
