"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TranslationProvider } from "../components/translation-provider"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { Search, Phone, Mail, MessageSquare } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// FAQ data
const faqs = {
  general: [
    {
      question: "What is RetailBandhu?",
      answer:
        "RetailBandhu is a platform that connects retailers with wholesalers, making it easier for retailers to discover and order products directly from wholesalers. It streamlines the ordering process, provides delivery options, and helps manage payments and invoices.",
    },
    {
      question: "How do I sign up for RetailBandhu?",
      answer:
        "You can sign up by clicking the 'Sign Up' button on the homepage or login page. Choose your role (retailer, wholesaler, or delivery partner), enter your phone number, and complete the registration process by providing the required information.",
    },
    {
      question: "Is RetailBandhu available in my area?",
      answer:
        "RetailBandhu is currently available in select cities across India. During the sign-up process, you'll be asked for your PIN code, which will determine if service is available in your area. We're continuously expanding to new regions.",
    },
    {
      question: "What are the benefits of using RetailBandhu?",
      answer:
        "RetailBandhu offers numerous benefits including direct access to wholesalers, competitive pricing, streamlined ordering, efficient delivery, digital payment options, order tracking, and a complete digital record of all transactions for tax and accounting purposes.",
    },
    {
      question: "Is there a fee to use RetailBandhu?",
      answer:
        "RetailBandhu is free for retailers to use. Wholesalers pay a small commission on each order processed through the platform. This commission helps us maintain and improve the platform while providing excellent service to all users.",
    },
  ],
  retailers: [
    {
      question: "How do I place an order?",
      answer:
        "To place an order, log in to your retailer account, browse products from available wholesalers, add items to your cart, and proceed to checkout. You can choose your preferred payment method and delivery options before confirming your order.",
    },
    {
      question: "Can I order from multiple wholesalers at once?",
      answer:
        "Currently, each order must be placed with a single wholesaler. However, you can place multiple orders with different wholesalers in quick succession. This helps ensure efficient delivery and clear communication with each wholesaler.",
    },
    {
      question: "How do I track my order?",
      answer:
        "You can track your order by going to the 'Orders' section in your dashboard. Each order will show its current status, from placement to delivery. You'll also receive notifications when your order status changes.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "RetailBandhu accepts various payment methods including Cash on Delivery (COD), UPI payments, and online banking. You can choose your preferred payment method during checkout.",
    },
    {
      question: "How do I return or exchange products?",
      answer:
        "If you need to return or exchange products, contact the wholesaler directly through the chat feature within 24 hours of receiving your order. The wholesaler will guide you through their return or exchange process.",
    },
  ],
  wholesalers: [
    {
      question: "How do I list my products on RetailBandhu?",
      answer:
        "After signing up and getting approved as a wholesaler, you can add your products by going to the 'Products' section in your dashboard. Click 'Add Product' and fill in the required details including name, description, price, stock quantity, and images.",
    },
    {
      question: "How do I manage incoming orders?",
      answer:
        "You can manage incoming orders from the 'Orders' section in your dashboard. New orders will appear with a 'Pending' status. You can confirm or reject orders, update their status as they're processed, and communicate with retailers if needed.",
    },
    {
      question: "How and when do I get paid?",
      answer:
        "Payment depends on the method chosen by the retailer. For COD orders, the delivery partner collects payment and it's transferred to your account after deducting the platform commission. For online payments, the amount is credited to your account within 2-3 business days after order delivery.",
    },
    {
      question: "Can I set my own delivery area?",
      answer:
        "Yes, you can set your delivery area by specifying the PIN codes you serve. This ensures that only retailers within your service area can place orders with you.",
    },
    {
      question: "How do I handle returns or exchanges?",
      answer:
        "When a retailer requests a return or exchange, you'll receive a notification. You can communicate with the retailer through the chat feature to resolve the issue. Once agreed, you can arrange for the product to be picked up and process the return or exchange accordingly.",
    },
  ],
  delivery: [
    {
      question: "How do I become a delivery partner?",
      answer:
        "To become a delivery partner, sign up on the platform, select the 'Delivery Partner' role, and complete the registration process. You'll need to provide personal details, vehicle information, and banking details for payments. After verification, you can start accepting delivery assignments.",
    },
    {
      question: "How do I get delivery assignments?",
      answer:
        "Delivery assignments are available in the 'Assignments' section of your dashboard. You can view available assignments in your area and accept the ones you want to fulfill. Assignments are allocated based on your location, vehicle type, and performance rating.",
    },
    {
      question: "How do I get paid for deliveries?",
      answer:
        "You'll receive payment for each successful delivery. For COD orders, you'll collect the payment from the retailer and deposit it through the app. Your delivery fee will be credited to your account weekly. For online payment orders, your delivery fee is credited directly to your account.",
    },
    {
      question: "What if I can't complete a delivery?",
      answer:
        "If you're unable to complete a delivery, update the status in the app with the reason. If it's due to the retailer not being available, you can reschedule the delivery. If there's an issue with the order, contact customer support for assistance.",
    },
    {
      question: "How is my performance evaluated?",
      answer:
        "Your performance is evaluated based on several factors including on-time delivery rate, customer feedback, order handling, and professionalism. Maintaining a high performance rating will give you priority for premium delivery assignments.",
    },
  ],
}

