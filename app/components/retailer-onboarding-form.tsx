"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "./translation-provider"
import { VoiceEnabledInput } from "./voice-enabled-input"
import { PinCodeLookup, type LocationData } from "./pin-code-lookup"
import { Loader2, ArrowRight, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"

// Define the form schema with Zod
const formSchema = z.object({
  shopName: z.string().min(3, {
    message: "Shop name must be at least 3 characters.",
  }),
  ownerName: z.string().min(3, {
    message: "Owner name must be at least 3 characters.",
  }),
  phoneNumber: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be 10 digits.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  pinCode: z.string().regex(/^\d{6}$/, {
    message: "PIN code must be 6 digits.",
  }),
  address: z.string().min(10, {
    message: "Address must be at least 10 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  shopType: z.string().min(1, {
    message: "Please select a shop type.",
  }),
  gstNumber: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function RetailerOnboardingForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationData, setLocationData] = useState<LocationData | null>(null)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopName: "",
      ownerName: "",
      phoneNumber: "",
      email: user?.email || "",
      pinCode: "",
      address: "",
      city: "",
      state: "",
      shopType: "",
      gstNumber: "",
    },
  })

  // Handle PIN code lookup
  const handlePinCodeFound = (pinCode: string, location: LocationData) => {
    setLocationData(location)

    // Update form values
    form.setValue("pinCode", pinCode)

    if (location.city) {
      form.setValue("city", location.city)
    }

    if (location.state) {
      form.setValue("state", location.state)
    }

    if (location.fullAddress) {
      form.setValue("address", location.fullAddress)
    }
  }

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      // In a real app, you would save this data to your database
      if (user) {
        // Update user profile with retailer information
        const { error } = await supabase.from("retailer_profiles").insert({
          user_id: user.id,
          shop_name: values.shopName,
          owner_name: values.ownerName,
          phone_number: values.phoneNumber,
          email: values.email,
          pin_code: values.pinCode,
          address: values.address,
          city: values.city,
          state: values.state,
          shop_type: values.shopType,
          gst_number: values.gstNumber || null,
          onboarding_completed: true,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
        })

        if (error) {
          console.error("Error saving retailer profile:", error)
          throw new Error(t("onboarding.errorSaving"))
        }

        // Update user role if needed
        if (user.role !== "retailer") {
          const { error: roleError } = await supabase.from("users").update({ role: "retailer" }).eq("id", user.id)

          if (roleError) {
            console.error("Error updating user role:", roleError)
          }
        }
      }

      // Redirect to retailer dashboard
      router.push("/retailer/dashboard")
    } catch (error) {
      console.error("Error during onboarding:", error)
      // In a real app, you would show an error message to the user
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step
  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof FormValues)[] = []

    if (step === 1) {
      fieldsToValidate = ["shopName", "ownerName", "phoneNumber", "email"]
    } else if (step === 2) {
      fieldsToValidate = ["pinCode", "address", "city", "state"]
    }

    const result = await form.trigger(fieldsToValidate as any)

    if (result) {
      setStep(step + 1)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setStep(step - 1)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("onboarding.retailer.title")}</CardTitle>
        <CardDescription>{t("onboarding.retailer.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("onboarding.step1Title")}</h3>

                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.shopName")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder={t("onboarding.shopNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormDescription>{t("onboarding.shopNameDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.ownerName")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder={t("onboarding.ownerNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.phoneNumber")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder="9876543210" type="tel" maxLength={10} {...field} />
                      </FormControl>
                      <FormDescription>{t("onboarding.phoneNumberDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.email")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder="example@email.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Location Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("onboarding.step2Title")}</h3>

                <PinCodeLookup onPinCodeFound={handlePinCodeFound} className="mb-6" />

                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.pinCode")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder="400001" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.address")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder={t("onboarding.addressPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.city")}</FormLabel>
                        <FormControl>
                          <VoiceEnabledInput placeholder={t("onboarding.cityPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.state")}</FormLabel>
                        <FormControl>
                          <VoiceEnabledInput placeholder={t("onboarding.statePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Business Information */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("onboarding.step3Title")}</h3>

                <FormField
                  control={form.control}
                  name="shopType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.shopType")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("onboarding.selectShopType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="grocery">{t("onboarding.shopTypes.grocery")}</SelectItem>
                          <SelectItem value="general_store">{t("onboarding.shopTypes.generalStore")}</SelectItem>
                          <SelectItem value="pharmacy">{t("onboarding.shopTypes.pharmacy")}</SelectItem>
                          <SelectItem value="electronics">{t("onboarding.shopTypes.electronics")}</SelectItem>
                          <SelectItem value="clothing">{t("onboarding.shopTypes.clothing")}</SelectItem>
                          <SelectItem value="hardware">{t("onboarding.shopTypes.hardware")}</SelectItem>
                          <SelectItem value="other">{t("onboarding.shopTypes.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>{t("onboarding.shopTypeDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.gstNumber")}</FormLabel>
                      <FormControl>
                        <VoiceEnabledInput placeholder="22AAAAA0000A1Z5" {...field} />
                      </FormControl>
                      <FormDescription>{t("onboarding.gstNumberDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handlePrevious}>
            {t("onboarding.previous")}
          </Button>
        ) : (
          <div></div> // Empty div to maintain layout
        )}

        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            {t("onboarding.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("onboarding.submitting")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("onboarding.submit")}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
