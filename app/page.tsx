import HeroSection from "./components/hero-section"
import BenefitsSection from "./components/benefits-section"
import HowItWorksSection from "./components/how-it-works-section"
import Footer from "./components/footer"
import Navbar from "./components/navbar"
import { TranslationProvider } from "./components/translation-provider"

// Set revalidation time for ISR
export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <HeroSection />
          <BenefitsSection />
          <HowItWorksSection />
        </main>
        <Footer />
      </div>
    </TranslationProvider>
  )
}
