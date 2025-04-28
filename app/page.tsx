import type { Metadata } from "next"
import HeroSection from "./components/hero-section"
import BenefitsSection from "./components/benefits-section"
import HowItWorksSection from "./components/how-it-works-section"
import Footer from "./components/footer"
import Navbar from "./components/navbar"
import { TranslationProvider } from "./components/translation-provider"
import EnvSetupDialog from "./env-setup"

export const metadata: Metadata = {
  title: "Retail Bandhu | FMCG Supply Chain Platform",
  description:
    "Connecting retailers, wholesalers and delivery partners for streamlined FMCG supply chain operations in India",
  keywords: "FMCG India, Retail Bandhu, retail, wholesale, delivery, supply chain",
}

export default function Home() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 pb-16">
          {" "}
          {/* Adjusted for fixed navbar and bottom nav */}
          <HeroSection />
          <BenefitsSection />
          <HowItWorksSection />
        </main>
        <Footer />
        <EnvSetupDialog />
      </div>
    </TranslationProvider>
  )
}
