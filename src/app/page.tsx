import DarkHero from "@/components/DarkHero";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import AccountButton from "@/components/AccountButton";

export default function Home() {
  return (
    <main id="top">
      <AccountButton />
      <DarkHero />
      <HowItWorks />
      <Footer />
    </main>
  );
}
