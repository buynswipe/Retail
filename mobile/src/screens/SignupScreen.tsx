"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../contexts/TranslationContext"
import { Text, TextInput, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Store, Truck, Package } from "lucide-react-native"

const SignupScreen: React.FC = () => {
  const navigation = useNavigation()
  const { signup, verifyOtp } = useAuth()
  const { t, language, setLanguage } = useTranslation()

  const [step, setStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // For demo, we'll just move to the next step
      setStep(2)
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error sending OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // For demo, we'll just move to the next step
      setStep(3)
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error verifying OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!role) {
      setError("Please select a role")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await signup(phoneNumber, role)

      if (result.success) {
        // Navigate to onboarding
        navigation.navigate("Onboarding" as never, { role } as never)
      } else {
        setError(result.error || "Failed to create account. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error signing up:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en")
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>RetailBandhu</Text>
          </View>

          <View style={styles.languageToggle}>
            <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
              <Text style={styles.languageText}>{language === "en" ? "हिंदी" : "English"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("signup.title")}</Text>
            <Text style={styles.cardSubtitle}>
              {step === 1 && t("enter.phone")}
              {step === 2 && t("enter.otp")}
              {step === 3 && t("select.role")}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {step === 1 && (
              <>
                <TextInput
                  label={t("phone")}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={styles.input}
                  maxLength={10}
                />
                <Button
                  mode="contained"
                  onPress={handleSendOtp}
                  loading={isLoading}
                  disabled={isLoading || phoneNumber.length !== 10}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t("send.otp")}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <TextInput
                  label={t("otp")}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  mode="outlined"
                  style={styles.input}
                  maxLength={6}
                />
                <Button
                  mode="contained"
                  onPress={handleVerifyOtp}
                  loading={isLoading}
                  disabled={isLoading || otp.length !== 6}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t("verify")}
                </Button>

                <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                  <Text style={styles.backText}>← Back to phone number</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 3 && (
              <>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleCard, role === "retailer" && styles.roleCardSelected]}
                    onPress={() => setRole("retailer")}
                  >
                    <View style={styles.roleIconContainer}>
                      <Store color={role === "retailer" ? "#1E40AF" : "#6B7280"} size={32} />
                    </View>
                    <Text style={styles.roleTitle}>{t("benefits.retailer.title")}</Text>
                    <Text style={styles.roleDescription}>{t("benefits.retailer.description")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleCard, role === "wholesaler" && styles.roleCardSelected]}
                    onPress={() => setRole("wholesaler")}
                  >
                    <View style={styles.roleIconContainer}>
                      <Package color={role === "wholesaler" ? "#1E40AF" : "#6B7280"} size={32} />
                    </View>
                    <Text style={styles.roleTitle}>{t("benefits.wholesaler.title")}</Text>
                    <Text style={styles.roleDescription}>{t("benefits.wholesaler.description")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleCard, role === "delivery" && styles.roleCardSelected]}
                    onPress={() => setRole("delivery")}
                  >
                    <View style={styles.roleIconContainer}>
                      <Truck color={role === "delivery" ? "#1E40AF" : "#6B7280"} size={32} />
                    </View>
                    <Text style={styles.roleTitle}>{t("benefits.delivery.title")}</Text>
                    <Text style={styles.roleDescription}>{t("benefits.delivery.description")}</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSignup}
                  loading={isLoading}
                  disabled={isLoading || !role}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t("continue")}
                </Button>

                <TouchableOpacity onPress={() => setStep(2)} style={styles.backLink}>
                  <Text style={styles.backText}>← Back to verification</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login" as never)}>
                <Text style={styles.loginLink}>{t("login.title")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#1E40AF",
  },
  languageToggle: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  languageButton: {
    padding: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  languageText: {
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  button: {
    marginBottom: 20,
    backgroundColor: "#1E40AF",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 15,
    textAlign: "center",
  },
  backLink: {
    alignSelf: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#6B7280",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#6B7280",
    marginRight: 5,
  },
  loginLink: {
    color: "#1E40AF",
    fontWeight: "bold",
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  roleCardSelected: {
    borderColor: "#1E40AF",
    backgroundColor: "#EBF4FF",
  },
  roleIconContainer: {
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  roleDescription: {
    color: "#6B7280",
  },
})

export default SignupScreen
