"use client"

import type React from "react"

import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Search } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const faqCategories = [
  {
    id: "general",
    title: "General Questions",
    faqs: [
      {
        question: "What is Retail Bandhu?",
        answer:
          "Retail Bandhu is a platform that connects retailers with wholesalers, making it easier for small businesses to source products directly from wholesalers at competitive prices.",
      },
      {
        question: "How do I sign up?",
        answer:
          "You can sign up by clicking on the 'Sign Up' button on the homepage. You'll need to provide your phone number, business details, and choose whether you're a retailer, wholesaler, or delivery partner.",
      },
      {
        question: "Is Retail Bandhu available in my area?",
        answer:
          "Retail Bandhu is currently available in select cities across India. We're expanding rapidly, so if we're not in your area yet, we will be soon!",
      },
      {
        question: "What are the benefits of using Retail Bandhu?",
        answer:
          "Retail Bandhu offers direct connections between retailers and wholesalers, competitive pricing, efficient delivery, digital payments, order tracking, and business analytics to help grow your business.",
      },
    ],
  },
  {
    id: "retailers",
    title: "For Retailers",
    faqs: [
      {
        question: "How do I place an order?",
        answer:
          "To place an order, browse products from wholesalers, add items to your cart, and proceed to checkout. You can choose between Cash on Delivery or UPI payment methods.",
      },
      {
        question: "How do I track my order?",
        answer:
          "You can track your order by going to the Orders section in your dashboard. Each order has a status that indicates where it is in the fulfillment process.",
      },
      {
        question: "What payment methods are accepted?",
        answer: "We currently accept Cash on Delivery (COD) and UPI payments. More payment options will be added soon.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "You can cancel your order if it hasn't been confirmed by the wholesaler yet. Once confirmed, you'll need to contact the wholesaler directly to request cancellation.",
      },
    ],
  },
  {
    id: "wholesalers",
    title: "For Wholesalers",
    faqs: [
      {
        question: "How do I add products?",
        answer:
          "As a wholesaler, you can add products by going to the Products section in your dashboard and clicking on 'Add New Product'. Fill in the product details and save.",
      },
      {
        question: "How do I manage orders?",
        answer:
          "You can manage orders from the Orders section in your dashboard. You can confirm, reject, or mark orders as dispatched from there.",
      },
      {
        question: "How do I get paid?",
        answer:
          "Payments are processed automatically and transferred to your registered bank account. For COD orders, the amount is transferred after delivery confirmation.",
      },
      {
        question: "What fees does Retail Bandhu charge?",
        answer:
          "Retail Bandhu charges a small commission on each successful order. The exact commission rate is available in your account settings.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Logistics",
    faqs: [
      {
        question: "How long does delivery take?",
        answer:
          "Delivery times vary depending on your location and the wholesaler's location. Typically, orders are delivered within 24-48 hours.",
      },
      {
        question: "How can I become a delivery partner?",
        answer:
          "You can sign up as a delivery partner by selecting the 'Delivery Partner' option during registration. You'll need to provide your vehicle details and complete verification.",
      },
      {
        question: "What happens if I'm not available during delivery?",
        answer:
          "If you're not available during delivery, the delivery partner will try to contact you. If unreachable, they'll attempt delivery again the next day.",
      },
      {
        question: "Is there a minimum order value for delivery?",
        answer:
          "Minimum order values may vary by wholesaler. Check the wholesaler's profile for specific minimum order requirements.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Billing",
    faqs: [
      {
        question: "How do I update my payment information?",
        answer:
          "You can update your payment information in your Profile settings. Navigate to the Bank Details section to update your account information.",
      },
      {
        question: "How do I get an invoice for my order?",
        answer:
          "Invoices are automatically generated for each order and can be downloaded from the order details page.",
      },
      {
        question: "What happens if a payment fails?",
        answer:
          "If a payment fails, you'll be notified and can retry the payment. For UPI payments, you can verify the payment by entering the transaction ID.",
      },
      {
        question: "How do I report a payment issue?",
        answer:
          "You can report payment issues through the Help & Support section or by contacting our support team directly.",
      },
    ],
  },
]

function FAQContent() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredFAQs = faqCategories.flatMap((category) => {
    return category.faqs
      .filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((faq) => ({
        ...faq,
        category: category.id,
      }))
  })

  const displayFAQs = searchQuery
    ? filteredFAQs
    : activeCategory === "all"
      ? faqCategories.flatMap((category) => category.faqs.map((faq) => ({ ...faq, category: category.id })))
      : faqCategories
          .filter((category) => category.id === activeCategory)
          .flatMap((category) => category.faqs.map((faq) => ({ ...faq, category: category.id })))

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-500 mb-6">Find answers to common questions about Retail Bandhu</p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for questions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      {!searchQuery && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
            className={activeCategory === "all" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            All
          </Button>
          {faqCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
              className={activeCategory === category.id ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              {category.title}
            </Button>
          ))}
        </div>
      )}

      {displayFAQs.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">No Results Found</h2>
            <p className="text-gray-500 mb-4">We couldn't find any FAQs matching "{searchQuery}".</p>
            <Button onClick={() => setSearchQuery("")} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {searchQuery ? (
            <Accordion type="single" collapsible className="w-full">
              {displayFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            faqCategories
              .filter((category) => activeCategory === "all" || category.id === activeCategory)
              .map((category) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">{category.title}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.id}-item-${index}`}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <p className="text-gray-500 mb-4">Still have questions?</p>
        <Button onClick={() => (window.location.href = "/help")} className="bg-blue-500 hover:bg-blue-600">
          Contact Support
        </Button>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <FAQContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