function SearchFAQ() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ category: string; question: string; answer: string }[]>([])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results: { category: string; question: string; answer: string }[] = []

    Object.entries(faqs).forEach(([category, questions]) => {
      questions.forEach((faq) => {
        if (faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)) {
          results.push({
            category,
            question: faq.question,
            answer: faq.answer,
          })
        }
      })
    })

    setSearchResults(results)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-12"
          />
        </div>
        <Button onClick={handleSearch} className="h-12 bg-blue-500 hover:bg-blue-600">
          Search
        </Button>
      </div>

      {searchResults.length > 0 ? (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Search Results ({searchResults.length})</h3>
          <Accordion type="single" collapsible className="w-full">
            {searchResults.map((result, index) => (
              <AccordionItem key={index} value={`result-${index}`}>
                <AccordionTrigger className="text-left">
                  <div>
                    <span className="font-medium">{result.question}</span>
                    <span className="text-sm text-gray-500 block">
                      Category: {result.category.charAt(0).toUpperCase() + result.category.slice(1)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>{result.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : searchQuery.trim() !== "" ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No results found for "{searchQuery}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords or browse the categories below</p>
        </div>
      ) : null}
    </div>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you soon.",
      })
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      })
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Your Name
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter your name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone Number
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          placeholder="How can we help you?"
          rows={5}
        />
      </div>

      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}

function HelpContent() {
  return (
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How Can We Help You?</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Find answers to common questions or contact our support team for assistance.
        </p>
      </div>

      <Card className="mb-12">
        <CardContent className="pt-6">
          <SearchFAQ />
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="mb-12">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="retailers">For Retailers</TabsTrigger>
          <TabsTrigger value="wholesalers">For Wholesalers</TabsTrigger>
          <TabsTrigger value="delivery">For Delivery Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.general.map((faq, index) => (
                  <AccordionItem key={index} value={`general-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retailers">
          <Card>
            <CardHeader>
              <CardTitle>For Retailers</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.retailers.map((faq, index) => (
                  <AccordionItem key={index} value={`retailers-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wholesalers">
          <Card>
            <CardHeader>
              <CardTitle>For Wholesalers</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.wholesalers.map((faq, index) => (
                  <AccordionItem key={index} value={`wholesalers-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>For Delivery Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.delivery.map((faq, index) => (
                  <AccordionItem key={index} value={`delivery-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Phone Support</h3>
                <p className="text-gray-600 mt-1">Available Monday to Saturday, 9am to 6pm</p>
                <p className="text-lg font-medium mt-2">+91 1800-123-4567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Email Support</h3>
                <p className="text-gray-600 mt-1">We'll respond within 24 hours</p>
                <p className="text-lg font-medium mt-2">support@retailbandhu.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Live Chat</h3>
                <p className="text-gray-600 mt-1">Chat with our support team in real-time</p>
                <Button asChild className="mt-2 bg-blue-500 hover:bg-blue-600">
                  <Link href="/chat">Start Chat</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <HelpContent />
        </main>
        <Footer />
        <Toaster />
      </div>
    </TranslationProvider>
  )
}
